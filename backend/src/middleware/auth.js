import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';

// Protect routes
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check for token in cookies
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return next(new AppError('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists', 401));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(new AppError('User account has been deactivated', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new AppError('Not authorized to access this route', 401));
  }
});

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`User role ${req.user.role} is not authorized to access this route`, 403));
    }
    next();
  };
};

// Optional authentication (for routes that work with or without auth)
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Token is invalid, but that's okay for optional auth
      req.user = null;
    }
  }

  next();
});

// Check if email is verified
export const requireEmailVerification = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return next(new AppError('Please verify your email address to access this feature', 403));
  }
  next();
};

// Check if user owns resource
export const checkOwnership = (Model, paramName = 'id', userField = 'user') => {
  return asyncHandler(async (req, res, next) => {
    const resource = await Model.findById(req.params[paramName]);
    
    if (!resource) {
      return next(new AppError('Resource not found', 404));
    }

    const resourceUserId = userField.includes('.') 
      ? userField.split('.').reduce((obj, key) => obj[key], resource)
      : resource[userField];

    if (resourceUserId.toString() !== req.user.id && !['admin', 'pharmacist'].includes(req.user.role)) {
      return next(new AppError('Not authorized to access this resource', 403));
    }

    req.resource = resource;
    next();
  });
};