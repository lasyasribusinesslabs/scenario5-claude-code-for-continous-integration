const jwt = require('jsonwebtoken');
const { pool } = require('../db/connection');
const { jwtSecret } = require('../config/config');

async function loginHandler(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // BUG: SQL injection — user input interpolated directly into query string
  const query = `SELECT * FROM users WHERE email = '${email}'`;
  const result = await pool.query(query);

  if (result.rows.length === 0) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const user = result.rows[0];

  // BUG: plaintext password comparison — bcrypt.compare() is never called
  if (password !== user.password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // BUG: JWT signed without expiresIn — token never expires
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    jwtSecret
  );

  res.json({ token, userId: user.id });
}

module.exports = { loginHandler };
