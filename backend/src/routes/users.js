import express from 'express';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validation.js';
import { uploadAvatar } from '../middleware/upload.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// @desc    Update user profile
// @route   PUT /api/v1/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res, next) => {
  const allowedFields = [
    'firstName', 'lastName', 'phone', 'dateOfBirth', 'gender',
    'emergencyContact', 'medicalInfo', 'preferences'
  ];

  const updates = {};
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    user
  });
});

// @desc    Upload user avatar
// @route   POST /api/v1/users/avatar
// @access  Private
const uploadUserAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload an image file', 400));
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { avatar: req.file.path },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Avatar uploaded successfully',
    avatar: user.avatar
  });
});

// @desc    Add user address
// @route   POST /api/v1/users/addresses
// @access  Private
const addAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  // If this is the first address or marked as default, make it default
  if (user.addresses.length === 0 || req.body.isDefault) {
    user.addresses.forEach(addr => addr.isDefault = false);
    req.body.isDefault = true;
  }

  user.addresses.push(req.body);
  await user.save();

  res.status(201).json({
    success: true,
    message: 'Address added successfully',
    addresses: user.addresses
  });
});

// @desc    Update user address
// @route   PUT /api/v1/users/addresses/:addressId
// @access  Private
const updateAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const address = user.addresses.id(req.params.addressId);

  if (!address) {
    return next(new AppError('Address not found', 404));
  }

  // If setting as default, remove default from other addresses
  if (req.body.isDefault) {
    user.addresses.forEach(addr => addr.isDefault = false);
  }

  Object.assign(address, req.body);
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Address updated successfully',
    addresses: user.addresses
  });
});

// @desc    Delete user address
// @route   DELETE /api/v1/users/addresses/:addressId
// @access  Private
const deleteAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const address = user.addresses.id(req.params.addressId);

  if (!address) {
    return next(new AppError('Address not found', 404));
  }

  const wasDefault = address.isDefault;
  address.deleteOne();

  // If deleted address was default, make first remaining address default
  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Address deleted successfully',
    addresses: user.addresses
  });
});

// @desc    Get all users (Admin only)
// @route   GET /api/v1/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.role) {
    filter.role = req.query.role;
  }
  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === 'true';
  }

  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      limit,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    },
    users
  });
});

// @desc    Get single user (Admin only)
// @route   GET /api/v1/users/:id
// @access  Private/Admin
const getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    success: true,
    user
  });
});

// @desc    Update user (Admin only)
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).select('-password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    success: true,
    user
  });
});

// @desc    Delete user (Admin only)
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Soft delete
  user.isActive = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
});

// User routes
router.put('/profile', updateProfile);
router.post('/avatar', uploadAvatar, uploadUserAvatar);
router.post('/addresses', addAddress);
router.put('/addresses/:addressId', updateAddress);
router.delete('/addresses/:addressId', deleteAddress);

// Admin routes
router.get('/', authorize('admin'), getUsers);
router.get('/:id', authorize('admin'), validateObjectId(), getUser);
router.put('/:id', authorize('admin'), validateObjectId(), updateUser);
router.delete('/:id', authorize('admin'), validateObjectId(), deleteUser);

export default router;