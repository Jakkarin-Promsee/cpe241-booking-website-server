const { pool } = require('../db/pool');

async function getStats() {
  const [[activeMovies]] = await pool.query(
    "SELECT COUNT(*) AS count FROM showtimes WHERE status = 'Active'"
  );

  const [[onlineScreens]] = await pool.query(
    "SELECT COUNT(*) AS count FROM showing WHERE showtime_date = CURDATE() AND status IN ('Ontime', 'Full')"
  );

  const [[todayBookings]] = await pool.query(
    "SELECT COUNT(*) AS count FROM booking WHERE date = CURDATE()"
  );

  const [[todayRevenue]] = await pool.query(
    `SELECT COALESCE(SUM(rs.seat_price), 0) AS total
     FROM showing sg
     JOIN reserved_seats rs ON rs.showing_id = sg.showing_id
     WHERE sg.showtime_date = CURDATE()
       AND rs.status = 'Confirmed'`
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
    `WITH RECURSIVE date_range AS (
       SELECT DATE_SUB(CURDATE(), INTERVAL 6 DAY) AS day
       UNION ALL
       SELECT DATE_ADD(day, INTERVAL 1 DAY)
       FROM date_range
       WHERE day < CURDATE()
     ),
     booking_counts AS (
       SELECT DATE(b.date) AS day, COUNT(*) AS count
       FROM booking b
       WHERE b.date BETWEEN DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND CURDATE()
       GROUP BY DATE(b.date)
     )
     SELECT
       DATE_FORMAT(dr.day, '%Y-%m-%d') AS day,
       COALESCE(bc.count, 0) AS count
     FROM date_range dr
     LEFT JOIN booking_counts bc ON bc.day = dr.day
     ORDER BY dr.day ASC`
  );
  return rows;
}

async function getUpcoming() {
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
     WHERE sg.showtime_date = CURDATE()
     GROUP BY sg.showing_id, st.showtime_title, v.venues_name, sg.start_time
     ORDER BY sg.start_time ASC`
  );
  return rows;
}

module.exports = { getStats, getTrend, getUpcoming };
