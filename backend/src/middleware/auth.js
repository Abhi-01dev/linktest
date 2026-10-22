import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { userRepository } from '../repositories/userRepository.js';
import { securityLogRepository } from '../repositories/securityLogRepository.js';

/**
 * Standard unauthorized (401) JSON response
 */
function sendUnauthorized(res, message = 'Unauthorized') {
  return res.status(401).json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message
    }
  });
}

/**
 * Standard forbidden (403) JSON response
 */
function sendForbidden(res, code, message) {
  return res.status(403).json({
    success: false,
    error: {
      code,
      message
    }
  });
}

/**
 * Authenticate JWT Bearer Token middleware
 * Verifies Authorization header, extracts Bearer token, validates signature/expiration,
 * checks database user existence and account status (active vs suspended/deactivated).
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader || typeof authHeader !== 'string') {
    return sendUnauthorized(res);
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return sendUnauthorized(res);
  }

  const token = match[1].trim();
  if (!token) {
    return sendUnauthorized(res);
  }

  const secret = config.jwtSecret || process.env.JWT_SECRET;
  if (!secret) {
    return sendUnauthorized(res);
  }

  try {
    const decoded = jwt.verify(token, secret);
    if (!decoded || !decoded.id) {
      return sendUnauthorized(res);
    }

    const user = await userRepository.findById(decoded.id);

    if (!user) {
      return sendUnauthorized(res);
    }

    if (user.status === 'suspended') {
      securityLogRepository.logEvent({
        eventType: 'SUSPENDED_ACCOUNT_ACCESS_ATTEMPT',
        severity: 'HIGH',
        userId: user.id,
        userEmail: user.email,
        ipAddress: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
        details: `Suspended user attempted to access ${req.method} ${req.originalUrl}`
      }).catch(() => {});

      return sendForbidden(
        res,
        'ACCOUNT_SUSPENDED',
        'Your account has been suspended. Please contact an administrator.'
      );
    }

    if (user.status === 'deactivated') {
      securityLogRepository.logEvent({
        eventType: 'DEACTIVATED_ACCOUNT_ACCESS_ATTEMPT',
        severity: 'HIGH',
        userId: user.id,
        userEmail: user.email,
        ipAddress: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
        details: `Deactivated user attempted to access ${req.method} ${req.originalUrl}`
      }).catch(() => {});

      return sendForbidden(
        res,
        'ACCOUNT_DEACTIVATED',
        'This account has been deactivated.'
      );
    }

    req.user = user;
    next();
  } catch (err) {
    // Return standardized 401 without exposing JWT internals or stack traces
    return sendUnauthorized(res);
  }
}

export const requireAuth = authenticateToken;

/**
 * Optional authentication middleware:
 * Populates req.user if a valid token is present; otherwise leaves req.user = null and continues.
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader || typeof authHeader !== 'string') {
    req.user = null;
    return next();
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    req.user = null;
    return next();
  }

  const token = match[1].trim();
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const secret = config.jwtSecret || process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret);
    if (!decoded || !decoded.id) {
      req.user = null;
      return next();
    }

    const user = await userRepository.findById(decoded.id);
    req.user = (user && user.status === 'active') ? user : null;
  } catch (err) {
    req.user = null;
  }

  next();
}

// Re-export role guard functions for seamless backward compatibility
export { requireRole, requireAnyRole } from './roleGuard.js';
