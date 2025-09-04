import express from 'express';
import { protect } from '../middleware/auth.js';
import { 
  uploadPrescriptionImages, 
  uploadProductImages, 
  uploadAvatar,
  handleUploadError 
} from '../middleware/upload.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// @desc    Upload prescription images
// @route   POST /api/v1/uploads/prescriptions
// @access  Private
const uploadPrescriptions = asyncHandler(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }

  const uploadedFiles = req.files.map(file => ({
    url: file.path,
    publicId: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype
  }));

  res.status(200).json({
    success: true,
    message: 'Files uploaded successfully',
    files: uploadedFiles
  });
});

// @desc    Upload product images
// @route   POST /api/v1/uploads/products
// @access  Private/Admin
const uploadProducts = asyncHandler(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }

  const uploadedFiles = req.files.map(file => ({
    url: file.path,
    publicId: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype
  }));

  res.status(200).json({
    success: true,
    message: 'Product images uploaded successfully',
    files: uploadedFiles
  });
});

// Routes
router.post('/prescriptions', uploadPrescriptionImages, handleUploadError, uploadPrescriptions);
router.post('/products', uploadProductImages, handleUploadError, uploadProducts);

export default router;