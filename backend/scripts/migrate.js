import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { Pool } = pg;

async function runMigration() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('[Migration] Error: DATABASE_URL is not defined in environment.');
    process.exit(1);
  }

  const isNeonOrCloud = dbUrl.includes('neon.tech') || dbUrl.includes('render.com') || dbUrl.includes('sslmode=require');
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: isNeonOrCloud ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('[Migration] Connecting to database...');
    const schemaSqlPath = path.join(__dirname, '../sql/schema.sql');
    const sql = fs.readFileSync(schemaSqlPath, 'utf8');

    console.log('[Migration] Applying schema.sql...');
    await pool.query(sql);
    console.log('[Migration] Schema successfully applied to PostgreSQL database.');
  } catch (err) {
    console.error('[Migration] Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
