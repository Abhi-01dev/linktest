// Audit log utility — records administrative actions
import { pool, isPostgresConnected, memoryStore } from '../db/index.js';
import crypto from 'crypto';

export async function logAudit(firstArg, ...rest) {
  let actorId, actorEmail, action, resourceType, resourceId, summary, ipAddress;

  if (firstArg && typeof firstArg === 'object' && (firstArg.id || firstArg.email) && typeof rest[0] === 'string') {
    // Called as (user, action, resourceType, resourceId, summary, ipAddress)
    actorId = firstArg.id;
    actorEmail = firstArg.email;
    [action, resourceType, resourceId, summary, ipAddress] = rest;
  } else if (firstArg && typeof firstArg === 'object') {
    // Called as ({ actorId, actorEmail, action, resourceType, resourceId, summary, ipAddress })
    ({ actorId, actorEmail, action, resourceType, resourceId, summary, ipAddress } = firstArg);
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  try {
    if (isPostgresConnected && pool) {
      await pool.query(
        `INSERT INTO audit_logs (id, actor_id, actor_email, action, resource_type, resource_id, summary, ip_address, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [id, actorId || null, actorEmail || null, action || 'UNKNOWN_ACTION', resourceType || null, resourceId || null, summary || '', ipAddress || null, createdAt]
      );
      return;
    }
    if (!memoryStore.audit_logs) memoryStore.audit_logs = [];
    memoryStore.audit_logs.push({ id, actor_id: actorId, actor_email: actorEmail, action: action || 'UNKNOWN_ACTION', resource_type: resourceType, resource_id: resourceId, summary, ip_address: ipAddress, created_at: createdAt });
  } catch (err) {
    // Audit logging failure should never crash the main request
    console.error('[Audit] Failed to write audit log:', err.message);
  }
}

export const auditRepository = {
  async getLogs({
    limit = 20,
    offset = 0,
    action,
    resourceType,
    search,
    startDate,
    endDate,
    actorId
  } = {}) {
    const pageLimit = Math.max(1, Math.min(parseInt(limit, 10) || 20, 100));
    const pageOffset = Math.max(0, parseInt(offset, 10) || 0);

    if (isPostgresConnected && pool) {
      let where = 'WHERE 1=1';
      const params = [];

      if (action && action !== 'ALL') {
        params.push(action);
        where += ` AND action = $${params.length}`;
      }

      if (resourceType && resourceType !== 'ALL') {
        params.push(resourceType);
        where += ` AND resource_type = $${params.length}`;
      }

      if (actorId) {
        params.push(actorId);
        where += ` AND actor_id = $${params.length}`;
      }

      if (search && search.trim()) {
        params.push(`%${search.trim().toLowerCase()}%`);
        where += ` AND (LOWER(action) LIKE $${params.length} OR LOWER(COALESCE(actor_email, '')) LIKE $${params.length} OR LOWER(COALESCE(summary, '')) LIKE $${params.length} OR LOWER(COALESCE(resource_type, '')) LIKE $${params.length})`;
      }

      if (startDate) {
        params.push(startDate);
        where += ` AND created_at >= $${params.length}`;
      }

      if (endDate) {
        params.push(endDate);
        where += ` AND created_at <= $${params.length}`;
      }

      const countRes = await pool.query(`SELECT COUNT(*)::int as count FROM audit_logs ${where}`, params);
      const total = countRes.rows[0]?.count || 0;

      const dataQuery = `
        SELECT id, actor_id, actor_email, action, resource_type, resource_id, summary, ip_address, created_at
        FROM audit_logs
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
    let list = [...(memoryStore.audit_logs || [])];

    if (action && action !== 'ALL') list = list.filter(l => l.action === action);
    if (resourceType && resourceType !== 'ALL') list = list.filter(l => l.resource_type === resourceType);
    if (actorId) list = list.filter(l => l.actor_id === actorId);
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(l =>
        l.action?.toLowerCase().includes(q) ||
        l.actor_email?.toLowerCase().includes(q) ||
        l.summary?.toLowerCase().includes(q) ||
        l.resource_type?.toLowerCase().includes(q)
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
