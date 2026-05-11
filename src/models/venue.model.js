const { pool } = require('../db/pool');

async function findAll() {
  const [rows] = await pool.query(
    'SELECT * FROM venues ORDER BY venues_id ASC'
  );
  return rows;
}

module.exports = { findAll };
