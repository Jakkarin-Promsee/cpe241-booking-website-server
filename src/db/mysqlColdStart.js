const { pool } = require('./pool');

/**
 * Retry MySQL until reachable or attempts exhausted (Render / remote cold start).
 * Logs each failure and final outcome. Does not throw — HTTP server can still boot.
 * @returns {Promise<{ ok: boolean, attempts: number }>}
 */
async function waitForMysqlReady() {
  const maxAttempts = Math.max(
    1,
    Number(process.env.MYSQL_CONNECT_MAX_ATTEMPTS) || 20
  );
  const delayMs = Math.max(
    500,
    Number(process.env.MYSQL_CONNECT_RETRY_MS) || 3000
  );

  console.log(
    `[mysql] cold-start: up to ${maxAttempts} attempts, ${delayMs}ms between tries`
  );

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const conn = await pool.getConnection();
      try {
        await conn.ping();
      } finally {
        conn.release();
      }
      console.log(`[mysql] connected OK (attempt ${attempt}/${maxAttempts})`);
      return { ok: true, attempts: attempt };
    } catch (err) {
      const code = err.code || err.errno;
      const detail = code ? `${code}: ${err.message}` : err.message;
      console.warn(
        `[mysql] attempt ${attempt}/${maxAttempts} failed — ${detail}`
      );
      if (attempt < maxAttempts) {
        console.log(`[mysql] retry in ${delayMs}ms...`);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  console.error(
    '[mysql] NOT reachable after all attempts — check MYSQL_HOST / port / credentials, ' +
    'and whether this network can reach the DB (private Render MySQL is not reachable from your PC).'
  );
  return { ok: false, attempts: maxAttempts };
}

module.exports = { waitForMysqlReady };
