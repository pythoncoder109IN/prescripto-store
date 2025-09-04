import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import Prescription from '../models/Prescription.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';
import { sendEmail } from '../utils/email.js';
import { logger } from '../utils/logger.js';

// @desc    Create new order
// @route   POST /api/v1/orders
// @access  Private
export const createOrder = asyncHandler(async (req, res, next) => {
  const {
    items,
    shippingAddress,
    billingAddress,
    paymentMethod,
    couponCode,
    customerNotes,
    prescriptions
  } = req.body;

  if (!items || items.length === 0) {
    return next(new AppError('Order must contain at least one item', 400));
  }

  if (!shippingAddress) {
    return next(new AppError('Shipping address is required', 400));
  }

  // Validate and calculate pricing
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);
    
    if (!product || !product.isActive) {
      return next(new AppError(`Product ${item.product} not found or inactive`, 400));
    }

    if (product.stock.quantity < item.quantity) {
      return next(new AppError(`Insufficient stock for ${product.name}`, 400));
    }

    // Check prescription requirement
    if (product.prescriptionRequired) {
      const validPrescription = prescriptions?.find(p => 
        p.medications.some(med => 
          med.name.toLowerCase().includes(product.name.toLowerCase()) ||
          product.name.toLowerCase().includes(med.name.toLowerCase())
        )
      );

      if (!validPrescription) {
        return next(new AppError(`Prescription required for ${product.name}`, 400));
      }
    }

    const itemTotal = product.price * item.quantity;
    subtotal += itemTotal;

    orderItems.push({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      prescription: item.prescription,
      prescriptionRequired: product.prescriptionRequired
    });

    // Reserve stock
    product.stock.reserved += item.quantity;
    await product.save();
  }

  // Calculate tax and shipping
  const taxRate = 0.08; // 8% tax
  const tax = subtotal * taxRate;
  const shipping = subtotal >= 50 ? 0 : 5.99;
  const total = subtotal + tax + shipping;

  // Create order
  const order = await Order.create({
    customer: req.user.id,
    items: orderItems,
    pricing: {
      subtotal,
      tax,
      shipping,
      total
    },
    shippingAddress,
    billingAddress: billingAddress || { ...shippingAddress, sameAsShipping: true },
    payment: {
      method: paymentMethod
    },
    prescriptions: prescriptions?.map(p => p._id) || [],
    customerNotes,
    status: 'pending'
  });

  // Clear user's cart
  await Cart.findOneAndUpdate(
    { user: req.user.id },
    { $set: { items: [] } }
  );

  // Send order confirmation email
  try {
    await sendEmail({
      email: req.user.email,
      subject: 'Order Confirmation - MedCare',
      template: 'orderConfirmation',
      data: {
        customerName: req.user.firstName,
        orderNumber: order.orderNumber,
        total: order.pricing.total,
        items: order.items,
        trackingUrl: `${process.env.FRONTEND_URL}/orders/${order._id}`
      }
    });
  } catch (error) {
    logger.error('Failed to send order confirmation email:', error);
  }

  res.status(201).json({
    success: true,
    order
  });
});

// @desc    Get user orders
// @route   GET /api/v1/orders
// @access  Private
export const getUserOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find({ customer: req.user.id })
    .populate('items.product', 'name images')
    .populate('prescriptions')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: orders.length,
    orders
  });
});

// @desc    Get single order
// @route   GET /api/v1/orders/:id
// @access  Private
export const getOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('customer', 'firstName lastName email phone')
    .populate('items.product', 'name images manufacturer')
    .populate('prescriptions')
    .populate('statusHistory.updatedBy', 'firstName lastName');

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Check if user owns this order or is admin/pharmacist
  if (order.customer._id.toString() !== req.user.id && 
      !['admin', 'pharmacist'].includes(req.user.role)) {
    return next(new AppError('Not authorized to access this order', 403));
  }

  res.status(200).json({
    success: true,
    order
  });
});

// @desc    Update order status (Admin/Pharmacist only)
// @route   PATCH /api/v1/orders/:id/status
// @access  Private/Admin/Pharmacist
export const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status, note, trackingNumber, estimatedDelivery } = req.body;

  const order = await Order.findById(req.params.id)
    .populate('customer', 'firstName lastName email');

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  const oldStatus = order.status;
  order.status = status;

  // Add to status history
  order.statusHistory.push({
    status,
    note,
    updatedBy: req.user.id,
    timestamp: new Date()
  });

  // Update shipping info if provided
  if (trackingNumber) {
    order.shipping.trackingNumber = trackingNumber;
  }
  if (estimatedDelivery) {
    order.shipping.estimatedDelivery = new Date(estimatedDelivery);
  }

  // Handle status-specific logic
  switch (status) {
    case 'confirmed':
      // Deduct from actual stock and clear reserved stock
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock.quantity -= item.quantity;
          product.stock.reserved = Math.max(0, product.stock.reserved - item.quantity);
          await product.save();
        }
      }
      break;

    case 'cancelled':
      // Release reserved stock
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock.reserved = Math.max(0, product.stock.reserved - item.quantity);
          await product.save();
        }
      }
      break;

    case 'delivered':
      order.shipping.actualDelivery = new Date();
      break;
  }

  await order.save();

  // Send status update email
  try {
    await sendEmail({
      email: order.customer.email,
      subject: `Order ${status.replace('_', ' ').toUpperCase()} - MedCare`,
      template: 'orderStatusUpdate',
      data: {
        customerName: order.customer.firstName,
        orderNumber: order.orderNumber,
        status: status.replace('_', ' '),
        note,
        trackingNumber: order.shipping.trackingNumber,
        trackingUrl: order.shipping.trackingNumber ? 
          `${process.env.FRONTEND_URL}/track/${order.shipping.trackingNumber}` : null
      }
    });
  } catch (error) {
    logger.error('Failed to send status update email:', error);
  }

  res.status(200).json({
    success: true,
    order
  });
});

// @desc    Cancel order
// @route   PATCH /api/v1/orders/:id/cancel
// @access  Private
export const cancelOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Check if user owns this order
  if (order.customer.toString() !== req.user.id) {
    return next(new AppError('Not authorized to cancel this order', 403));
  }

  // Check if order can be cancelled
  const cancellableStatuses = ['pending', 'confirmed', 'prescription_verification'];
  if (!cancellableStatuses.includes(order.status)) {
    return next(new AppError('Order cannot be cancelled at this stage', 400));
  }

  // Release reserved stock
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product) {
      product.stock.reserved = Math.max(0, product.stock.reserved - item.quantity);
      await product.save();
    }
  }

  order.status = 'cancelled';
  order.statusHistory.push({
    status: 'cancelled',
    note: req.body.reason || 'Cancelled by customer',
    updatedBy: req.user.id,
    timestamp: new Date()
  });

  await order.save();

  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully',
    order
  });
});

// @desc    Track order
// @route   GET /api/v1/orders/track/:trackingNumber
// @access  Public
export const trackOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findOne({ 
    'shipping.trackingNumber': req.params.trackingNumber 
  })
    .populate('items.product', 'name images')
    .select('orderNumber status statusHistory shipping pricing createdAt');

  if (!order) {
    return next(new AppError('Order not found with this tracking number', 404));
  }

  res.status(200).json({
    success: true,
    order
  });
});

// @desc    Get all orders (Admin only)
// @route   GET /api/v1/orders/admin/all
// @access  Private/Admin
export const getAllOrders = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.paymentStatus) {
    filter['payment.status'] = req.query.paymentStatus;
  }

  const orders = await Order.find(filter)
    .populate('customer', 'firstName lastName email phone')
    .populate('items.product', 'name images')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Order.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      limit,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    },
    orders
  });
});