import Prescription from '../models/Prescription.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';
import { processOCR } from '../utils/ocrProcessor.js';
import { sendEmail } from '../utils/email.js';
import { logger } from '../utils/logger.js';

// @desc    Upload prescription
// @route   POST /api/v1/prescriptions
// @access  Private
export const uploadPrescription = asyncHandler(async (req, res, next) => {
  const {
    doctorName,
    doctorLicenseNumber,
    doctorPhone,
    doctorEmail,
    doctorClinic,
    medications,
    diagnosis,
    symptoms,
    allergies,
    instructions,
    prescriptionDate
  } = req.body;

  // Validate required fields
  if (!doctorName || !doctorLicenseNumber || !medications || !prescriptionDate) {
    return next(new AppError('Missing required prescription information', 400));
  }

  // Process uploaded images
  const images = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      images.push({
        url: file.path, // Cloudinary URL
        publicId: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype
      });
    }
  }

  // Create prescription
  const prescription = await Prescription.create({
    patient: req.user.id,
    doctor: {
      name: doctorName,
      licenseNumber: doctorLicenseNumber,
      phone: doctorPhone,
      email: doctorEmail,
      clinic: doctorClinic
    },
    medications: medications.map(med => ({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      duration: med.duration,
      instructions: med.instructions,
      quantity: med.quantity,
      refills: med.refills || 0
    })),
    diagnosis,
    symptoms: symptoms || [],
    allergies: allergies || [],
    instructions,
    images,
    prescriptionDate: new Date(prescriptionDate),
    expiryDate: new Date(new Date(prescriptionDate).setFullYear(new Date(prescriptionDate).getFullYear() + 1)),
    status: 'uploaded'
  });

  // Process OCR if images are provided
  if (images.length > 0) {
    try {
      prescription.status = 'processing';
      await prescription.save();

      const ocrResult = await processOCR(images[0].url);
      prescription.extractedText = ocrResult.text;
      prescription.ocrConfidence = ocrResult.confidence;
      prescription.status = 'pending_verification';
      
      await prescription.save();
    } catch (error) {
      logger.error('OCR processing failed:', error);
      prescription.status = 'pending_verification';
      await prescription.save();
    }
  } else {
    prescription.status = 'pending_verification';
    await prescription.save();
  }

  // Notify pharmacists
  try {
    const pharmacists = await User.find({ role: 'pharmacist', isActive: true });
    
    for (const pharmacist of pharmacists) {
      await sendEmail({
        email: pharmacist.email,
        subject: 'New Prescription for Verification - MedCare',
        template: 'newPrescription',
        data: {
          pharmacistName: pharmacist.firstName,
          patientName: `${req.user.firstName} ${req.user.lastName}`,
          prescriptionId: prescription._id,
          verificationUrl: `${process.env.ADMIN_URL}/prescriptions/${prescription._id}`
        }
      });
    }
  } catch (error) {
    logger.error('Failed to notify pharmacists:', error);
  }

  res.status(201).json({
    success: true,
    prescription
  });
});

// @desc    Get user prescriptions
// @route   GET /api/v1/prescriptions
// @access  Private
export const getUserPrescriptions = asyncHandler(async (req, res, next) => {
  const prescriptions = await Prescription.find({ patient: req.user.id })
    .populate('patient', 'firstName lastName email phone')
    .populate('verificationStatus.verifiedBy', 'firstName lastName')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: prescriptions.length,
    prescriptions
  });
});

// @desc    Get single prescription
// @route   GET /api/v1/prescriptions/:id
// @access  Private
export const getPrescription = asyncHandler(async (req, res, next) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate('patient', 'firstName lastName email phone')
    .populate('verificationStatus.verifiedBy', 'firstName lastName')
    .populate('orders');

  if (!prescription) {
    return next(new AppError('Prescription not found', 404));
  }

  // Check if user owns this prescription or is admin/pharmacist
  if (prescription.patient._id.toString() !== req.user.id && 
      !['admin', 'pharmacist'].includes(req.user.role)) {
    return next(new AppError('Not authorized to access this prescription', 403));
  }

  res.status(200).json({
    success: true,
    prescription
  });
});

// @desc    Update prescription
// @route   PUT /api/v1/prescriptions/:id
// @access  Private
export const updatePrescription = asyncHandler(async (req, res, next) => {
  let prescription = await Prescription.findById(req.params.id);

  if (!prescription) {
    return next(new AppError('Prescription not found', 404));
  }

  // Check if user owns this prescription
  if (prescription.patient.toString() !== req.user.id) {
    return next(new AppError('Not authorized to update this prescription', 403));
  }

  // Only allow updates if prescription is not verified
  if (prescription.status === 'verified') {
    return next(new AppError('Cannot update verified prescription', 400));
  }

  prescription = await Prescription.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    prescription
  });
});

// @desc    Delete prescription
// @route   DELETE /api/v1/prescriptions/:id
// @access  Private
export const deletePrescription = asyncHandler(async (req, res, next) => {
  const prescription = await Prescription.findById(req.params.id);

  if (!prescription) {
    return next(new AppError('Prescription not found', 404));
  }

  // Check if user owns this prescription
  if (prescription.patient.toString() !== req.user.id) {
    return next(new AppError('Not authorized to delete this prescription', 403));
  }

  // Don't allow deletion if prescription has associated orders
  if (prescription.orders && prescription.orders.length > 0) {
    return next(new AppError('Cannot delete prescription with associated orders', 400));
  }

  await prescription.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Prescription deleted successfully'
  });
});

// @desc    Verify prescription (Pharmacist only)
// @route   PATCH /api/v1/prescriptions/:id/verify
// @access  Private/Pharmacist
export const verifyPrescription = asyncHandler(async (req, res, next) => {
  const { isApproved, notes, rejectionReason } = req.body;

  const prescription = await Prescription.findById(req.params.id)
    .populate('patient', 'firstName lastName email');

  if (!prescription) {
    return next(new AppError('Prescription not found', 404));
  }

  if (prescription.status === 'verified') {
    return next(new AppError('Prescription is already verified', 400));
  }

  // Update verification status
  prescription.verificationStatus = {
    isVerified: isApproved,
    verifiedBy: req.user.id,
    verifiedAt: new Date(),
    verificationNotes: notes,
    rejectionReason: isApproved ? undefined : rejectionReason
  };

  prescription.status = isApproved ? 'verified' : 'rejected';
  await prescription.save();

  // Send notification email to patient
  try {
    const emailTemplate = isApproved ? 'prescriptionApproved' : 'prescriptionRejected';
    const subject = isApproved ? 
      'Prescription Approved - MedCare' : 
      'Prescription Requires Attention - MedCare';

    await sendEmail({
      email: prescription.patient.email,
      subject,
      template: emailTemplate,
      data: {
        patientName: prescription.patient.firstName,
        prescriptionId: prescription._id,
        pharmacistNotes: notes,
        rejectionReason
      }
    });
  } catch (error) {
    logger.error('Failed to send verification email:', error);
  }

  res.status(200).json({
    success: true,
    prescription
  });
});

// @desc    Get prescriptions for verification (Pharmacist only)
// @route   GET /api/v1/prescriptions/pending-verification
// @access  Private/Pharmacist
export const getPendingPrescriptions = asyncHandler(async (req, res, next) => {
  const prescriptions = await Prescription.find({ 
    status: 'pending_verification' 
  })
    .populate('patient', 'firstName lastName email phone')
    .sort({ priority: -1, createdAt: 1 });

  res.status(200).json({
    success: true,
    count: prescriptions.length,
    prescriptions
  });
});

// @desc    Reprocess prescription OCR
// @route   POST /api/v1/prescriptions/:id/reprocess
// @access  Private/Pharmacist
export const reprocessPrescription = asyncHandler(async (req, res, next) => {
  const prescription = await Prescription.findById(req.params.id);

  if (!prescription) {
    return next(new AppError('Prescription not found', 404));
  }

  if (!prescription.images || prescription.images.length === 0) {
    return next(new AppError('No images available for processing', 400));
  }

  try {
    prescription.status = 'processing';
    await prescription.save();

    const ocrResult = await processOCR(prescription.images[0].url);
    prescription.extractedText = ocrResult.text;
    prescription.ocrConfidence = ocrResult.confidence;
    prescription.status = 'pending_verification';
    
    await prescription.save();

    res.status(200).json({
      success: true,
      prescription
    });
  } catch (error) {
    logger.error('OCR reprocessing failed:', error);
    prescription.status = 'pending_verification';
    await prescription.save();
    
    return next(new AppError('Failed to reprocess prescription', 500));
  }
});