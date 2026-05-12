const { pool } = require('../db/pool');

async function findAll({ venueId, date, showId } = {}) {
  let sql = `
    SELECT
      sg.showing_id, sg.show_id, sg.venues_id, sg.status,
      sg.showtime_date, sg.start_time, sg.end_time,
      sg.ad_minutes, sg.cleanup_minutes,
      sg.booking_date, sg.language,
      st.showtime_title AS movie_title, st.duration,
      v.venues_name,
      COALESCE(SUM(rs.status IN ('Reserved', 'Confirmed')), 0) AS sold,
      COUNT(rs.seat_id) AS capacity
    FROM showing sg
    JOIN showtimes st ON sg.show_id = st.show_id
    JOIN venues   v  ON sg.venues_id = v.venues_id
    LEFT JOIN reserved_seats rs ON rs.showing_id = sg.showing_id
    WHERE 1=1
  `;
  const params = [];
  if (venueId) {
    sql += ' AND sg.venues_id = ?';
    params.push(venueId);
  }
  if (date) {
    sql += ' AND sg.showtime_date = ?';
    params.push(date);
  }
  if (showId) {
    sql += ' AND sg.show_id = ?';
    params.push(showId);
  }
  sql += `
    GROUP BY
      sg.showing_id, sg.show_id, sg.venues_id, sg.status,
      sg.showtime_date, sg.start_time, sg.end_time,
      sg.ad_minutes, sg.cleanup_minutes,
      sg.booking_date, sg.language,
      st.showtime_title, st.duration, v.venues_name
    ORDER BY sg.showtime_date ASC, sg.start_time ASC
  `;
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT * FROM showing WHERE showing_id = ?',
    [id]
  );
  return rows[0] || null;
}

async function create({
  showId, venueId, status, showtimeDate, startTime, endTime,
  adMinutes, cleanupMinutes, bookingDate, language,
}) {
  const [result] = await pool.query(
    `INSERT INTO showing
       (show_id, venues_id, status, showtime_date, start_time, end_time,
        ad_minutes, cleanup_minutes, booking_date, language)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      showId, venueId, status, showtimeDate, startTime, endTime,
      adMinutes, cleanupMinutes, bookingDate || null, language || null,
    ]
  );
  return result.insertId;
}

async function update(id, {
  showId, venueId, status, showtimeDate, startTime, endTime,
  adMinutes, cleanupMinutes, bookingDate, language,
}) {
  const [result] = await pool.query(
    `UPDATE showing
     SET show_id = ?, venues_id = ?, status = ?,
         showtime_date = ?, start_time = ?, end_time = ?,
         ad_minutes = ?, cleanup_minutes = ?,
         booking_date = ?, language = ?
     WHERE showing_id = ?`,
    [
      showId, venueId, status, showtimeDate, startTime, endTime,
      adMinutes, cleanupMinutes, bookingDate || null, language || null, id,
    ]
  );
  return result.affectedRows;
}

async function remove(id) {
  const [result] = await pool.query(
    'DELETE FROM showing WHERE showing_id = ?',
    [id]
  );
  return result.affectedRows;
}

async function checkOverlap({ venueId, showtimeDate, startTime, endTime, excludeId }) {
  let sql = `
    SELECT COUNT(*) AS cnt FROM showing
    WHERE venues_id    = ?
      AND showtime_date = ?
      AND start_time   < ?
      AND end_time     > ?
  `;
  const params = [venueId, showtimeDate, endTime, startTime];
  if (excludeId) {
    sql += ' AND showing_id != ?';
    params.push(excludeId);
  }
  const [rows] = await pool.query(sql, params);
  return rows[0].cnt > 0;
}

async function populateReservedSeats(showingId, venueId, seatPrice) {
  await pool.query(
    `INSERT INTO reserved_seats (showing_id, seat_id, status, seat_price)
     SELECT ?, cs.seat_id, 'Free', ?
     FROM contain_seats cs
     WHERE cs.venues_id = ?`,
    [showingId, seatPrice, venueId]
  );
}

async function listSeatIdsByVenue(venueId, conn = pool) {
  const [rows] = await conn.query(
    `SELECT seat_id
     FROM contain_seats
     WHERE venues_id = ?`,
    [venueId]
  );
  return rows.map((r) => Number(r.seat_id));
}

// Fix 3: overlap check is now inside the transaction using FOR UPDATE, eliminating
// the TOCTOU race between checkOverlap() and the INSERT in the service layer.
async function createWithSeatPricing(
  {
    showId, venueId, status, showtimeDate, startTime, endTime,
    adMinutes, cleanupMinutes, bookingDate, language,
  },
  defaultSeatPrice,
  seatPricing
) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [conflicts] = await conn.query(
      `SELECT showing_id FROM showing
       WHERE venues_id     = ?
         AND showtime_date = ?
         AND start_time    < ?
         AND end_time      > ?
       FOR UPDATE`,
      [venueId, showtimeDate, endTime, startTime]
    );
    if (conflicts.length > 0) {
      const err = new Error('Time slot overlaps with an existing showing in this venue');
      err.statusCode = 409;
      throw err;
    }

    const [result] = await conn.query(
      `INSERT INTO showing (
         show_id, venues_id, status, showtime_date, start_time, end_time,
         ad_minutes, cleanup_minutes, booking_date, language
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        showId, venueId, status, showtimeDate, startTime, endTime,
        adMinutes, cleanupMinutes, bookingDate || null, language || null,
      ]
    );
    const showingId = result.insertId;
    const seatIds = await listSeatIdsByVenue(venueId, conn);
    const priceMap = new Map(
      (Array.isArray(seatPricing) ? seatPricing : []).map((item) => [
        Number(item.seatId),
        Number(item.seatPrice),
      ])
    );
    if (seatIds.length > 0) {
      const values = seatIds.map((seatId) => [
        showingId,
        seatId,
        'Free',
        priceMap.get(seatId) ?? defaultSeatPrice,
      ]);
      await conn.query(
        'INSERT INTO reserved_seats (showing_id, seat_id, status, seat_price) VALUES ?',
        [values]
      );
    }
    await conn.commit();
    return showingId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Fix 2: status is intentionally NOT reset here — only seat_price is updated.
// Resetting status to 'Free' would silently unbook Reserved/Confirmed seats.
// All updates are wrapped in one transaction to prevent partial state on failure.
async function updateReservedSeatPricing(showingId, seatPricing) {
  const items = Array.isArray(seatPricing) ? seatPricing : [];
  if (items.length === 0) return;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const item of items) {
      await conn.query(
        `UPDATE reserved_seats
         SET seat_price = ?
         WHERE showing_id = ? AND seat_id = ?`,
        [item.seatPrice, showingId, item.seatId]
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function deleteReservedSeats(showingId) {
  await pool.query(
    'DELETE FROM reserved_seats WHERE showing_id = ?',
    [showingId]
  );
}

// Fix 4: deletes reserved_seats and showing in one transaction so a partial
// failure cannot leave orphaned reserved_seats rows.
async function removeWithSeats(showingId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM reserved_seats WHERE showing_id = ?', [showingId]);
    await conn.query('DELETE FROM showing WHERE showing_id = ?', [showingId]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function hasBookings(showingId) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS cnt FROM booking WHERE showing_id = ?',
    [showingId]
  );
  return rows[0].cnt > 0;
}

async function findMovieDurationById(showId) {
  const [rows] = await pool.query(
    'SELECT duration FROM showtimes WHERE show_id = ?',
    [showId]
  );
  if (!rows[0]) return null;
  return Number(rows[0].duration) || 0;
}

async function listSeatsForShowing(showingId) {
  const [rows] = await pool.query(
    `SELECT rs.seat_id, rs.status, rs.seat_price, s.seat_number
     FROM reserved_seats rs
     JOIN seats s ON s.seat_id = rs.seat_id
     WHERE rs.showing_id = ?
     ORDER BY s.seat_number`,
    [showingId]
  );
  return rows;
}

module.exports = {
  findAll, findById, create, update, remove,
  checkOverlap, populateReservedSeats, listSeatIdsByVenue,
  createWithSeatPricing, updateReservedSeatPricing,
  deleteReservedSeats, removeWithSeats, hasBookings,
  findMovieDurationById,
  listSeatsForShowing,
};
