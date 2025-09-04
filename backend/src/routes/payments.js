import express from 'express';
import Stripe from 'stripe';
import Order from '../models/Order.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';
import { protect } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Create payment intent
// @route   POST /api/v1/payments/create-intent
// @access  Private
const createPaymentIntent = asyncHandler(async (req, res, next) => {
  const { orderId, amount, currency = 'usd' } = req.body;

  if (!orderId || !amount) {
    return next(new AppError('Order ID and amount are required', 400));
  }

  // Verify order belongs to user
  const order = await Order.findById(orderId);
  if (!order || order.customer.toString() !== req.user.id) {
    return next(new AppError('Order not found', 404));
  }

  // Verify amount matches order total
  if (Math.round(amount * 100) !== Math.round(order.pricing.total * 100)) {
    return next(new AppError('Amount mismatch', 400));
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        orderId: orderId,
        userId: req.user.id,
        userEmail: req.user.email
      },
      automatic_payment_methods: {
        enabled: true
      }
    });

    // Update order with payment intent ID
    order.payment.stripePaymentIntentId = paymentIntent.id;
    order.payment.status = 'processing';
    await order.save();

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    logger.error('Stripe payment intent creation failed:', error);
    return next(new AppError('Payment processing failed', 500));
  }
});

// @desc    Confirm payment
// @route   POST /api/v1/payments/confirm
// @access  Private
const confirmPayment = asyncHandler(async (req, res, next) => {
  const { paymentIntentId } = req.body;

  if (!paymentIntentId) {
    return next(new AppError('Payment intent ID is required', 400));
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // Update order payment status
      const order = await Order.findOne({ 
        'payment.stripePaymentIntentId': paymentIntentId 
      });

      if (order) {
        order.payment.status = 'completed';
        order.payment.paidAt = new Date();
        order.payment.transactionId = paymentIntent.id;
        order.status = 'confirmed';
        
        // Add to status history
        order.statusHistory.push({
          status: 'confirmed',
          note: 'Payment confirmed',
          timestamp: new Date()
        });

        await order.save();

        res.status(200).json({
          success: true,
          message: 'Payment confirmed successfully',
          order
        });
      } else {
        return next(new AppError('Order not found', 404));
      }
    } else {
      return next(new AppError('Payment not completed', 400));
    }
  } catch (error) {
    logger.error('Payment confirmation failed:', error);
    return next(new AppError('Payment confirmation failed', 500));
  }
});

// @desc    Handle Stripe webhooks
// @route   POST /api/v1/payments/webhook
// @access  Public (Stripe)
const handleWebhook = asyncHandler(async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    logger.error('Webhook signature verification failed:', error);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      logger.info(`Payment succeeded: ${paymentIntent.id}`);
      
      // Update order status
      const order = await Order.findOne({ 
        'payment.stripePaymentIntentId': paymentIntent.id 
      });

      if (order) {
        order.payment.status = 'completed';
        order.payment.paidAt = new Date();
        order.status = 'confirmed';
        await order.save();
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      logger.error(`Payment failed: ${failedPayment.id}`);
      
      // Update order status
      const failedOrder = await Order.findOne({ 
        'payment.stripePaymentIntentId': failedPayment.id 
      });

      if (failedOrder) {
        failedOrder.payment.status = 'failed';
        await failedOrder.save();
      }
      break;

    default:
      logger.info(`Unhandled event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
});

// @desc    Process refund
// @route   POST /api/v1/payments/refund
// @access  Private/Admin
const processRefund = asyncHandler(async (req, res, next) => {
  const { orderId, amount, reason } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  if (order.payment.status !== 'completed') {
    return next(new AppError('Cannot refund unpaid order', 400));
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: order.payment.stripePaymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Partial or full refund
      reason: 'requested_by_customer',
      metadata: {
        orderId: orderId,
        reason: reason
      }
    });

    // Update order
    order.payment.status = 'refunded';
    order.payment.refundedAt = new Date();
    order.payment.refundAmount = refund.amount / 100;
    order.payment.refundReason = reason;
    order.status = 'refunded';

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      refund
    });
  } catch (error) {
    logger.error('Refund processing failed:', error);
    return next(new AppError('Refund processing failed', 500));
  }
});

// Routes
router.post('/create-intent', createPaymentIntent);
router.post('/confirm', confirmPayment);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);
router.post('/refund', authorize('admin', 'pharmacist'), processRefund);

export default router;