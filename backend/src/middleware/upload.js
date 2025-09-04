import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '../utils/appError.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary storage for prescription images
const prescriptionStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'medcare/prescriptions',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    transformation: [
      { width: 1200, height: 1600, crop: 'limit', quality: 'auto' }
    ]
  }
});

// Cloudinary storage for product images
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'medcare/products',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [
      { width: 800, height: 800, crop: 'limit', quality: 'auto' }
    ]
  }
});

// Cloudinary storage for user avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'medcare/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [
      { width: 200, height: 200, crop: 'fill', gravity: 'face', quality: 'auto' }
    ]
  }
});

// File filter function
const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`, 400), false);
  }
};

// Prescription image upload
export const uploadPrescriptionImages = multer({
  storage: prescriptionStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Maximum 5 files
  },
  fileFilter: fileFilter([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf'
  ])
}).array('prescriptionImages', 5);

// Product image upload
export const uploadProductImages = multer({
  storage: productStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10 // Maximum 10 files
  },
  fileFilter: fileFilter([
    'image/jpeg',
    'image/jpg',
    'image/png'
  ])
}).array('productImages', 10);

// Single product image upload
export const uploadSingleProductImage = multer({
  storage: productStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter([
    'image/jpeg',
    'image/jpg',
    'image/png'
  ])
}).single('productImage');

// Avatar upload
export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: fileFilter([
    'image/jpeg',
    'image/jpg',
    'image/png'
  ])
}).single('avatar');

// Error handling middleware for multer
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File size too large', 400));
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return next(new AppError('Too many files uploaded', 400));
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new AppError('Unexpected file field', 400));
    }
  }
  next(error);
};

// Utility function to delete image from Cloudinary
export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    logger.error('Failed to delete image from Cloudinary:', error);
    throw error;
  }
};