import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || process.argv[2];
  const password = process.env.ADMIN_PASSWORD || process.argv[3];
  const fullName = process.env.ADMIN_NAME || process.argv[4] || 'Production Administrator';

  if (!email || !password) {
    console.error('[Admin Provisioning] Error: Both email and password are required.');
    console.error('Usage via env: ADMIN_EMAIL="admin@yourdomain.com" ADMIN_PASSWORD="your-secure-password" node scripts/create-admin.js');
    console.error('Usage via CLI: node scripts/create-admin.js <email> <password> [fullName]');
    process.exit(1);
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('[Admin Provisioning] DATABASE_URL not set in .env');
    process.exit(1);
  }

  const isNeonOrCloud = dbUrl.includes('neon.tech') || dbUrl.includes('render.com') || dbUrl.includes('sslmode=require');
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: isNeonOrCloud ? { rejectUnauthorized: false } : false
  });

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const res = await pool.query(
      `INSERT INTO users (id, full_name, email, password_hash, role, email_verified, email_verified_at, created_at)
       VALUES ($1, $2, $3, $4, 'ADMIN', true, $5, $5)
       ON CONFLICT (email) DO UPDATE
       SET role = 'ADMIN', password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name,
           email_verified = true, email_verified_at = EXCLUDED.email_verified_at
       RETURNING id, full_name, email, role, email_verified`,
      [id, fullName, email.toLowerCase().trim(), passwordHash, now]
    );

    console.log('[Admin Provisioning] Admin account created or upgraded successfully:');
    console.log(res.rows[0]);
  } catch (err) {
    console.error('[Admin Provisioning] Failed to create admin:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createAdmin();
