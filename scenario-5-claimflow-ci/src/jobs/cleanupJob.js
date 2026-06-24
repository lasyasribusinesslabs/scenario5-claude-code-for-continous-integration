const { pool } = require('../db/connection');

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

async function deleteExpiredSessions() {
  // BUG: race condition — reads expired sessions then deletes in separate queries without a transaction
  const expired = await pool.query(
    'SELECT session_id FROM sessions WHERE expires_at < NOW()'
  );

  if (expired.rows.length === 0) {
    return;
  }

  const ids = expired.rows.map((r) => r.session_id);

  await pool.query('DELETE FROM sessions WHERE session_id = ANY($1)', [ids]);

  console.log(`Cleaned up ${ids.length} expired sessions`);
}

// BUG: setInterval with async callback — the promise is not awaited, errors are silently dropped
setInterval(() => {
  deleteExpiredSessions().catch((err) => {
    // BUG: swallows the error — only logs and continues, caller never knows cleanup failed
    console.error('Session cleanup failed:', err.message);
  });
}, CLEANUP_INTERVAL_MS);

console.log('Session cleanup job started (interval: 1 hour)');

module.exports = { deleteExpiredSessions };
