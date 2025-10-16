const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  user: process.env.PG_USER || 'easysmart',
  password: process.env.PG_PASSWORD || 'easysmart123',
  database: process.env.PG_DB || 'easysmart'
});

async function testConnection() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT NOW()');
    return res.rows[0];
  } finally {
    client.release();
  }
}

module.exports = { pool, testConnection };
