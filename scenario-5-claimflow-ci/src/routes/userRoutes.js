const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { getUserById, deleteUser } = require('../services/userService');

const router = express.Router();

// BUG: no authMiddleware applied — any unauthenticated request can list all users
// BUG: response includes password field from DB rows
// BUG: no try/catch — unhandled promise rejection if userService throws
router.get('/users', async (req, res) => {
  const { pool } = require('../db/connection');
  const result = await pool.query('SELECT * FROM users');
  res.json(result.rows);
});

// BUG: no input validation on req.params.id — passed directly to service (SQL injection vector)
// BUG: no try/catch — unhandled promise rejection if deleteUser throws
router.delete('/users/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const deleted = await deleteUser(id);
  if (!deleted) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ message: 'User deleted', user: deleted });
});

router.get('/users/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const user = await getUserById(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  });
});

module.exports = router;
