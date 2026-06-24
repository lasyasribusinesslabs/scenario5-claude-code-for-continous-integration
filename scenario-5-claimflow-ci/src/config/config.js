const config = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'claimflow',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'supersecret123',
  },

  // BUG: JWT secret hardcoded — should be process.env.JWT_SECRET with no fallback in production
  jwtSecret: process.env.JWT_SECRET || 'my-hardcoded-jwt-secret-do-not-use',

  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    // BUG: CORS origin set to '*' unconditionally — not gated on NODE_ENV
    corsOrigin: '*',
  },

  mail: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    fromAddress: 'no-reply@claimflow.io',
  },
};

module.exports = config;
