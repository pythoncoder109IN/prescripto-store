import mongoose from 'mongoose';

const medicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Medication name is required'],
    trim: true
  },
  dosage: {
    type: String,
    required: [true, 'Dosage is required'],
    trim: true
  },
  frequency: {
    type: String,
    required: [true, 'Frequency is required'],
    trim: true
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    trim: true
  },
  instructions: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  refills: {
    type: Number,
    default: 0,
    min: [0, 'Refills cannot be negative']
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }
});

const prescriptionSchema = new mongoose.Schema({
  prescriptionNumber: {
    type: String,
    required: [true, 'Prescription number is required'],
    unique: true,
    trim: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient is required']
  },
  doctor: {
    name: {
      type: String,
      required: [true, 'Doctor name is required'],
      trim: true
    },
    licenseNumber: {
      type: String,
      required: [true, 'Doctor license number is required'],
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    clinic: {
      name: String,
      address: String,
      phone: String
    }
  },
  medications: [medicationSchema],
  diagnosis: {
    type: String,
    trim: true
  },
  symptoms: [String],
  allergies: [String],
  instructions: {
    type: String,
    trim: true
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: String,
    originalName: String,
    size: Number,
    mimeType: String
  }],
  extractedText: {
    type: String,
    trim: true
  },
  ocrConfidence: {
    type: Number,
    min: [0, 'OCR confidence cannot be negative'],
    max: [100, 'OCR confidence cannot exceed 100']
  },
  status: {
    type: String,
    enum: [
      'pending_upload',
      'uploaded',
      'processing',
      'pending_verification',
      'verified',
      'rejected',
      'expired',
      'fulfilled'
    ],
    default: 'pending_upload'
  },
  verificationStatus: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    verificationNotes: String,
    rejectionReason: String
  },
  prescriptionDate: {
    type: Date,
    required: [true, 'Prescription date is required']
  },
  expiryDate: {
    type: Date,
    required: [true, 'Prescription expiry date is required']
  },
  isValid: {
    type: Boolean,
    default: true
  },
  refillsUsed: {
    type: Number,
    default: 0,
    min: [0, 'Refills used cannot be negative']
  },
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  notes: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for prescription validity
prescriptionSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiryDate;
});

// Virtual for remaining refills
prescriptionSchema.virtual('remainingRefills').get(function() {
  return Math.max(0, this.medications.reduce((total, med) => total + med.refills, 0) - this.refillsUsed);
});

// Indexes
prescriptionSchema.index({ patient: 1, createdAt: -1 });
prescriptionSchema.index({ prescriptionNumber: 1 });
prescriptionSchema.index({ status: 1 });
prescriptionSchema.index({ 'doctor.licenseNumber': 1 });
prescriptionSchema.index({ prescriptionDate: -1 });
prescriptionSchema.index({ expiryDate: 1 });

// Pre-save middleware
prescriptionSchema.pre('save', function(next) {
  // Generate prescription number if not provided
  if (!this.prescriptionNumber) {
    this.prescriptionNumber = `RX${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }
  
  // Set expiry date if not provided (default 1 year from prescription date)
  if (!this.expiryDate && this.prescriptionDate) {
    this.expiryDate = new Date(this.prescriptionDate);
    this.expiryDate.setFullYear(this.expiryDate.getFullYear() + 1);
  }
  
  next();
});

export default mongoose.model('Prescription', prescriptionSchema);