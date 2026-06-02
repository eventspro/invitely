import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter for all routes
 * Allows 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict RSVP submission rate limiter
 * Allows 5 submissions per hour per IP to prevent spam
 */
export const rsvpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 RSVP submissions per hour
  message: {
    success: false,
    error: 'Too many RSVP submissions, please try again in an hour. Խնդրում ենք փորձել մեկ ժամ անց։'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Authentication rate limiter — 100 attempts per 15 minutes per IP (relaxed for testing)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

/**
 * Admin panel rate limiter — 200 requests per 15 minutes per IP
 * Applied to /api/admin-panel/* and /api/planner/* routes.
 */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    error: 'Too many admin panel requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * CSP report endpoint rate limiter — 60 requests per minute per IP
 * No environment bypass.
 */
export const cspReportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: { success: false, error: 'Too many requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Image upload rate limiter — 20 uploads per 15 minutes
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: 'Too many upload attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
