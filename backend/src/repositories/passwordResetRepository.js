import { pool, isPostgresConnected, memoryStore } from '../db/index.js';
import crypto from 'crypto';

export const passwordResetRepository = {
  /**
   * Create a new password reset token entry with SHA-256 hash.
   */
  async create({ userId, tokenHash, expiresAt }) {
    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();

    if (isPostgresConnected && pool) {
      const res = await pool.query(
        `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, used, created_at)
         VALUES ($1, $2, $3, $4, false, $5)
         RETURNING *`,
        [id, userId, tokenHash, expiresAt, created_at]
      );
      return res.rows[0];
    }

    if (!memoryStore.password_reset_tokens) memoryStore.password_reset_tokens = [];
    const token = {
      id,
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
      used: false,
      created_at
    };
    memoryStore.password_reset_tokens.push(token);
    return token;
  },

  /**
   * Find a reset token record by its SHA-256 hash.
   */
  async findByTokenHash(tokenHash) {
    if (isPostgresConnected && pool) {
      const res = await pool.query(
        'SELECT * FROM password_reset_tokens WHERE token_hash = $1',
        [tokenHash]
      );
      return res.rows[0] || null;
    }
    if (!memoryStore.password_reset_tokens) memoryStore.password_reset_tokens = [];
    return memoryStore.password_reset_tokens.find(t => t.token_hash === tokenHash) || null;
  },

  /**
   * Mark a specific token as used.
   */
  async markUsed(id) {
    if (isPostgresConnected && pool) {
      await pool.query('UPDATE password_reset_tokens SET used = true WHERE id = $1', [id]);
      return;
    }
    if (!memoryStore.password_reset_tokens) memoryStore.password_reset_tokens = [];
    const token = memoryStore.password_reset_tokens.find(t => t.id === id);
    if (token) token.used = true;
  },

  /**
   * Invalidate all password reset tokens for a given user.
   */
  async invalidateAllForUser(userId) {
    if (isPostgresConnected && pool) {
      await pool.query('UPDATE password_reset_tokens SET used = true WHERE user_id = $1', [userId]);
      return;
    }
    if (!memoryStore.password_reset_tokens) memoryStore.password_reset_tokens = [];
    memoryStore.password_reset_tokens.forEach(t => {
      if (t.user_id === userId) t.used = true;
    });
  },

  /**
   * Atomically consume a reset token, update user password_hash, and invalidate
   * all tokens for that user within a transaction to prevent race conditions.
   * Returns the consumed tokenRecord on success, or null if token is invalid/expired/used.
   */
  async consumeAndResetPassword({ tokenHash, passwordHash }) {
    const now = new Date().toISOString();

    if (isPostgresConnected && pool) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Lock row to prevent race conditions / duplicate consumption
        const res = await client.query(
          `SELECT * FROM password_reset_tokens WHERE token_hash = $1 FOR UPDATE`,
          [tokenHash]
        );
        const tokenRecord = res.rows[0];

        if (!tokenRecord || tokenRecord.used || new Date() > new Date(tokenRecord.expires_at)) {
          await client.query('ROLLBACK');
          return null;
        }

        // Update user password and ensure email_verified is true
        await client.query(
          `UPDATE users
           SET password_hash = $1,
               email_verified = true,
               email_verified_at = COALESCE(email_verified_at, $2)
           WHERE id = $3`,
          [passwordHash, now, tokenRecord.user_id]
        );

        // Invalidate ALL reset tokens for this user (including current one)
        await client.query(
          `UPDATE password_reset_tokens SET used = true WHERE user_id = $1`,
          [tokenRecord.user_id]
        );

        await client.query('COMMIT');
        return tokenRecord;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    // Memory Store fallback (synchronous execution prevents race conditions)
    if (!memoryStore.password_reset_tokens) memoryStore.password_reset_tokens = [];
    const tokenRecord = memoryStore.password_reset_tokens.find(t => t.token_hash === tokenHash);

    if (!tokenRecord || tokenRecord.used || new Date() > new Date(tokenRecord.expires_at)) {
      return null;
    }

    // Mark ALL tokens for this user as used
    memoryStore.password_reset_tokens.forEach(t => {
      if (t.user_id === tokenRecord.user_id) {
        t.used = true;
      }
    });

    // Update user password
    const user = memoryStore.users.find(u => u.id === tokenRecord.user_id);
    if (user) {
      user.password_hash = passwordHash;
      user.email_verified = true;
      if (!user.email_verified_at) user.email_verified_at = now;
    }

    return tokenRecord;
  },

  /**
   * Helper for tests: expire a token record immediately.
   */
  async setTokenExpiredForTest(tokenHash) {
    const expiredAt = new Date(Date.now() - 60 * 1000).toISOString();
    if (isPostgresConnected && pool) {
      await pool.query(
        `UPDATE password_reset_tokens SET expires_at = $1 WHERE token_hash = $2`,
        [expiredAt, tokenHash]
      );
      return;
    }
    if (!memoryStore.password_reset_tokens) memoryStore.password_reset_tokens = [];
    const token = memoryStore.password_reset_tokens.find(t => t.token_hash === tokenHash);
    if (token) token.expires_at = expiredAt;
  }
};
