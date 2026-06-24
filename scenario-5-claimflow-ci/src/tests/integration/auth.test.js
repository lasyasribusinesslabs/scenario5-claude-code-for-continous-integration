const request = require('supertest');
const app = require('../../app');
const { pool } = require('../../db/connection');

// BUG: hardcoded admin password in test setup — Minor
const adminPassword = 'admin123';
const adminEmail = 'admin@claimflow.io';

beforeAll(async () => {
  await pool.query(
    'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING',
    [adminEmail, adminPassword, 'admin']
  );
});

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email = $1', [adminEmail]);
  await pool.end();
});

describe('POST /login', () => {
  it('returns 200 and a token with valid credentials', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: adminEmail, password: adminPassword });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.userId).toBeDefined();
  });

  it('returns 401 with invalid password', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: adminEmail, password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/login')
      .send({ password: adminPassword });

    expect(res.status).toBe(400);
  });

  // BUG: no test for SQL injection attempt — the injection vulnerability is untested
  // e.g. email: "' OR '1'='1" should be handled safely by parameterized queries
  // but login.js uses string interpolation, so this would succeed and the test doesn't catch it
});
