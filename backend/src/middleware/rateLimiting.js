import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/appError.js';

// General API rate limiting
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Password reset rate limiting
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    error: {
      message: 'Too many password reset attempts, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload rate limiting
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 upload requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many upload attempts, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Search rate limiting
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 search requests per minute
  message: {
    success: false,
    error: {
      message: 'Too many search requests, please slow down.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});