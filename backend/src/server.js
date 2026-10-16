import app from './app.js';
import { config } from './config/env.js';
import { initDb, pool } from './db/index.js';

async function startServer() {
  console.log('----------------------------------------------------');
  console.log('       LinkTest | AI Learning Platform Backend       ');
  console.log('----------------------------------------------------');

  // Initialize Database connection (PostgreSQL with fallback)
  await initDb();

  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`[LinkTest Server] Ready and listening on port ${config.port} (0.0.0.0)`);
    console.log(`[LinkTest Server] Health Check: http://localhost:${config.port}/api/health`);
    console.log(`[LinkTest Server] AI Status:    http://localhost:${config.port}/api/ai/status`);
    console.log(`[LinkTest Server] Environment:  ${config.nodeEnv}`);
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
