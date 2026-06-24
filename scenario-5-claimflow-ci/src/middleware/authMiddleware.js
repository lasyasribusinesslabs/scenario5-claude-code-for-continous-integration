const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/config');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      // BUG: calls next() on error instead of returning 401 — lets unauthenticated requests through
      console.error('Token verification failed:', err.message);
      next();
      return;
    }

    // BUG: exposes full decoded token on req.user including any sensitive fields (e.g. password hash)
    req.user = decoded;

    // BUG: no role check — admin-only routes are not protected even if role is checked by the caller
    next();
  });
}

function requireAdmin(req, res, next) {
  // This is never actually called before admin routes in the router
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authMiddleware, requireAdmin };
