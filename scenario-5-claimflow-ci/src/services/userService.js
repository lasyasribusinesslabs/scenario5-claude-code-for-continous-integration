const { pool } = require('../db/connection');

// BUG: no try/catch — unhandled promise rejection if pool.query throws
async function getUserById(id) {
  // BUG: SQL injection — id interpolated directly into query string
  const result = await pool.query(`SELECT * FROM users WHERE id = ${id}`);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

// BUG: no try/catch — unhandled promise rejection if pool.query throws
async function deleteUser(id) {
  const result = await pool.query(
    'DELETE FROM users WHERE id = $1 RETURNING *',
    [id]
  );

  // BUG: null dereference — accesses result.rows[0].id without checking rows[0] exists
  console.log(`Deleted user with id: ${result.rows[0].id}`);

  return result.rows[0];
}

async function updateUser(id, fields) {
  const { email, role } = fields;
  const result = await pool.query(
    'UPDATE users SET email = $1, role = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
    [email, role, id]
  );
  return result.rows[0] || null;
}

module.exports = { getUserById, deleteUser, updateUser };
