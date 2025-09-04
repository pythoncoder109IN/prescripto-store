import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';
import { APIFeatures } from '../utils/apiFeatures.js';

// @desc    Get all products
// @route   GET /api/v1/products
// @access  Public
export const getProducts = asyncHandler(async (req, res, next) => {
  // Build query
  const features = new APIFeatures(
    Product.find({ isActive: true }).populate('category', 'name slug'),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const products = await features.query;

  // Get total count for pagination
  const total = await Product.countDocuments({ 
    isActive: true,
    ...features.getFilterQuery()
  });

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    pagination: features.getPaginationInfo(total),
    products
  });
});

// @desc    Get single product
// @route   GET /api/v1/products/:id
// @access  Public
export const getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name slug')
    .populate({
      path: 'reviews',
      match: { isApproved: true },
      populate: {
        path: 'user',
        select: 'firstName lastName avatar'
      },
      options: { sort: { createdAt: -1 }, limit: 10 }
    });

  if (!product || !product.isActive) {
    return next(new AppError('Product not found', 404));
  }

  res.status(200).json({
    success: true,
    product
  });
});

// @desc    Get featured products
// @route   GET /api/v1/products/featured
// @access  Public
export const getFeaturedProducts = asyncHandler(async (req, res, next) => {
  const products = await Product.find({ 
    isActive: true, 
    isFeatured: true 
  })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(8);

  res.status(200).json({
    success: true,
    count: products.length,
    products
  });
});

// @desc    Search products
// @route   GET /api/v1/products/search
// @access  Public
export const searchProducts = asyncHandler(async (req, res, next) => {
  const { q, category, minPrice, maxPrice, prescriptionRequired } = req.query;

  if (!q || q.trim().length < 2) {
    return next(new AppError('Search query must be at least 2 characters', 400));
  }

  const searchQuery = {
    isActive: true,
    $text: { $search: q }
  };

  // Add filters
  if (category) {
    const categoryDoc = await Category.findOne({ slug: category });
    if (categoryDoc) {
      searchQuery.category = categoryDoc._id;
    }
  }

  if (minPrice || maxPrice) {
    searchQuery.price = {};
    if (minPrice) searchQuery.price.$gte = parseFloat(minPrice);
    if (maxPrice) searchQuery.price.$lte = parseFloat(maxPrice);
  }

  if (prescriptionRequired !== undefined) {
    searchQuery.prescriptionRequired = prescriptionRequired === 'true';
  }

  const products = await Product.find(searchQuery)
    .populate('category', 'name slug')
    .sort({ score: { $meta: 'textScore' }, 'rating.average': -1 })
    .limit(50);

  res.status(200).json({
    success: true,
    count: products.length,
    products
  });
});

// @desc    Get products by category
// @route   GET /api/v1/products/category/:slug
// @access  Public
export const getProductsByCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true });

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  const features = new APIFeatures(
    Product.find({ category: category._id, isActive: true }).populate('category', 'name slug'),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const products = await features.query;
  const total = await Product.countDocuments({ 
    category: category._id, 
    isActive: true,
    ...features.getFilterQuery()
  });

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    category,
    pagination: features.getPaginationInfo(total),
    products
  });
});

// @desc    Get product recommendations
// @route   GET /api/v1/products/:id/recommendations
// @access  Public
export const getProductRecommendations = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Get related products from same category
  const relatedProducts = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    isActive: true
  })
    .populate('category', 'name slug')
    .sort({ 'rating.average': -1, createdAt: -1 })
    .limit(8);

  res.status(200).json({
    success: true,
    count: relatedProducts.length,
    products: relatedProducts
  });
});

// @desc    Create product (Admin only)
// @route   POST /api/v1/products
// @access  Private/Admin
export const createProduct = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.createdBy = req.user.id;

  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    product
  });
});

// @desc    Update product (Admin only)
// @route   PUT /api/v1/products/:id
// @access  Private/Admin
export const updateProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    product
  });
});

// @desc    Delete product (Admin only)
// @route   DELETE /api/v1/products/:id
// @access  Private/Admin
export const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Soft delete - just mark as inactive
  product.isActive = false;
  await product.save();

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// @desc    Update product stock
// @route   PATCH /api/v1/products/:id/stock
// @access  Private/Admin
export const updateProductStock = asyncHandler(async (req, res, next) => {
  const { quantity, operation } = req.body; // operation: 'add', 'subtract', 'set'

  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  switch (operation) {
    case 'add':
      product.stock.quantity += quantity;
      break;
    case 'subtract':
      product.stock.quantity = Math.max(0, product.stock.quantity - quantity);
      break;
    case 'set':
      product.stock.quantity = quantity;
      break;
    default:
      return next(new AppError('Invalid operation', 400));
  }

  await product.save();

  res.status(200).json({
    success: true,
    product
  });
});