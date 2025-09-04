import express from 'express';
import {
  uploadPrescription,
  getUserPrescriptions,
  getPrescription,
  updatePrescription,
  deletePrescription,
  verifyPrescription,
  getPendingPrescriptions,
  reprocessPrescription
} from '../controllers/prescriptionController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validatePrescription, validateObjectId } from '../middleware/validation.js';
import { uploadPrescriptionImages } from '../middleware/upload.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// User routes
router.post('/', uploadPrescriptionImages, validatePrescription, uploadPrescription);
router.get('/', getUserPrescriptions);
router.get('/:id', validateObjectId(), getPrescription);
router.put('/:id', validateObjectId(), updatePrescription);
router.delete('/:id', validateObjectId(), deletePrescription);

// Pharmacist routes
router.get('/admin/pending', authorize('pharmacist', 'admin'), getPendingPrescriptions);
router.patch('/:id/verify', validateObjectId(), authorize('pharmacist', 'admin'), verifyPrescription);
router.post('/:id/reprocess', validateObjectId(), authorize('pharmacist', 'admin'), reprocessPrescription);

export default router;