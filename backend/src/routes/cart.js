import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon
} from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';
import { validateAddToCart, validateObjectId } from '../middleware/validation.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/', getCart);
router.post('/items', validateAddToCart, addToCart);
router.put('/items/:itemId', validateObjectId('itemId'), updateCartItem);
router.delete('/items/:itemId', validateObjectId('itemId'), removeFromCart);
router.delete('/', clearCart);
router.post('/coupon', applyCoupon);
router.delete('/coupon', removeCoupon);

export default router;