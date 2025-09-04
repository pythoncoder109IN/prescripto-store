import { body, param, query, validationResult } from 'express-validator';
import { AppError } from '../utils/appError.js';

// Handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    return next(new AppError('Validation failed', 400, errorMessages));
  }
  
  next();
};

// User validation rules
export const validateRegister = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('phone')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  handleValidationErrors
];

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Product validation rules
export const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  
  body('sku')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('SKU must be between 3 and 50 characters'),
  
  body('category')
    .isMongoId()
    .withMessage('Valid category ID is required'),
  
  body('manufacturer')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Manufacturer name must be between 2 and 100 characters'),
  
  body('activeIngredient')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Active ingredient must be between 2 and 200 characters'),
  
  body('strength')
    .trim()
    .notEmpty()
    .withMessage('Strength/dosage is required'),
  
  body('dosageForm')
    .isIn(['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'patch'])
    .withMessage('Invalid dosage form'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('costPrice')
    .isFloat({ min: 0 })
    .withMessage('Cost price must be a positive number'),
  
  body('stock.quantity')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  
  handleValidationErrors
];

// Prescription validation rules
export const validatePrescription = [
  body('doctorName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Doctor name must be between 2 and 100 characters'),
  
  body('doctorLicenseNumber')
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage('Doctor license number must be between 5 and 50 characters'),
  
  body('medications')
    .isArray({ min: 1 })
    .withMessage('At least one medication is required'),
  
  body('medications.*.name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Medication name must be between 2 and 200 characters'),
  
  body('medications.*.dosage')
    .trim()
    .notEmpty()
    .withMessage('Medication dosage is required'),
  
  body('medications.*.frequency')
    .trim()
    .notEmpty()
    .withMessage('Medication frequency is required'),
  
  body('medications.*.duration')
    .trim()
    .notEmpty()
    .withMessage('Medication duration is required'),
  
  body('medications.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Medication quantity must be at least 1'),
  
  body('prescriptionDate')
    .isISO8601()
    .withMessage('Valid prescription date is required'),
  
  handleValidationErrors
];

// Order validation rules
export const validateOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  
  body('items.*.product')
    .isMongoId()
    .withMessage('Valid product ID is required'),
  
  body('items.*.quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100'),
  
  body('shippingAddress.firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('shippingAddress.lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('shippingAddress.street')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Street address must be between 5 and 200 characters'),
  
  body('shippingAddress.city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  
  body('shippingAddress.state')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters'),
  
  body('shippingAddress.zipCode')
    .trim()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Please provide a valid ZIP code'),
  
  body('shippingAddress.phone')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('paymentMethod')
    .isIn(['card', 'paypal', 'bank_transfer', 'cash_on_delivery'])
    .withMessage('Invalid payment method'),
  
  handleValidationErrors
];

// Cart validation rules
export const validateAddToCart = [
  body('productId')
    .isMongoId()
    .withMessage('Valid product ID is required'),
  
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100'),
  
  body('prescriptionId')
    .optional()
    .isMongoId()
    .withMessage('Valid prescription ID is required'),
  
  handleValidationErrors
];

// MongoDB ObjectId validation
export const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} format`),
  
  handleValidationErrors
];

// Pagination validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

// Search validation
export const validateSearch = [
  query('q')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
  
  handleValidationErrors
];