import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db.js';
import { managementUsers, orders, userAdminPanels } from '../../shared/schema.js';
import { eq, and } from 'drizzle-orm';

// Structured security event logger — no PII fields
const securityEvent = (
  event: string,
  meta: { userId?: string; route?: string; templateId?: string; ip?: string; status?: number }
) => {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...meta }));
};

// Anomaly detection note:
// Monitor for: same IP hitting 401 on /api/admin-panel/* > 5 times in 1 min
// -> indicates credential stuffing or endpoint scanning
// -> export securityEvent logs to your SIEM / Datadog / Vercel log drain and alert on event=auth_failed count

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    status: string;
  };
  adminPanel?: {
    id: string;
    userId: string | null;
    templateId: string;
    orderId: string | null;
    isActive: boolean | null;
    templatePlan: string;
    role: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  // Log a warning but do NOT throw at module level — a module-level throw crashes
  // every Vercel serverless function invocation, including completely public routes
  // like /api/templates and /api/translations. Auth functions will throw lazily.
  console.error('[auth] CRITICAL: JWT_SECRET environment variable is not set. Auth-protected routes will fail, but public routes remain available.');
}
const JWT_EXPIRES_IN = '7d';
const BCRYPT_ROUNDS = 12;

// Lazy getter — throws only when an auth function is actually invoked
function requireJwtSecret(): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required for authentication. Set it in Vercel environment variables and redeploy.');
  }
  return JWT_SECRET;
}

// Password hashing utilities
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// JWT utilities
export const generateToken = (userId: string, email: string, additionalPayload?: any): string => {
  const payload = { 
    userId, 
    email,
    ...additionalPayload 
  };
  return jwt.sign(payload, requireJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): any | null => {
  try {
    return jwt.verify(token, requireJwtSecret());
  } catch (error) {
    return null;
  }
};

// Generate secure random tokens
export const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Centralized auth failure handler — always use this for consistent security responses
export const authFailHandler = (res: Response, statusCode: 401 | 403 | 404, message: string): void => {
  // Return 404 on admin routes to prevent endpoint enumeration
  res.status(statusCode).json({ error: message });
};

// Auth middleware
export const authenticateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.cookies?.authToken;

    if (!token) {
      // 404 hides the existence of these endpoints from unauthenticated callers
      securityEvent('auth_missing_token', { route: req.path, ip: req.ip, status: 404 });
      return res.status(404).json({ error: 'Not found' });
    }

    const isAdminRoute = req.originalUrl.includes('/api/admin-panel');

    const decoded = verifyToken(token);
    if (!decoded) {
      const status = isAdminRoute ? 404 : 401;
      securityEvent('auth_invalid_token', { route: req.path, ip: req.ip, status });
      return res.status(status).json({ error: isAdminRoute ? 'Not found' : 'Invalid or expired token' });
    }

    // Get user from database
    const [user] = await db.select({
      id: managementUsers.id,
      email: managementUsers.email,
      firstName: managementUsers.firstName,
      lastName: managementUsers.lastName,
      status: managementUsers.status
    }).from(managementUsers)
    .where(and(
      eq(managementUsers.id, decoded.userId),
      eq(managementUsers.status, 'active')
    ));

    if (!user) {
      const status = isAdminRoute ? 404 : 401;
      securityEvent('auth_user_not_found', { route: req.path, ip: req.ip, status });
      return res.status(status).json({ error: isAdminRoute ? 'Not found' : 'User not found or inactive' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      status: user.status || 'active'
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Check if user has admin panel access
export const requireAdminPanelAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      // Should not reach here if authenticateUser ran first, but guard defensively
      securityEvent('admin_no_user_context', { route: req.path, ip: req.ip, status: 404 });
      return res.status(404).json({ error: 'Not found' });
    }

    const templateId = req.params.templateId || req.body.templateId;
    if (!templateId) {
      return res.status(400).json({ error: 'Template ID required' });
    }

    // Check if user has admin panel access for this template
    const [adminPanel] = await db.select({
      id: userAdminPanels.id,
      userId: userAdminPanels.userId,
      templateId: userAdminPanels.templateId,
      orderId: userAdminPanels.orderId,
      isActive: userAdminPanels.isActive,
      role: userAdminPanels.role,
      templatePlan: orders.templatePlan
    })
    .from(userAdminPanels)
    .leftJoin(orders, eq(userAdminPanels.orderId, orders.id))
    .where(and(
      eq(userAdminPanels.userId, req.user.id),
      eq(userAdminPanels.templateId, templateId),
      eq(userAdminPanels.isActive, true),
      eq(orders.status, 'completed'),
      eq(orders.templatePlan, 'ultimate')
    ));

    if (!adminPanel) {
      securityEvent('admin_access_denied', {
        userId: req.user?.id,
        templateId,
        route: req.path,
        ip: req.ip,
        status: 404
      });
      return res.status(404).json({ error: 'Not found' });
    }

    req.adminPanel = {
      ...adminPanel,
      templatePlan: adminPanel.templatePlan || 'basic',
      role: adminPanel.role || 'customer'
    };
    next();
  } catch (error) {
    console.error('Admin panel access check error:', error);
    res.status(500).json({ error: 'Failed to verify admin panel access' });
  }
};

// Optional auth middleware (doesn't fail if no token)
export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.cookies?.authToken;

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const [user] = await db.select({
          id: managementUsers.id,
          email: managementUsers.email,
          firstName: managementUsers.firstName,
          lastName: managementUsers.lastName,
          status: managementUsers.status
        }).from(managementUsers)
        .where(and(
          eq(managementUsers.id, decoded.userId),
          eq(managementUsers.status, 'active')
        ));

        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            firstName: user.firstName || undefined,
            lastName: user.lastName || undefined,
            status: user.status || 'active'
          };
        }
      }
    }

    next();
  } catch (error) {
    // Don't fail on optional auth errors
    next();
  }
};

// Extend Request interface globally
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        status: string;
      };
      adminPanel?: any;
    }
  }
}

// Requires the caller to have super_admin role (must run after requireAdminPanelAccess)
export const requireSuperAdminRole = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.adminPanel?.role !== 'super_admin') {
    securityEvent('admin_insufficient_role', {
      userId: req.user?.id,
      templateId: req.adminPanel?.templateId,
      route: req.path,
      ip: req.ip,
      status: 403
    });
    return res.status(403).json({ error: 'Super Admin role required' });
  }
  next();
};
