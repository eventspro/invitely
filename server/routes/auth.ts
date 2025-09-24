import express from 'express';
import { db } from '../db.js';
import { managementUsers, orders, userAdminPanels, templates } from '../../shared/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  generateSecureToken,
  authenticateUser,
  AuthenticatedRequest 
} from '../middleware/auth.js';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many authentication attempts, please try again later' }
});

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 emails per hour
  message: { error: 'Too many email requests, please try again later' }
});

// Email configuration (configure according to your email provider)
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// User registration
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, orderNumber } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Check if user already exists
    const existingUser = await db.select().from(managementUsers).where(eq(managementUsers.email, email.toLowerCase())).limit(1);
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Verify order exists and is for Ultimate template if orderNumber provided
    let order = null;
    if (orderNumber) {
      const orderResult = await db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.orderNumber, orderNumber),
            eq(orders.templatePlan, 'ultimate'),
            eq(orders.status, 'completed')
          )
        )
        .limit(1);
      
      if (orderResult.length === 0) {
        return res.status(400).json({ 
          error: 'Invalid order number or order is not for Ultimate template' 
        });
      }
      
      order = orderResult[0];
      
      // Check if order is already linked to a user
      if (order.userId) {
        return res.status(400).json({ error: 'This order is already linked to another user' });
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const emailVerificationToken = generateSecureToken();

    // Create user
    const userResult = await db
      .insert(managementUsers)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        phone,
        emailVerificationToken,
      })
      .returning({
        id: managementUsers.id,
        email: managementUsers.email,
        firstName: managementUsers.firstName,
        lastName: managementUsers.lastName,
      });

    const user = userResult[0];

    // Link order to user if provided
    if (order) {
      await db
        .update(orders)
        .set({
          userId: user.id,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));
      
      // Create admin panel access if Ultimate template
      if (order.templatePlan === 'ultimate' && order.templateId) {
        // Get template slug
        const [template] = await db.select({ slug: templates.slug })
          .from(templates)
          .where(eq(templates.id, order.templateId))
          .limit(1);
        
        if (template) {
          await db
            .insert(userAdminPanels)
            .values({
              userId: user.id,
              templateId: order.templateId,
              templateSlug: template.slug,
              orderId: order.id,
              isActive: true,
            });
        
        // Update order to mark admin access granted
        await db
          .update(orders)
          .set({ adminAccessGranted: true })
          .where(eq(orders.id, order.id));
        }
      }
    }

    // Send verification email
    if (process.env.SMTP_USER) {
      try {
        const transporter = createEmailTransporter();
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5001'}/verify-email?token=${emailVerificationToken}`;
        
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: email,
          subject: 'Verify Your Wedding Site Account',
          html: `
            <h2>Welcome to Wedding Sites!</h2>
            <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
            <a href="${verificationUrl}" style="background: #d4af37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a>
            <p>If you didn't create this account, you can safely ignore this email.</p>
          `
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail registration if email fails
      }
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: false
      },
      token,
      hasAdminAccess: !!order && order.templatePlan === 'ultimate'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user
    const userResult = await db
      .select({
        id: managementUsers.id,
        email: managementUsers.email,
        passwordHash: managementUsers.passwordHash,
        firstName: managementUsers.firstName,
        lastName: managementUsers.lastName,
        status: managementUsers.status,
        emailVerified: managementUsers.emailVerified,
      })
      .from(managementUsers)
      .where(eq(managementUsers.email, email.toLowerCase()))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userResult[0];

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Account is suspended or deleted' });
    }

    // Verify password
    const passwordValid = await comparePassword(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await db
      .update(managementUsers)
      .set({ lastLogin: new Date() })
      .where(eq(managementUsers.id, user.id));

    // Check for admin panel access
    const adminPanelResult = await db
      .select({
        id: userAdminPanels.id,
        templateId: userAdminPanels.templateId,
        templateName: templates.name,
        templateSlug: templates.slug,
        isActive: userAdminPanels.isActive,
      })
      .from(userAdminPanels)
      .innerJoin(templates, eq(userAdminPanels.templateId, templates.id))
      .innerJoin(orders, eq(userAdminPanels.orderId, orders.id))
      .where(
        and(
          eq(userAdminPanels.userId, user.id),
          eq(userAdminPanels.isActive, true),
          eq(orders.status, 'completed')
        )
      );

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
        hasAdminAccess: adminPanelResult.length > 0,
        adminPanels: adminPanelResult
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Template-specific customer login - this endpoint is deprecated
// Users should login through the regular /login endpoint
router.post('/template-login', authLimiter, async (req, res) => {
  res.status(404).json({ 
    error: 'This endpoint is deprecated. Please use /login instead.' 
  });
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token required' });
    }

    const userResult = await db
      .select({ id: managementUsers.id })
      .from(managementUsers)
      .where(eq(managementUsers.emailVerificationToken, token))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    const userId = userResult[0].id;

    // Mark email as verified
    await db
      .update(managementUsers)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
      })
      .where(eq(managementUsers.id, userId));

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
});

// Request password reset
router.post('/forgot-password', emailLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const userResult = await db
      .select({ id: managementUsers.id })
      .from(managementUsers)
      .where(
        and(
          eq(managementUsers.email, email.toLowerCase()),
          eq(managementUsers.status, 'active')
        )
      )
      .limit(1);

    // Always return success to prevent email enumeration
    if (userResult.length === 0) {
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent' });
    }

    const userId = userResult[0].id;
    const resetToken = generateSecureToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token
    await db
      .update(managementUsers)
      .set({
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      })
      .where(eq(managementUsers.id, userId));

    // Send reset email
    if (process.env.SMTP_USER) {
      try {
        const transporter = createEmailTransporter();
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5001'}/reset-password?token=${resetToken}`;
        
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: email,
          subject: 'Reset Your Password',
          html: `
            <h2>Password Reset Request</h2>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <a href="${resetUrl}" style="background: #d4af37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
          `
        });
      } catch (emailError) {
        console.error('Failed to send reset email:', emailError);
      }
    }

    res.json({ message: 'If an account with that email exists, a password reset link has been sent' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Password reset request failed' });
  }
});

// Reset password
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const userResult = await db
      .select({ id: managementUsers.id })
      .from(managementUsers)
      .where(
        and(
          eq(managementUsers.passwordResetToken, token),
          sql`password_reset_expires > now()`
        )
      )
      .limit(1);

    if (userResult.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const userId = userResult[0].id;
    const passwordHash = await hashPassword(newPassword);

    // Update password and clear reset token
    await db
      .update(managementUsers)
      .set({
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      })
      .where(eq(managementUsers.id, userId));

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// Get current user profile
router.get('/profile', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userResult = await db
      .select({
        id: managementUsers.id,
        email: managementUsers.email,
        firstName: managementUsers.firstName,
        lastName: managementUsers.lastName,
        phone: managementUsers.phone,
        status: managementUsers.status,
        emailVerified: managementUsers.emailVerified,
        lastLogin: managementUsers.lastLogin,
        createdAt: managementUsers.createdAt,
      })
      .from(managementUsers)
      .where(eq(managementUsers.id, req.user!.id))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult[0];

    // Get admin panels
    const adminPanelResult = await db
      .select({
        id: userAdminPanels.id,
        templateId: userAdminPanels.templateId,
        templateName: templates.name,
        templateSlug: templates.slug,
        orderNumber: orders.orderNumber,
        isActive: userAdminPanels.isActive,
      })
      .from(userAdminPanels)
      .innerJoin(templates, eq(userAdminPanels.templateId, templates.id))
      .innerJoin(orders, eq(userAdminPanels.orderId, orders.id))
      .where(
        and(
          eq(userAdminPanels.userId, req.user!.id),
          eq(userAdminPanels.isActive, true)
        )
      );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      },
      adminPanels: adminPanelResult
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Update user profile
router.put('/profile', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { firstName, lastName, phone } = req.body;

    await db
      .update(managementUsers)
      .set({
        firstName,
        lastName,
        phone,
        updatedAt: new Date(),
      })
      .where(eq(managementUsers.id, req.user!.id));

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Create order (for testing purposes)
router.post('/create-order', async (req, res) => {
  try {
    const { email, templateId, templatePlan, totalAmount, paymentMethod } = req.body;

    // Validate required fields
    if (!email || !templateId || !templatePlan || !totalAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find the user
    const [user] = await db.select().from(managementUsers).where(eq(managementUsers.email, email));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate a unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create the order
    const [order] = await db.insert(orders).values({
      orderNumber,
      userId: user.id,
      templateId,
      templatePlan,
      amount: totalAmount,
      paymentMethod: paymentMethod || 'card',
      status: 'completed',
      adminAccessGranted: templatePlan.toLowerCase() === 'ultimate'
    }).returning();

    // If this is an Ultimate plan, create admin panel access
    if (templatePlan.toLowerCase() === 'ultimate') {
      // Get template slug
      const [template] = await db.select({ slug: templates.slug })
        .from(templates)
        .where(eq(templates.id, templateId))
        .limit(1);
      
      if (template) {
        await db.insert(userAdminPanels).values({
          userId: user.id,
          templateId,
          templateSlug: template.slug,
          orderId: order.id,
          isActive: true
        });
      }
    }

    res.json({ 
      message: 'Order created successfully',
      order,
      adminPanelCreated: templatePlan.toLowerCase() === 'ultimate'
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Debug endpoint to check user data (for testing only)
router.get('/debug-user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    // Get user
    const [user] = await db.select().from(managementUsers).where(eq(managementUsers.email, email));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get orders
    const userOrders = await db.select().from(orders).where(eq(orders.userId, user.id));
    
    // Get admin panels
    const adminPanels = await db.select().from(userAdminPanels).where(eq(userAdminPanels.userId, user.id));

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status
      },
      orders: userOrders,
      adminPanels: adminPanels
    });

  } catch (error) {
    console.error('Debug user error:', error);
    res.status(500).json({ error: 'Debug failed' });
  }
});

// Logout (invalidate token on client side)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
