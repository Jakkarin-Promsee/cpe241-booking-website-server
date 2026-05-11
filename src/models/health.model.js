const { pool } = require('../db/pool');

async function getMysqlVersion() {
  const [rows] = await pool.query('SELECT VERSION() AS version');
  return rows[0].version;
}

module.exports = { getMysqlVersion };
