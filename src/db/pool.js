require('../config/env');

const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password:
    process.env.MYSQL_PASSWORD !== undefined ? process.env.MYSQL_PASSWORD : '',
  waitForConnections: true,
  connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  // Return DATE columns as "YYYY-MM-DD" strings, not JS Date objects.
  // Return DECIMAL/SUM results as numbers, not strings.
  dateStrings: ['DATE'],
  decimalNumbers: true,
};

if (process.env.MYSQL_DATABASE) {
  config.database = process.env.MYSQL_DATABASE;
}

const pool = mysql.createPool(config);

module.exports = { pool };
