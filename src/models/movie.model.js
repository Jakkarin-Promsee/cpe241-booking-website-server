const { pool } = require('../db/pool');

const EFFECTIVE_STATUS_SQL = `CASE
  WHEN status IN ('Hidden', 'Ended') THEN status
  WHEN end_date IS NOT NULL AND CURDATE() > end_date THEN 'Ended'
  WHEN release_date IS NOT NULL AND CURDATE() < release_date THEN 'Upcoming'
  WHEN status = 'Open' THEN 'Open'
  ELSE 'Upcoming'
END`;

async function findAll({ search, status } = {}) {
  let sql = `SELECT
    show_id,
    showtime_title,
    showtime_descript,
    duration,
    genre,
    poster_url,
    release_date,
    end_date,
    ${EFFECTIVE_STATUS_SQL} AS status
  FROM showtimes
  WHERE 1=1`;
  const params = [];
  if (search) {
    sql += ' AND showtime_title LIKE ?';
    params.push(`%${search}%`);
  }
  if (status) {
    sql += ` AND (${EFFECTIVE_STATUS_SQL}) = ?`;
    params.push(status);
  }
  sql += ' ORDER BY show_id DESC';
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT
      show_id,
      showtime_title,
      showtime_descript,
      duration,
      genre,
      poster_url,
      release_date,
      end_date,
      ${EFFECTIVE_STATUS_SQL} AS status
    FROM showtimes
    WHERE show_id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function create({ title, genre, duration, description, releaseDate, endDate, posterUrl, status }) {
  const [result] = await pool.query(
    `INSERT INTO showtimes
       (showtime_title, showtime_descript, duration, genre, release_date, end_date, poster_url, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description || null, duration, genre || null, releaseDate || null, endDate || null, posterUrl || null, status]
  );
  return result.insertId;
}

async function update(id, { title, genre, duration, description, releaseDate, endDate, posterUrl, status }) {
  const [result] = await pool.query(
    `UPDATE showtimes
     SET showtime_title = ?, showtime_descript = ?, duration = ?,
         genre = ?, release_date = ?, end_date = ?, poster_url = ?, status = ?
     WHERE show_id = ?`,
    [title, description || null, duration, genre || null, releaseDate || null, endDate || null, posterUrl || null, status, id]
  );
  return result.affectedRows;
}

async function remove(id) {
  const [result] = await pool.query(
    'DELETE FROM showtimes WHERE show_id = ?',
    [id]
  );
  return result.affectedRows;
}

async function hasShowings(showId) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS cnt FROM showing WHERE show_id = ?',
    [showId]
  );
  return rows[0].cnt > 0;
}

module.exports = { findAll, findById, create, update, remove, hasShowings };
