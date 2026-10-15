import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { userRepository } from '../repositories/userRepository.js';
import { securityLogRepository } from '../repositories/securityLogRepository.js';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Access denied. No authentication token provided.'
      }
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await userRepository.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'The account associated with this session no longer exists.'
        }
      });
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
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your account has been suspended. Please contact an administrator.'
        }
      });
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
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_DEACTIVATED',
          message: 'This account has been deactivated.'
        }
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid, malformed, or expired authentication token.'
      }
    });
  }
}

export const requireAuth = authenticateToken;

/**
 * Require a specific role (single role check)
 * Usage: requireRole('ADMIN')
 */
export function requireRole(requiredRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required for this action.' }
      });
    }

    if (req.user.role !== requiredRole) {
      securityLogRepository.logEvent({
        eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        severity: 'WARNING',
        userId: req.user.id,
        userEmail: req.user.email,
        ipAddress: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
        details: `User with role ${req.user.role} attempted to access route requiring ${requiredRole}: ${req.method} ${req.originalUrl}`,
        metadata: { path: req.originalUrl, method: req.method, requiredRole, userRole: req.user.role }
      }).catch(() => {});
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Forbidden: Only users with role '${requiredRole}' can perform this operation.`
        }
      });
    }

    next();
  };
}

/**
 * Require any of the listed roles
 * Usage: requireAnyRole('ADMIN', 'TEACHER')
 */
export function requireAnyRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required for this action.' }
      });
    }

    if (!roles.includes(req.user.role)) {
      securityLogRepository.logEvent({
        eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        severity: 'WARNING',
        userId: req.user.id,
        userEmail: req.user.email,
        ipAddress: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
        details: `User with role ${req.user.role} attempted to access route requiring one of [${roles.join(', ')}]: ${req.method} ${req.originalUrl}`,
        metadata: { path: req.originalUrl, method: req.method, requiredRoles: roles, userRole: req.user.role }
      }).catch(() => {});
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Forbidden: This operation requires one of: ${roles.join(', ')}.`
        }
      });
    }

    next();
  };
}

export async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await userRepository.findById(decoded.id);
    req.user = user || null;
  } catch (err) {
    req.user = null;
  }
  next();
}
