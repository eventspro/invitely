import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db.js';
import { managementUsers, orders, userAdminPanels } from '../../shared/schema.js';
import { eq, and } from 'drizzle-orm';

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
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '7d';
const BCRYPT_ROUNDS = 12;

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
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): any | null => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Generate secure random tokens
export const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Auth middleware
export const authenticateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Development bypass - create a fake user for testing
    if (process.env.NODE_ENV === 'development' || process.env.VERCEL === '1') {
      console.log('🔓 Development/Demo mode: Bypassing user authentication');
      req.user = {
        id: 'dev-user-123',
        email: 'dev@example.com',
        firstName: 'Dev',
        lastName: 'User',
        status: 'active'
      };
      return next();
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.cookies?.authToken;

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
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
      return res.status(401).json({ error: 'User not found or inactive' });
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
    // Development bypass - allow access without authentication in development
    if (process.env.NODE_ENV === 'development' || process.env.VERCEL === '1') {
      console.log('🔓 Development/Demo mode: Bypassing admin panel authentication');
      req.adminPanel = {
        id: 'dev-panel',
        userId: 'dev-user',
        templateId: req.params.templateId || req.body.templateId,
        orderId: 'dev-order',
        isActive: true,
        templatePlan: 'ultimate'
      };
      return next();
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
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
      return res.status(403).json({ 
        error: 'Admin panel access denied. Ultimate template purchase required.' 
      });
    }

    req.adminPanel = {
      ...adminPanel,
      templatePlan: adminPanel.templatePlan || 'basic'
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
