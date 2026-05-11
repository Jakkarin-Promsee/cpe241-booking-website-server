const { pool } = require('../db/pool');

function getDailyRangeStartSql(period) {
  if (period === 'monthly') return "DATE_FORMAT(CURDATE(), '%Y-%m-01')";
  if (period === 'yearly') return "DATE_FORMAT(CURDATE(), '%Y-01-01')";
  return 'DATE_SUB(CURDATE(), INTERVAL 6 DAY)';
}

function periodStartDate(period) {
  const d = new Date();
  if (period === 'monthly') d.setDate(d.getDate() - 30);
  else if (period === 'yearly') d.setFullYear(d.getFullYear() - 1);
  else d.setDate(d.getDate() - 7);
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

async function getBreakdown(period = 'weekly', groupBy = 'date', metric = 'sales') {
  const since = periodStartDate(period);
  const grouping = {
    date: {
      salesExpr: "DATE_FORMAT(b.date, '%Y-%m-%d')",
      occupancyExpr: "DATE_FORMAT(sg.showtime_date, '%Y-%m-%d')",
    },
    movie: {
      salesExpr: 'st.showtime_title',
      occupancyExpr: 'st.showtime_title',
    },
    venue: {
      salesExpr: 'v.venues_name',
      occupancyExpr: 'v.venues_name',
    },
  };
  const g = grouping[groupBy] || grouping.date;

  if (metric === 'occupancy') {
    const [rows] = await pool.query(
      `SELECT
         ${g.occupancyExpr} AS label,
         COUNT(rs.seat_id) AS totalSeats,
         SUM(rs.status IN ('Reserved', 'Confirmed')) AS soldSeats,
         ROUND(
           100.0 * SUM(rs.status IN ('Reserved', 'Confirmed')) / NULLIF(COUNT(rs.seat_id), 0),
           1
         ) AS occupancyRate
       FROM showing sg
       JOIN showtimes st ON sg.show_id = st.show_id
       JOIN venues v ON sg.venues_id = v.venues_id
       JOIN reserved_seats rs ON rs.showing_id = sg.showing_id
       WHERE sg.showtime_date BETWEEN ? AND CURDATE()
       GROUP BY ${g.occupancyExpr}
       ORDER BY ${g.occupancyExpr} ASC`,
      [since]
    );
    return rows;
  }

  const [rows] = await pool.query(
    `SELECT
       ${g.salesExpr} AS label,
       COUNT(DISTINCT b.booking_id) AS bookings,
       COUNT(bi.seat_id) AS seatsSold,
       COALESCE(SUM(rs.seat_price), 0) AS revenue
     FROM booking b
     JOIN booking_items bi ON bi.booking_id = b.booking_id
     JOIN reserved_seats rs ON rs.showing_id = b.showing_id
                            AND rs.seat_id = bi.seat_id
     JOIN showing sg ON sg.showing_id = b.showing_id
     JOIN showtimes st ON st.show_id = sg.show_id
     JOIN venues v ON v.venues_id = sg.venues_id
     WHERE b.status = 'Successful'
       AND b.date BETWEEN ? AND CURDATE()
     GROUP BY ${g.salesExpr}
     ORDER BY revenue DESC, ${g.salesExpr} ASC`,
    [since]
  );
  return rows;
}

async function getDailyRevenue(period = 'weekly') {
  const startSql = getDailyRangeStartSql(period);
  const [rows] = await pool.query(
    `WITH RECURSIVE date_range AS (
       SELECT ${startSql} AS day
       UNION ALL
       SELECT DATE_ADD(day, INTERVAL 1 DAY)
       FROM date_range
       WHERE day < CURDATE()
     ),
     revenue_by_day AS (
       SELECT
         DATE(b.date) AS day,
         COALESCE(SUM(rs.seat_price), 0) AS revenueK
       FROM booking b
       JOIN booking_items  bi ON bi.booking_id = b.booking_id
       JOIN reserved_seats rs ON rs.showing_id = b.showing_id
                              AND rs.seat_id   = bi.seat_id
       WHERE b.status = 'Successful'
         AND b.date BETWEEN ${startSql} AND CURDATE()
       GROUP BY DATE(b.date)
     )
     SELECT
       DATE_FORMAT(dr.day, '%Y-%m-%d') AS day,
       COALESCE(rbd.revenueK, 0) AS revenueK
     FROM date_range dr
     LEFT JOIN revenue_by_day rbd ON rbd.day = dr.day
     ORDER BY dr.day ASC`
  );
  return rows;
}

async function getMonthlyRevenue() {
  const [rows] = await pool.query(
    `WITH RECURSIVE month_range AS (
       SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 11 MONTH), '%Y-%m-01') AS month_start
       UNION ALL
       SELECT DATE_ADD(month_start, INTERVAL 1 MONTH)
       FROM month_range
       WHERE month_start < DATE_FORMAT(CURDATE(), '%Y-%m-01')
     ),
     revenue_by_month AS (
       SELECT
         DATE_FORMAT(b.date, '%Y-%m-01') AS month_start,
         COALESCE(SUM(rs.seat_price), 0) AS revenueK
       FROM booking b
       JOIN booking_items  bi ON bi.booking_id = b.booking_id
       JOIN reserved_seats rs ON rs.showing_id = b.showing_id
                              AND rs.seat_id   = bi.seat_id
       WHERE b.status = 'Successful'
         AND b.date >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)
       GROUP BY DATE_FORMAT(b.date, '%Y-%m-01')
     )
     SELECT
       DATE_FORMAT(mr.month_start, '%Y-%m') AS month,
       COALESCE(rbm.revenueK, 0) AS revenueK
     FROM month_range mr
     LEFT JOIN revenue_by_month rbm ON rbm.month_start = mr.month_start
     ORDER BY mr.month_start ASC`
  );
  return rows;
}

module.exports = { getStats, getDailyRevenue, getMonthlyRevenue, getBreakdown };
