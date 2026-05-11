const { pool } = require('../db/pool');

async function getStats() {
  const today = new Date().toISOString().split('T')[0];

  const [[activeMovies]] = await pool.query(
    "SELECT COUNT(*) AS count FROM showtimes WHERE status = 'Active'"
  );

  const [[onlineScreens]] = await pool.query(
    "SELECT COUNT(*) AS count FROM showing WHERE showtime_date = ? AND status IN ('Ontime', 'Full')",
    [today]
  );

  const [[todayBookings]] = await pool.query(
    "SELECT COUNT(*) AS count FROM booking WHERE date = ?",
    [today]
  );

  const [[todayRevenue]] = await pool.query(
    `SELECT COALESCE(SUM(rs.seat_price), 0) AS total
     FROM booking b
     JOIN booking_items  bi ON bi.booking_id = b.booking_id
     JOIN reserved_seats rs ON rs.showing_id = b.showing_id
                            AND rs.seat_id   = bi.seat_id
     WHERE b.date = ? AND b.status = 'Successful'`,
    [today]
  );

  return {
    activeMovies:  activeMovies.count,
    onlineScreens: onlineScreens.count,
    todayBookings: todayBookings.count,
    todayRevenue:  Number(todayRevenue.total),
  };
}

async function getTrend() {
  const [rows] = await pool.query(
    `SELECT DATE(b.date) AS day, COUNT(*) AS count
     FROM booking b
     WHERE b.date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY DATE(b.date)
     ORDER BY day ASC`
  );
  return rows;
}

async function getUpcoming() {
  const today = new Date().toISOString().split('T')[0];
  const [rows] = await pool.query(
    `SELECT
       st.showtime_title                                                   AS movie,
       v.venues_name                                                       AS screen,
       sg.start_time                                                       AS time,
       SUM(rs.status IN ('Reserved', 'Confirmed'))                        AS sold,
       COUNT(rs.seat_id)                                                   AS capacity
     FROM showing       sg
     JOIN showtimes     st ON sg.show_id   = st.show_id
     JOIN venues        v  ON sg.venues_id = v.venues_id
     LEFT JOIN reserved_seats rs ON rs.showing_id = sg.showing_id
     WHERE sg.showtime_date = ?
     GROUP BY sg.showing_id, st.showtime_title, v.venues_name, sg.start_time
     ORDER BY sg.start_time ASC`,
    [today]
  );
  return rows;
}

module.exports = { getStats, getTrend, getUpcoming };
