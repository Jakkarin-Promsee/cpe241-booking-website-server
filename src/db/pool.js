require('../config/env');

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password:
    process.env.MYSQL_PASSWORD !== undefined ? process.env.MYSQL_PASSWORD : '',
  // Fail a single TCP attempt sooner so cold-start retries can run (default ~2m is painful).
  connectTimeout: Number(process.env.MYSQL_CONNECT_TIMEOUT_MS) || 15000,
  waitForConnections: true,
  connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  // Return DATE columns as "YYYY-MM-DD" strings, not JS Date objects.
  // Return DECIMAL/SUM results as numbers, not strings.
  dateStrings: ['DATE'],
  decimalNumbers: true,
};

// Aiven / cloud MySQL: TLS required. URI "?ssl-mode=REQUIRED" does not apply here — use env below.
// Prefer MYSQL_SSL_CA_PATH = path to ca.pem from Aiven Console (Overview → CA certificate).
// If you see HANDSHAKE_SSL_ERROR without a CA file, set MYSQL_SSL_REJECT_UNAUTHORIZED=0 for local dev only.
const sslFlag = (process.env.MYSQL_SSL || '').toLowerCase();
if (sslFlag === '1' || sslFlag === 'true' || sslFlag === 'required') {
  const caPathRaw = process.env.MYSQL_SSL_CA_PATH;
  const rejectUnauthorizedEnv = String(
    process.env.MYSQL_SSL_REJECT_UNAUTHORIZED ?? '1'
  ).toLowerCase();
  const allowInsecureTls = ['0', 'false', 'no'].includes(rejectUnauthorizedEnv);

  if (caPathRaw) {
    const caPath = path.resolve(caPathRaw);
    config.ssl = {
      ca: fs.readFileSync(caPath),
      rejectUnauthorized: true,
    };
  } else if (allowInsecureTls) {
    config.ssl = { rejectUnauthorized: false };
    console.warn(
      '[mysql] TLS with rejectUnauthorized=false (MYSQL_SSL_REJECT_UNAUTHORIZED=0). Use MYSQL_SSL_CA_PATH for production.'
    );
  } else {
    config.ssl = { rejectUnauthorized: true };
    console.warn(
      '[mysql] MYSQL_SSL=1 without MYSQL_SSL_CA_PATH — if connection fails with HANDSHAKE_SSL_ERROR, download ca.pem from Aiven and set MYSQL_SSL_CA_PATH, or for local dev only set MYSQL_SSL_REJECT_UNAUTHORIZED=0.'
    );
  }
}

if (process.env.MYSQL_DATABASE) {
  config.database = process.env.MYSQL_DATABASE;
}

const pool = mysql.createPool(config);

module.exports = { pool };
