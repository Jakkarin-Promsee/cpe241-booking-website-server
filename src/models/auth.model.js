const { pool } = require('../db/pool');

/** `login` is the value from the login form (email or username). */
async function findByLoginIdentity(login) {
  const trimmed = typeof login === 'string' ? login.trim() : '';
  if (!trimmed) return null;
  const [rows] = await pool.query(
    'SELECT * FROM users_profile WHERE email = ? OR username = ? LIMIT 1',
    [trimmed, trimmed]
  );
  return rows[0] || null;
}

module.exports = { findByLoginIdentity };
