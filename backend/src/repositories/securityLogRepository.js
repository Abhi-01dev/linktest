import { pool, isPostgresConnected, memoryStore } from '../db/index.js';
import crypto from 'crypto';

/**
 * Sanitize metadata to guarantee no passwords, secrets, or bearer tokens are ever recorded.
 */
function sanitizeSecurityData(data) {
  if (!data) return null;
  if (typeof data === 'string') {
    return data.replace(/(password|token|secret|jwt|authorization)=[^&\s]+/gi, '$1=[REDACTED]');
  }
  if (typeof data === 'object') {
    const copy = { ...data };
    const sensitiveKeys = ['password', 'confirmPassword', 'token', 'refreshToken', 'accessToken', 'secret', 'jwt', 'authorization'];
    for (const key of Object.keys(copy)) {
      if (sensitiveKeys.includes(key.toLowerCase())) {
        copy[key] = '[REDACTED]';
      } else if (typeof copy[key] === 'object' && copy[key] !== null) {
        copy[key] = sanitizeSecurityData(copy[key]);
      }
    }
    return copy;
  }
  return data;
}

export const securityLogRepository = {
  /**
   * Record a security / authentication / authorization event
   */
  async logEvent({
    eventType,
    severity = 'INFO',
    userId = null,
    userEmail = null,
    ipAddress = null,
    userAgent = null,
    details = '',
    metadata = null
  }) {
    const id = `sec-${crypto.randomUUID().slice(0, 12)}`;
    const now = new Date().toISOString();
    const cleanDetails = sanitizeSecurityData(details) || '';
    const cleanMetadata = sanitizeSecurityData(metadata);

    try {
      if (isPostgresConnected && pool) {
        await pool.query(
          `INSERT INTO security_logs (id, event_type, severity, user_id, user_email, ip_address, user_agent, details, metadata, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            id,
            eventType,
            severity,
            userId,
            userEmail,
            ipAddress,
            userAgent ? userAgent.slice(0, 255) : null,
            cleanDetails,
            cleanMetadata ? JSON.stringify(cleanMetadata) : null,
            now
          ]
        );
        return;
      }

      if (!memoryStore.security_logs) memoryStore.security_logs = [];
      memoryStore.security_logs.push({
        id,
        event_type: eventType,
        severity,
        user_id: userId,
        user_email: userEmail,
        ip_address: ipAddress,
        user_agent: userAgent,
        details: cleanDetails,
        metadata: cleanMetadata,
        created_at: now
      });
    } catch (err) {
      console.error('[SecurityLog] Failed to record security event:', err.message);
    }
  },

  /**
   * Retrieve filtered & paginated security logs
   */
  async getLogs({
    eventType,
    severity,
    search,
    startDate,
    endDate,
    limit = 20,
    offset = 0
  } = {}) {
    const pageLimit = Math.max(1, Math.min(parseInt(limit, 10) || 20, 100));
    const pageOffset = Math.max(0, parseInt(offset, 10) || 0);

    if (isPostgresConnected && pool) {
      let where = 'WHERE 1=1';
      const params = [];

      if (eventType && eventType !== 'ALL') {
        params.push(eventType);
        where += ` AND event_type = $${params.length}`;
      }

      if (severity && severity !== 'ALL') {
        params.push(severity);
        where += ` AND severity = $${params.length}`;
      }

      if (search && search.trim()) {
        params.push(`%${search.trim().toLowerCase()}%`);
        where += ` AND (LOWER(event_type) LIKE $${params.length} OR LOWER(COALESCE(user_email, '')) LIKE $${params.length} OR LOWER(COALESCE(details, '')) LIKE $${params.length} OR LOWER(COALESCE(ip_address, '')) LIKE $${params.length})`;
      }

      if (startDate) {
        params.push(startDate);
        where += ` AND created_at >= $${params.length}`;
      }

      if (endDate) {
        params.push(endDate);
        where += ` AND created_at <= $${params.length}`;
      }

      const countRes = await pool.query(`SELECT COUNT(*)::int as count FROM security_logs ${where}`, params);
      const total = countRes.rows[0]?.count || 0;

      const dataQuery = `
        SELECT id, event_type, severity, user_id, user_email, ip_address, user_agent, details, metadata, created_at
        FROM security_logs
        ${where}
        ORDER BY created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      const dataRes = await pool.query(dataQuery, [...params, pageLimit, pageOffset]);

      return {
        logs: dataRes.rows,
        total,
        page: Math.floor(pageOffset / pageLimit) + 1,
        totalPages: Math.ceil(total / pageLimit) || 1,
        limit: pageLimit
      };
    }

    // Memory Store fallback
    let list = [...(memoryStore.security_logs || [])];

    if (eventType && eventType !== 'ALL') list = list.filter(l => l.event_type === eventType);
    if (severity && severity !== 'ALL') list = list.filter(l => l.severity === severity);
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(l =>
        l.event_type?.toLowerCase().includes(q) ||
        l.user_email?.toLowerCase().includes(q) ||
        l.details?.toLowerCase().includes(q) ||
        l.ip_address?.toLowerCase().includes(q)
      );
    }
    if (startDate) list = list.filter(l => new Date(l.created_at) >= new Date(startDate));
    if (endDate) list = list.filter(l => new Date(l.created_at) <= new Date(endDate));

    const total = list.length;
    const sorted = list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const paged = sorted.slice(pageOffset, pageOffset + pageLimit);

    return {
      logs: paged,
      total,
      page: Math.floor(pageOffset / pageLimit) + 1,
      totalPages: Math.ceil(total / pageLimit) || 1,
      limit: pageLimit
    };
  }
};
