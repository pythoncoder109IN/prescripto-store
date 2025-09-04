import express from 'express';
import {
  getProducts,
  getProduct,
  getFeaturedProducts,
  searchProducts,
  getProductsByCategory,
  getProductRecommendations,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock
} from '../controllers/productController.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import { 
  validateProduct, 
  validateObjectId, 
  validatePagination, 
  validateSearch 
} from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.get('/', validatePagination, getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/search', validateSearch, searchProducts);
router.get('/category/:slug', validatePagination, getProductsByCategory);
router.get('/:id', validateObjectId(), optionalAuth, getProduct);
router.get('/:id/recommendations', validateObjectId(), getProductRecommendations);

// Protected routes (Admin only)
router.use(protect);
router.use(authorize('admin', 'pharmacist'));

router.post('/', validateProduct, createProduct);
router.put('/:id', validateObjectId(), validateProduct, updateProduct);
router.delete('/:id', validateObjectId(), deleteProduct);
router.patch('/:id/stock', validateObjectId(), updateProductStock);

export default router;