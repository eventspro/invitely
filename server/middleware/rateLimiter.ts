import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter for all routes
 * Allows 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip rate limiting for development mode
  skip: (req) => {
    return process.env.NODE_ENV === 'development' && !process.env.VERCEL;
  }
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
  skip: (req) => {
    return process.env.NODE_ENV === 'development' && !process.env.VERCEL;
  }
});

/**
 * Authentication rate limiter for login/registration
 * Allows 10 attempts per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login/register attempts
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return process.env.NODE_ENV === 'development' && !process.env.VERCEL;
  }
});

/**
 * Admin panel rate limiter for sensitive operations
 * Allows 50 requests per 15 minutes per IP
 */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit admin operations
  message: {
    success: false,
    error: 'Too many admin panel requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return process.env.NODE_ENV === 'development' && !process.env.VERCEL;
  }
});

/**
 * Image upload rate limiter
 * Allows 20 uploads per 15 minutes per IP
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit image uploads
  message: {
    success: false,
    error: 'Too many upload attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return process.env.NODE_ENV === 'development' && !process.env.VERCEL;
  }
});
