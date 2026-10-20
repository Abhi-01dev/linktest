import app from './app.js';
import { config } from './config/env.js';
import { initDb, pool } from './db/index.js';

async function startServer() {
  console.log('----------------------------------------------------');
  console.log('       LinkTest | AI Learning Platform Backend       ');
  console.log('----------------------------------------------------');

  // Initialize Database connection (PostgreSQL with fallback)
  await initDb();

  // Ensure default administrator account is always provisioned on startup
  try {
    if (pool) {
      const bcrypt = (await import('bcryptjs')).default;
      const adminEmail = (process.env.ADMIN_EMAIL || 'admin@linktest.io').toLowerCase().trim();
      const adminPass = process.env.ADMIN_PASSWORD || 'Admin123!';
      const hash = await bcrypt.hash(adminPass, 10);
      const now = new Date().toISOString();
      await pool.query(
        `INSERT INTO users (id, full_name, email, password_hash, role, status, email_verified, email_verified_at, created_at)
         VALUES ('user-admin-001', 'Dr. Priya Patel', $1, $2, 'ADMIN', 'active', true, $3, $3)
         ON CONFLICT (email) DO UPDATE
         SET role = 'ADMIN', status = 'active', email_verified = true`,
        [adminEmail, hash, now]
      );
      await pool.query(
        `INSERT INTO users (id, full_name, email, password_hash, role, status, email_verified, email_verified_at, created_at)
         VALUES ('user-admin-002', 'Dr. Priya Patel', 'admin@linktest.com', $1, 'ADMIN', 'active', true, $2, $2)
         ON CONFLICT (email) DO UPDATE
         SET role = 'ADMIN', status = 'active', email_verified = true`,
        [hash, now]
      );
    }
  } catch (adminErr) {
    console.warn('[LinkTest Server] Admin auto-provision notice:', adminErr.message);
  }

  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`[LinkTest Server] Ready and listening on port ${config.port} (0.0.0.0)`);
    console.log(`[LinkTest Server] Health Check: http://localhost:${config.port}/api/health`);
    console.log(`[LinkTest Server] AI Status:    http://localhost:${config.port}/api/ai/status`);
    console.log(`[LinkTest Server] Environment:  ${config.nodeEnv}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[LinkTest Server] Fatal: Port ${config.port} is already in use by another process.`);
    } else {
      console.error('[LinkTest Server] Fatal server error:', err.message);
    }
    process.exit(1);
  });

  const shutdown = async (signal) => {
    console.log(`\n[LinkTest Server] Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      if (pool) {
        await pool.end();
      }
      console.log('[LinkTest Server] Server closed. Goodbye!');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch(err => {
  console.error('[LinkTest Server] Fatal startup failure:', err);
  process.exit(1);
});
