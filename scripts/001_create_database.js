const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const sqlPath = path.join(__dirname, '001_create_database.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password:
      process.env.MYSQL_PASSWORD !== undefined ? process.env.MYSQL_PASSWORD : '',
    multipleStatements: true,
  });

  try {
    await conn.query(sql);
    console.log('Applied:', sqlPath);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
