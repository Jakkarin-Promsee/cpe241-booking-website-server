const { pool } = require('../db/pool');

async function findAll({ venueId, date } = {}) {
  let sql = `
    SELECT
      sg.showing_id, sg.show_id, sg.venues_id, sg.status,
      sg.showtime_date, sg.start_time, sg.end_time, sg.booking_date, sg.language,
      st.showtime_title AS movie_title, st.duration,
      v.venues_name
    FROM showing sg
    JOIN showtimes st ON sg.show_id = st.show_id
    JOIN venues   v  ON sg.venues_id = v.venues_id
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
  sql += ' ORDER BY sg.showtime_date ASC, sg.start_time ASC';
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

async function create({ showId, venueId, status, showtimeDate, startTime, endTime, bookingDate, language }) {
  const [result] = await pool.query(
    `INSERT INTO showing
       (show_id, venues_id, status, showtime_date, start_time, end_time, booking_date, language)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [showId, venueId, status, showtimeDate, startTime, endTime, bookingDate || null, language || null]
  );
  return result.insertId;
}

async function update(id, { showId, venueId, status, showtimeDate, startTime, endTime, bookingDate, language }) {
  const [result] = await pool.query(
    `UPDATE showing
     SET show_id = ?, venues_id = ?, status = ?,
         showtime_date = ?, start_time = ?, end_time = ?,
         booking_date = ?, language = ?
     WHERE showing_id = ?`,
    [showId, venueId, status, showtimeDate, startTime, endTime, bookingDate || null, language || null, id]
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

async function createWithSeats({ showId, venueId, status, showtimeDate, startTime, endTime, bookingDate, language }, seatPrice) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO showing (show_id, venues_id, status, showtime_date, start_time, end_time, booking_date, language)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [showId, venueId, status, showtimeDate, startTime, endTime, bookingDate || null, language || null]
    );
    const showingId = result.insertId;
    await conn.query(
      `INSERT INTO reserved_seats (showing_id, seat_id, status, seat_price)
       SELECT ?, cs.seat_id, 'Free', ?
       FROM contain_seats cs
       WHERE cs.venues_id = ?`,
      [showingId, seatPrice, venueId]
    );
    await conn.commit();
    return showingId;
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

async function hasBookings(showingId) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS cnt FROM booking WHERE showing_id = ?',
    [showingId]
  );
  return rows[0].cnt > 0;
}

module.exports = {
  findAll, findById, create, update, remove,
  checkOverlap, populateReservedSeats, createWithSeats, deleteReservedSeats, hasBookings,
};
