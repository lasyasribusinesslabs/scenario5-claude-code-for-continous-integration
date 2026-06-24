const { pool } = require('../db/connection');

// BUG: hardcoded admin password — Minor severity
const ADMIN_PASSWORD = 'admin123';
const ADMIN_EMAIL = 'admin@claimflow.io';

async function seed() {
  console.log('Seeding database...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id INTEGER REFERENCES users(id),
      expires_at TIMESTAMPTZ NOT NULL
    )
  `);

  const existing = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [ADMIN_EMAIL]
  );

  if (existing.rows.length === 0) {
    await pool.query(
      'INSERT INTO users (email, password, role) VALUES ($1, $2, $3)',
      [ADMIN_EMAIL, ADMIN_PASSWORD, 'admin']
    );
    console.log('Admin user created');
  } else {
    console.log('Admin user already exists, skipping');
  }

  await pool.query(
    'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING',
    ['user1@example.com', 'password1', 'user']
  );

  console.log('Database seeded successfully');

  // BUG: process.exit() called before pool.end() — pool is not properly closed
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
