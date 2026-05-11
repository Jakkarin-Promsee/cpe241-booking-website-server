const { pool } = require('../db/pool');

async function findAll({ search, status, dateFrom, dateTo, page = 1, limit = 50, } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const safePage  = Math.max(Number(page) || 1, 1);
  let sql = `
    SELECT
      b.booking_id,
      b.date,
      b.time,
      b.status,
      b.payment_proof_url,
      up.username        AS customer,
      up.display_name,
      st.showtime_title  AS movie,
      sg.showtime_date,
      sg.start_time,
      COUNT(bi.seat_id)               AS seats,
      COALESCE(SUM(rs.seat_price), 0) AS amount
    FROM booking b
    JOIN users_profile up ON b.user_id    = up.user_id
    JOIN showing       sg ON b.showing_id = sg.showing_id
    JOIN showtimes     st ON sg.show_id   = st.show_id
    LEFT JOIN booking_items  bi ON bi.booking_id = b.booking_id
    LEFT JOIN reserved_seats rs ON rs.showing_id = b.showing_id
                                AND rs.seat_id   = bi.seat_id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    sql += ' AND (up.username LIKE ? OR up.display_name LIKE ? OR st.showtime_title LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status) {
    const statuses = String(status)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (statuses.length === 1) {
      sql += ' AND b.status = ?';
      params.push(statuses[0]);
    } else if (statuses.length > 1) {
      sql += ` AND b.status IN (${statuses.map(() => '?').join(',')})`;
      params.push(...statuses);
    }
  }
  if (dateFrom) {
    sql += ' AND b.date >= ?';
    params.push(dateFrom);
  }
  if (dateTo) {
    sql += ' AND b.date <= ?';
    params.push(dateTo);
  }

  sql += `
    GROUP BY
      b.booking_id, b.date, b.time, b.status, b.payment_proof_url,
      up.username, up.display_name, st.showtime_title,
      sg.showtime_date, sg.start_time
    ORDER BY b.date DESC, b.time DESC
    LIMIT ? OFFSET ?
  `;
  params.push(safeLimit, (safePage - 1) * safeLimit);

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT * FROM booking WHERE booking_id = ?',
    [id]
  );
  return rows[0] || null;
}

async function cancel(bookingId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [items] = await conn.query(
      `SELECT bi.seat_id, b.showing_id
       FROM booking_items bi
       JOIN booking b ON bi.booking_id = b.booking_id
       WHERE bi.booking_id = ?`,
      [bookingId]
    );

    if (items.length > 0) {
      const showingId = items[0].showing_id;
      const seatIds   = items.map(i => i.seat_id);
      await conn.query(
        'UPDATE reserved_seats SET status = ? WHERE showing_id = ? AND seat_id IN (?)',
        ['Free', showingId, seatIds]
      );
    }

    await conn.query(
      'UPDATE booking SET status = ? WHERE booking_id = ?',
      ['Cancel', bookingId]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { findAll, findById, cancel };
