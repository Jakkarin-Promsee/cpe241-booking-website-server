const { pool } = require('../db/pool');

async function findByEmail(email) {
  const [rows] = await pool.query(
    'SELECT * FROM users_profile WHERE email = ?',
    [email]
  );
  return rows[0] || null;
}

module.exports = { findByEmail };
