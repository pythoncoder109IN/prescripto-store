import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  barcode: {
    type: String,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  subcategory: {
    type: String,
    trim: true
  },
  manufacturer: {
    type: String,
    required: [true, 'Manufacturer is required'],
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  activeIngredient: {
    type: String,
    required: [true, 'Active ingredient is required'],
    trim: true
  },
  strength: {
    type: String,
    required: [true, 'Strength/dosage is required'],
    trim: true
  },
  dosageForm: {
    type: String,
    required: [true, 'Dosage form is required'],
    enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'patch'],
    lowercase: true
  },
  packSize: {
    type: String,
    required: [true, 'Pack size is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  costPrice: {
    type: Number,
    required: [true, 'Cost price is required'],
    min: [0, 'Cost price cannot be negative']
  },
  discount: {
    type: Number,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%'],
    default: 0
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  stock: {
    quantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 10
    },
    reserved: {
      type: Number,
      default: 0,
      min: [0, 'Reserved stock cannot be negative']
    }
  },
  prescriptionRequired: {
    type: Boolean,
    default: false
  },
  scheduleType: {
    type: String,
    enum: ['non-controlled', 'schedule-ii', 'schedule-iii', 'schedule-iv', 'schedule-v'],
    default: 'non-controlled'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  tags: [String],
  seoTitle: String,
  seoDescription: String,
  seoKeywords: [String],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5']
    },
    count: {
      type: Number,
      default: 0,
      min: [0, 'Rating count cannot be negative']
    }
  },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  usage: {
    indications: [String],
    dosageInstructions: String,
    contraindications: [String],
    sideEffects: [String],
    interactions: [String],
    warnings: [String],
    storage: String
  },
  regulatory: {
    fdaApproved: {
      type: Boolean,
      default: false
    },
    approvalNumber: String,
    expiryDate: Date,
    batchNumber: String,
    manufacturingDate: Date
  },
  shipping: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    requiresSpecialHandling: {
      type: Boolean,
      default: false
    },
    temperatureControlled: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for available stock
userSchema.virtual('availableStock').get(function() {
  return this.stock.quantity - this.stock.reserved;
});

// Virtual for discount price
productSchema.virtual('discountPrice').get(function() {
  if (this.discount > 0) {
    return this.price * (1 - this.discount / 100);
  }
  return this.price;
});

// Virtual for in stock status
productSchema.virtual('inStock').get(function() {
  return this.stock.quantity > 0;
});

// Virtual for low stock status
productSchema.virtual('isLowStock').get(function() {
  return this.stock.quantity <= this.stock.lowStockThreshold;
});

// Indexes for better query performance
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ manufacturer: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'rating.average': -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ isActive: 1, isFeatured: -1 });
productSchema.index({ prescriptionRequired: 1 });
productSchema.index({ sku: 1 });

// Pre-save middleware
productSchema.pre('save', function(next) {
  // Calculate discount if originalPrice is set
  if (this.originalPrice && this.originalPrice > this.price) {
    this.discount = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  
  // Ensure only one primary image
  if (this.images && this.images.length > 0) {
    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length === 0) {
      this.images[0].isPrimary = true;
    } else if (primaryImages.length > 1) {
      this.images.forEach((img, index) => {
        img.isPrimary = index === 0;
      });
    }
  }
  
  next();
});

export default mongoose.model('Product', productSchema);