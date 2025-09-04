import express from 'express';
import Category from '../models/Category.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validation.js';

const router = express.Router();

// @desc    Get all categories
// @route   GET /api/v1/categories
// @access  Public
const getCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find({ isActive: true })
    .populate('subcategories')
    .populate('productsCount')
    .sort({ sortOrder: 1, name: 1 });

  res.status(200).json({
    success: true,
    count: categories.length,
    categories
  });
});

// @desc    Get single category
// @route   GET /api/v1/categories/:id
// @access  Public
const getCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id)
    .populate('subcategories')
    .populate('productsCount');

  if (!category || !category.isActive) {
    return next(new AppError('Category not found', 404));
  }

  res.status(200).json({
    success: true,
    category
  });
});

// @desc    Create category
// @route   POST /api/v1/categories
// @access  Private/Admin
const createCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.create(req.body);

  res.status(201).json({
    success: true,
    category
  });
});

// @desc    Update category
// @route   PUT /api/v1/categories/:id
// @access  Private/Admin
const updateCategory = asyncHandler(async (req, res, next) => {
  let category = await Category.findById(req.params.id);

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    category
  });
});

// @desc    Delete category
// @route   DELETE /api/v1/categories/:id
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  // Soft delete
  category.isActive = false;
  await category.save();

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully'
  });
});

// Public routes
router.get('/', getCategories);
router.get('/:id', validateObjectId(), getCategory);

// Protected routes (Admin only)
router.use(protect);
router.use(authorize('admin'));

router.post('/', createCategory);
router.put('/:id', validateObjectId(), updateCategory);
router.delete('/:id', validateObjectId(), deleteCategory);

export default router;