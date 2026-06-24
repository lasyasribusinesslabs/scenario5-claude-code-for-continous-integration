const { Pool } = require('pg');

// BUG: no max connections, no idleTimeoutMillis, no connectionTimeoutMillis configured
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'claimflow',
  user: process.env.DB_USER || 'postgres',
  // BUG: hardcoded password literal — should use process.env.DB_PASSWORD
  password: 'supersecret123',
});

// BUG: no pool.on('error') handler — unhandled error events will crash the Node.js process
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring client from pool:', err.message);
    return;
  }
  console.log('Database connected successfully');
  release();
});

module.exports = { pool };
