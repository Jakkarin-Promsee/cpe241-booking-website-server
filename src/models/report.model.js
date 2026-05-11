const { pool } = require('../db/pool');

function periodStartDate(period) {
  const d = new Date();
  if (period === 'monthly') d.setDate(d.getDate() - 30);
  else if (period === 'yearly') d.setFullYear(d.getFullYear() - 1);
  else d.setDate(d.getDate() - 7); // weekly (default)
  return d.toISOString().split('T')[0];
}

async function getStats(period = 'weekly') {
  const since = periodStartDate(period);

  const [[revenue]] = await pool.query(
    `SELECT COALESCE(SUM(rs.seat_price), 0) AS total
     FROM booking b
     JOIN booking_items  bi ON bi.booking_id = b.booking_id
     JOIN reserved_seats rs ON rs.showing_id = b.showing_id
                            AND rs.seat_id   = bi.seat_id
     WHERE b.date >= ? AND b.status = 'Successful'`,
    [since]
  );

  const [topMovieRows] = await pool.query(
    `SELECT st.showtime_title AS title, COUNT(bi.seat_id) AS seats
     FROM booking b
     JOIN booking_items bi ON bi.booking_id = b.booking_id
     JOIN showing       sg ON b.showing_id  = sg.showing_id
     JOIN showtimes     st ON sg.show_id    = st.show_id
     WHERE b.date >= ? AND b.status = 'Successful'
     GROUP BY st.show_id, st.showtime_title
     ORDER BY seats DESC
     LIMIT 1`,
    [since]
  );

  const [[occupancy]] = await pool.query(
    `SELECT
       ROUND(
         100.0 * SUM(rs.status IN ('Reserved', 'Confirmed')) / NULLIF(COUNT(*), 0),
         1
       ) AS rate
     FROM showing       sg
     JOIN reserved_seats rs ON rs.showing_id = sg.showing_id
     WHERE sg.showtime_date >= ?`,
    [since]
  );

  return {
    sales:     Number(revenue.total),
    topMovie:  topMovieRows[0]?.title || 'N/A',
    occupancy: Number(occupancy.rate) || 0,
  };
}

async function getDailyRevenue() {
  const since = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  })();

  const [rows] = await pool.query(
    `SELECT
       DATE(b.date)                              AS day,
       COALESCE(SUM(rs.seat_price), 0)           AS revenueK
     FROM booking b
     JOIN booking_items  bi ON bi.booking_id = b.booking_id
     JOIN reserved_seats rs ON rs.showing_id = b.showing_id
                            AND rs.seat_id   = bi.seat_id
     WHERE b.date >= ? AND b.status = 'Successful'
     GROUP BY DATE(b.date)
     ORDER BY day ASC`,
    [since]
  );
  return rows;
}

async function getMonthlyRevenue() {
  const [rows] = await pool.query(
    `SELECT
       DATE_FORMAT(b.date, '%Y-%m')              AS month,
       COALESCE(SUM(rs.seat_price), 0)           AS revenueK
     FROM booking b
     JOIN booking_items  bi ON bi.booking_id = b.booking_id
     JOIN reserved_seats rs ON rs.showing_id = b.showing_id
                            AND rs.seat_id   = bi.seat_id
     WHERE b.date >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)
       AND b.status = 'Successful'
     GROUP BY DATE_FORMAT(b.date, '%Y-%m')
     ORDER BY month ASC`
  );
  return rows;
}

module.exports = { getStats, getDailyRevenue, getMonthlyRevenue };
