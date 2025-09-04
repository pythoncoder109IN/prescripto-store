import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';

// @desc    Get user cart
// @route   GET /api/v1/cart
// @access  Private
export const getCart = asyncHandler(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user.id })
    .populate('items.product', 'name price images stock prescriptionRequired manufacturer');

  if (!cart) {
    cart = await Cart.create({ user: req.user.id, items: [] });
  }

  // Remove expired items and items with inactive products
  const validItems = cart.items.filter(item => 
    item.product && 
    item.product.isActive !== false &&
    item.addedAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days
  );

  if (validItems.length !== cart.items.length) {
    cart.items = validItems;
    await cart.save();
  }

  res.status(200).json({
    success: true,
    cart
  });
});

// @desc    Add item to cart
// @route   POST /api/v1/cart/items
// @access  Private
export const addToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity = 1, prescriptionId } = req.body;

  // Validate product
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return next(new AppError('Product not found or inactive', 404));
  }

  // Check stock availability
  if (product.stock.quantity < quantity) {
    return next(new AppError('Insufficient stock available', 400));
  }

  // Check prescription requirement
  if (product.prescriptionRequired && !prescriptionId) {
    return next(new AppError('Prescription required for this product', 400));
  }

  // Get or create cart
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    cart = await Cart.create({ user: req.user.id, items: [] });
  }

  // Check if item already exists in cart
  const existingItemIndex = cart.items.findIndex(
    item => item.product.toString() === productId
  );

  if (existingItemIndex > -1) {
    // Update quantity
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    
    if (product.stock.quantity < newQuantity) {
      return next(new AppError('Insufficient stock for requested quantity', 400));
    }

    cart.items[existingItemIndex].quantity = newQuantity;
    cart.items[existingItemIndex].addedAt = new Date();
  } else {
    // Add new item
    cart.items.push({
      product: productId,
      quantity,
      price: product.price,
      prescription: prescriptionId,
      addedAt: new Date()
    });
  }

  await cart.save();

  // Populate the cart for response
  await cart.populate('items.product', 'name price images stock prescriptionRequired manufacturer');

  res.status(200).json({
    success: true,
    cart
  });
});

// @desc    Update cart item quantity
// @route   PUT /api/v1/cart/items/:itemId
// @access  Private
export const updateCartItem = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;

  if (quantity < 1) {
    return next(new AppError('Quantity must be at least 1', 400));
  }

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    return next(new AppError('Cart not found', 404));
  }

  const itemIndex = cart.items.findIndex(
    item => item._id.toString() === req.params.itemId
  );

  if (itemIndex === -1) {
    return next(new AppError('Item not found in cart', 404));
  }

  // Check stock availability
  const product = await Product.findById(cart.items[itemIndex].product);
  if (!product || product.stock.quantity < quantity) {
    return next(new AppError('Insufficient stock available', 400));
  }

  cart.items[itemIndex].quantity = quantity;
  cart.items[itemIndex].addedAt = new Date();
  
  await cart.save();
  await cart.populate('items.product', 'name price images stock prescriptionRequired manufacturer');

  res.status(200).json({
    success: true,
    cart
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/v1/cart/items/:itemId
// @access  Private
export const removeFromCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    return next(new AppError('Cart not found', 404));
  }

  const itemIndex = cart.items.findIndex(
    item => item._id.toString() === req.params.itemId
  );

  if (itemIndex === -1) {
    return next(new AppError('Item not found in cart', 404));
  }

  cart.items.splice(itemIndex, 1);
  await cart.save();
  await cart.populate('items.product', 'name price images stock prescriptionRequired manufacturer');

  res.status(200).json({
    success: true,
    cart
  });
});

// @desc    Clear cart
// @route   DELETE /api/v1/cart
// @access  Private
export const clearCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    return next(new AppError('Cart not found', 404));
  }

  cart.items = [];
  await cart.save();

  res.status(200).json({
    success: true,
    message: 'Cart cleared successfully',
    cart
  });
});

// @desc    Apply coupon to cart
// @route   POST /api/v1/cart/coupon
// @access  Private
export const applyCoupon = asyncHandler(async (req, res, next) => {
  const { couponCode } = req.body;

  const cart = await Cart.findOne({ user: req.user.id })
    .populate('items.product', 'name price');

  if (!cart) {
    return next(new AppError('Cart not found', 404));
  }

  // Validate coupon (simplified - in real app, you'd have a Coupon model)
  const validCoupons = {
    'SAVE10': { discount: 10, type: 'percentage', minAmount: 50 },
    'WELCOME20': { discount: 20, type: 'percentage', minAmount: 30 },
    'FLAT5': { discount: 5, type: 'fixed', minAmount: 25 }
  };

  const coupon = validCoupons[couponCode.toUpperCase()];
  if (!coupon) {
    return next(new AppError('Invalid coupon code', 400));
  }

  const subtotal = cart.subtotal;
  if (subtotal < coupon.minAmount) {
    return next(new AppError(`Minimum order amount of $${coupon.minAmount} required for this coupon`, 400));
  }

  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = (subtotal * coupon.discount) / 100;
  } else {
    discount = coupon.discount;
  }

  cart.couponCode = couponCode.toUpperCase();
  cart.couponDiscount = discount;
  await cart.save();

  res.status(200).json({
    success: true,
    message: 'Coupon applied successfully',
    cart,
    discount
  });
});

// @desc    Remove coupon from cart
// @route   DELETE /api/v1/cart/coupon
// @access  Private
export const removeCoupon = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return next(new AppError('Cart not found', 404));
  }

  cart.couponCode = undefined;
  cart.couponDiscount = 0;
  await cart.save();

  res.status(200).json({
    success: true,
    message: 'Coupon removed successfully',
    cart
  });
});