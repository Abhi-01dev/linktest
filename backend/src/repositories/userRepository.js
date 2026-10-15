import { pool, isPostgresConnected, memoryStore } from '../db/index.js';
import crypto from 'crypto';

const SAFE_USER_FIELDS = 'id, full_name, email, role, status, phone, avatar_url, email_verified, email_verified_at, google_id, auth_provider, account_linked_at, last_login_at, created_at';

export const userRepository = {
  async findByEmail(email) {
    const normalizedEmail = email.trim().toLowerCase();
    if (isPostgresConnected && pool) {
      const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
      return res.rows[0] || null;
    }
    return memoryStore.users.find(u => u.email.toLowerCase() === normalizedEmail) || null;
  },

  async findById(id) {
    if (isPostgresConnected && pool) {
      const res = await pool.query(
        `SELECT ${SAFE_USER_FIELDS} FROM users WHERE id = $1`,
        [id]
      );
      return res.rows[0] || null;
    }
    const user = memoryStore.users.find(u => u.id === id);
    if (!user) return null;
    const { password_hash, ...safeUser } = user;
    return safeUser;
  },

  async findByGoogleId(googleId) {
    if (!googleId) return null;
    if (isPostgresConnected && pool) {
      const res = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
      return res.rows[0] || null;
    }
    return memoryStore.users.find(u => u.google_id === googleId) || null;
  },

  async createGoogleUser({ fullName, email, googleId, avatarUrl = null }) {
    const id = crypto.randomUUID();
    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date().toISOString();

    if (isPostgresConnected && pool) {
      const res = await pool.query(
        `INSERT INTO users (id, full_name, email, password_hash, role, status, email_verified, email_verified_at, avatar_url, google_id, auth_provider, account_linked_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING ${SAFE_USER_FIELDS}`,
        [id, fullName.trim(), normalizedEmail, null, 'STUDENT', 'active', true, now, avatarUrl, googleId, 'google', now, now]
      );
      return res.rows[0];
    }

    const newUser = {
      id,
      full_name: fullName.trim(),
      email: normalizedEmail,
      password_hash: null,
      role: 'STUDENT',
      status: 'active',
      email_verified: true,
      email_verified_at: now,
      phone: null,
      avatar_url: avatarUrl,
      google_id: googleId,
      auth_provider: 'google',
      account_linked_at: now,
      last_login_at: null,
      created_at: now
    };
    memoryStore.users.push(newUser);
    const { password_hash, ...safeUser } = newUser;
    return safeUser;
  },

  async linkGoogleAccount(userId, { googleId, avatarUrl = null }) {
    const now = new Date().toISOString();
    if (isPostgresConnected && pool) {
      const res = await pool.query(
        `UPDATE users
         SET google_id = $1,
             auth_provider = CASE WHEN auth_provider = 'local' THEN 'google_linked' ELSE auth_provider END,
             avatar_url = COALESCE(avatar_url, $2),
             email_verified = true,
             email_verified_at = COALESCE(email_verified_at, $3),
             account_linked_at = $3
         WHERE id = $4
         RETURNING ${SAFE_USER_FIELDS}`,
        [googleId, avatarUrl, now, userId]
      );
      return res.rows[0] || null;
    }

    const user = memoryStore.users.find(u => u.id === userId);
    if (!user) return null;
    user.google_id = googleId;
    user.auth_provider = user.auth_provider === 'local' ? 'google_linked' : user.auth_provider;
    if (!user.avatar_url && avatarUrl) user.avatar_url = avatarUrl;
    user.email_verified = true;
    if (!user.email_verified_at) user.email_verified_at = now;
    user.account_linked_at = now;
    const { password_hash, ...safeUser } = user;
    return safeUser;
  },

  async unlinkGoogleAccount(userId) {
    if (isPostgresConnected && pool) {
      const res = await pool.query(
        `UPDATE users
         SET google_id = NULL,
             auth_provider = 'local',
             account_linked_at = NULL
         WHERE id = $1
         RETURNING ${SAFE_USER_FIELDS}`,
        [userId]
      );
      return res.rows[0] || null;
    }

    const user = memoryStore.users.find(u => u.id === userId);
    if (!user) return null;
    user.google_id = null;
    user.auth_provider = 'local';
    user.account_linked_at = null;
    const { password_hash, ...safeUser } = user;
    return safeUser;
  },

  async create({ fullName, email, passwordHash, role = 'STUDENT', emailVerified = false, emailVerifiedAt = null, status = 'active' }) {
    const id = crypto.randomUUID();
    const normalizedEmail = email.trim().toLowerCase();
    const createdAt = new Date().toISOString();

    if (isPostgresConnected && pool) {
      const res = await pool.query(
        `INSERT INTO users (id, full_name, email, password_hash, role, status, email_verified, email_verified_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING ${SAFE_USER_FIELDS}`,
        [id, fullName.trim(), normalizedEmail, passwordHash, role, status, emailVerified, emailVerifiedAt, createdAt]
      );
      return res.rows[0];
    }

    const newUser = {
      id,
      full_name: fullName.trim(),
      email: normalizedEmail,
      password_hash: passwordHash,
      role,
      status,
      email_verified: emailVerified,
      email_verified_at: emailVerifiedAt,
      last_login_at: null,
      phone: null,
      avatar_url: null,
      created_at: createdAt
    };
    memoryStore.users.push(newUser);
    const { password_hash, ...safeUser } = newUser;
    return safeUser;
  },

  async updateUnverifiedUser(id, { fullName, passwordHash }) {
    if (isPostgresConnected && pool) {
      const res = await pool.query(
        `UPDATE users
         SET full_name = $1, password_hash = $2
         WHERE id = $3 AND email_verified = false
         RETURNING ${SAFE_USER_FIELDS}`,
        [fullName.trim(), passwordHash, id]
      );
      return res.rows[0] || null;
    }

    const user = memoryStore.users.find(u => u.id === id && !u.email_verified);
    if (!user) return null;
    user.full_name = fullName.trim();
    user.password_hash = passwordHash;
    const { password_hash, ...safeUser } = user;
    return safeUser;
  },

  async markEmailVerified(userId) {
    const verifiedAt = new Date().toISOString();
    if (isPostgresConnected && pool) {
      const res = await pool.query(
        `UPDATE users
         SET email_verified = true, email_verified_at = $2
         WHERE id = $1
         RETURNING ${SAFE_USER_FIELDS}`,
        [userId, verifiedAt]
      );
      return res.rows[0] || null;
    }

    const user = memoryStore.users.find(u => u.id === userId);
    if (!user) return null;
    user.email_verified = true;
    user.email_verified_at = verifiedAt;
    const { password_hash, ...safeUser } = user;
    return safeUser;
  },

  async updateStatus(userId, status) {
    if (isPostgresConnected && pool) {
      const res = await pool.query(
        `UPDATE users SET status = $1 WHERE id = $2 RETURNING ${SAFE_USER_FIELDS}`,
        [status, userId]
      );
      return res.rows[0] || null;
    }
    const user = memoryStore.users.find(u => u.id === userId);
    if (!user) return null;
    user.status = status;
    const { password_hash, ...safeUser } = user;
    return safeUser;
  },

  async updateProfile(userId, { fullName, phone, avatarUrl }) {
    if (isPostgresConnected && pool) {
      const res = await pool.query(
        `UPDATE users SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone), avatar_url = COALESCE($3, avatar_url)
         WHERE id = $4 RETURNING ${SAFE_USER_FIELDS}`,
        [fullName, phone, avatarUrl, userId]
      );
      return res.rows[0] || null;
    }
    const user = memoryStore.users.find(u => u.id === userId);
    if (!user) return null;
    if (fullName) user.full_name = fullName;
    if (phone !== undefined) user.phone = phone;
    if (avatarUrl !== undefined) user.avatar_url = avatarUrl;
    const { password_hash, ...safeUser } = user;
    return safeUser;
  },

  async updatePassword(userId, passwordHash) {
    if (isPostgresConnected && pool) {
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
      return true;
    }
    const user = memoryStore.users.find(u => u.id === userId);
    if (!user) return false;
    user.password_hash = passwordHash;
    return true;
  },

  async recordLogin(userId) {
    const now = new Date().toISOString();
    if (isPostgresConnected && pool) {
      await pool.query('UPDATE users SET last_login_at = $1 WHERE id = $2', [now, userId]);
      return;
    }
    const user = memoryStore.users.find(u => u.id === userId);
    if (user) user.last_login_at = now;
  },

  async updateLastLogin(userId) {
    return this.recordLogin(userId);
  },

  async getAllUsers(filters = {}) {
    const { role, status, search, limit = 100, offset = 0 } = filters;

    if (isPostgresConnected && pool) {
      let where = 'WHERE 1=1';
      const params = [];
      if (role) { params.push(role); where += ` AND u.role = $${params.length}`; }
      if (status) { params.push(status); where += ` AND u.status = $${params.length}`; }
      if (search) {
        params.push(`%${search}%`);
        where += ` AND (u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
      }
      params.push(limit, offset);
      const res = await pool.query(
        `SELECT u.id, u.full_name, u.email, u.role, u.status, u.email_verified, u.email_verified_at, u.last_login_at, u.created_at,
                COUNT(DISTINCT e.course_id) as enrolled_courses_count,
                COUNT(DISTINCT qa.id) as quiz_attempts_count
         FROM users u
         LEFT JOIN enrollments e ON u.id = e.user_id
         LEFT JOIN quiz_attempts qa ON u.id = qa.user_id
         ${where}
         GROUP BY u.id ORDER BY u.created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );
      return res.rows;
    }

    let users = memoryStore.users;
    if (role) users = users.filter(u => u.role === role);
    if (status) users = users.filter(u => u.status === status);
    if (search) {
      const q = search.toLowerCase();
      users = users.filter(u => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    return users.slice(offset, offset + limit).map(u => {
      const { password_hash, ...safe } = u;
      const enrolled_courses_count = memoryStore.enrollments.filter(e => e.user_id === u.id).length;
      const quiz_attempts_count = memoryStore.quiz_attempts.filter(qa => qa.user_id === u.id).length;
      return { ...safe, enrolled_courses_count, quiz_attempts_count };
    });
  },

  async getStudents(filters = {}) {
    return this.getAllUsers({ ...filters, role: 'STUDENT' });
  },

  async getTeachers(filters = {}) {
    return this.getAllUsers({ ...filters, role: 'TEACHER' });
  },

  async countByRole() {
    if (isPostgresConnected && pool) {
      const res = await pool.query(
        `SELECT role, COUNT(*)::int as count FROM users GROUP BY role`
      );
      const counts = { STUDENT: 0, TEACHER: 0, ADMIN: 0 };
      res.rows.forEach(r => { counts[r.role] = r.count; });
      return counts;
    }
    const counts = { STUDENT: 0, TEACHER: 0, ADMIN: 0 };
    memoryStore.users.forEach(u => { if (counts[u.role] !== undefined) counts[u.role]++; });
    return counts;
  },

  async searchStudents({ query = '', page = 1, limit = 20 } = {}) {
    const offset = (Math.max(1, page) - 1) * limit;
    const q = (query || '').trim().toLowerCase();

    if (isPostgresConnected && pool) {
      let sql = `
        SELECT u.id, u.full_name, u.email, u.role, u.status, u.avatar_url, u.created_at,
               sp.enrollment_number
        FROM users u
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        WHERE u.role = 'STUDENT'
      `;
      const params = [];

      if (q) {
        params.push(`%${q}%`);
        sql += ` AND (LOWER(u.full_name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length} OR LOWER(COALESCE(sp.enrollment_number, '')) LIKE $${params.length})`;
      }

      const countRes = await pool.query(`SELECT COUNT(*)::int as total FROM (${sql}) sub`, params);
      const total = countRes.rows[0]?.total || 0;

      sql += ` ORDER BY u.full_name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      const rowsRes = await pool.query(sql, [...params, limit, offset]);

      return {
        students: rowsRes.rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    }

    let students = memoryStore.users.filter(u => u.role === 'STUDENT');
    if (q) {
      students = students.filter(u =>
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    }
    const total = students.length;
    const paged = students.slice(offset, offset + limit).map(u => {
      const sp = (memoryStore.student_profiles || []).find(p => p.user_id === u.id);
      const { password_hash, ...safe } = u;
      return {
        ...safe,
        enrollment_number: sp?.enrollment_number || null,
        roll_number: sp?.roll_number || null
      };
    });

    return {
      students: paged,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  },

  async updateUserRoleAndStatus(userId, { role, status, fullName }) {
    if (isPostgresConnected && pool) {
      const fields = [];
      const params = [];

      if (role) {
        params.push(role);
        fields.push(`role = $${params.length}`);
      }
      if (status) {
        params.push(status);
        fields.push(`status = $${params.length}`);
      }
      if (fullName) {
        params.push(fullName.trim());
        fields.push(`full_name = $${params.length}`);
      }

      if (fields.length === 0) return this.findById(userId);

      params.push(userId);
      const res = await pool.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING ${SAFE_USER_FIELDS}`,
        params
      );
      return res.rows[0] || null;
    }

    const user = memoryStore.users.find(u => u.id === userId);
    if (!user) return null;
    if (role) user.role = role;
    if (status) user.status = status;
    if (fullName) user.full_name = fullName.trim();
    const { password_hash, ...safe } = user;
    return safe;
  }
};
