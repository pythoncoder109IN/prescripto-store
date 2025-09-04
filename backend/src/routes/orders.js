import express from 'express';
import {
  createOrder,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  trackOrder,
  getAllOrders
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateOrder, validateObjectId, validatePagination } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.get('/track/:trackingNumber', trackOrder);

// Protected routes
router.use(protect);

// User routes
router.post('/', validateOrder, createOrder);
router.get('/', getUserOrders);
router.get('/:id', validateObjectId(), getOrder);
router.patch('/:id/cancel', validateObjectId(), cancelOrder);

// Admin/Pharmacist routes
router.get('/admin/all', authorize('admin', 'pharmacist'), validatePagination, getAllOrders);
router.patch('/:id/status', validateObjectId(), authorize('admin', 'pharmacist'), updateOrderStatus);

export default router;