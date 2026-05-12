const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function buildSsl() {
  const flag = (process.env.MYSQL_SSL || '').toLowerCase();
  if (!['1', 'true', 'required'].includes(flag)) return undefined;
  const caPath = process.env.MYSQL_SSL_CA_PATH;
  if (caPath) return { ca: fs.readFileSync(path.resolve(caPath)), rejectUnauthorized: true };
  const reject = String(process.env.MYSQL_SSL_REJECT_UNAUTHORIZED ?? '1').toLowerCase();
  return { rejectUnauthorized: !['0', 'false', 'no'].includes(reject) };
}

async function main() {
  const sqlPath = path.join(__dirname, '002_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD !== undefined ? process.env.MYSQL_PASSWORD : '',
    database: process.env.MYSQL_DATABASE || 'CPE241_final_project',
    ssl: buildSsl(),
    multipleStatements: true,
  });

  try {
    await conn.query(sql);
    console.log('Schema applied:', sqlPath);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
