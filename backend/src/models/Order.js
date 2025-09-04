import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  name: {
    type: String,
    required: [true, 'Product name is required']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  prescriptionRequired: {
    type: Boolean,
    default: false
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: [true, 'Order number is required'],
    unique: true,
    trim: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer is required']
  },
  items: [orderItemSchema],
  pricing: {
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal cannot be negative']
    },
    tax: {
      type: Number,
      required: [true, 'Tax is required'],
      min: [0, 'Tax cannot be negative']
    },
    shipping: {
      type: Number,
      required: [true, 'Shipping cost is required'],
      min: [0, 'Shipping cost cannot be negative']
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative']
    },
    total: {
      type: Number,
      required: [true, 'Total is required'],
      min: [0, 'Total cannot be negative']
    }
  },
  shippingAddress: {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required'],
      trim: true
    },
    country: {
      type: String,
      default: 'United States',
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    }
  },
  billingAddress: {
    firstName: String,
    lastName: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String,
    sameAsShipping: {
      type: Boolean,
      default: true
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['card', 'paypal', 'bank_transfer', 'cash_on_delivery'],
      required: [true, 'Payment method is required']
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending'
    },
    transactionId: String,
    stripePaymentIntentId: String,
    paidAt: Date,
    refundedAt: Date,
    refundAmount: Number,
    refundReason: String
  },
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'prescription_verification',
      'preparing',
      'ready_for_pickup',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'returned',
      'refunded'
    ],
    default: 'pending'
  },
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  shipping: {
    method: {
      type: String,
      enum: ['standard', 'express', 'overnight', 'pickup'],
      default: 'standard'
    },
    carrier: String,
    trackingNumber: String,
    estimatedDelivery: Date,
    actualDelivery: Date,
    deliveryInstructions: String
  },
  prescriptions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  }],
  pharmacistNotes: {
    type: String,
    trim: true
  },
  customerNotes: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  isGift: {
    type: Boolean,
    default: false
  },
  giftMessage: String,
  couponCode: String,
  loyaltyPointsUsed: {
    type: Number,
    default: 0,
    min: [0, 'Loyalty points used cannot be negative']
  },
  estimatedPreparationTime: {
    type: Number, // in minutes
    default: 30
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full customer name
orderSchema.virtual('customerName').get(function() {
  return `${this.shippingAddress.firstName} ${this.shippingAddress.lastName}`;
});

// Virtual for order age
orderSchema.virtual('orderAge').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)); // days
});

// Indexes
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'shipping.trackingNumber': 1 });

// Pre-save middleware
orderSchema.pre('save', function(next) {
  // Generate order number if not provided
  if (!this.orderNumber) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.orderNumber = `ORD${timestamp.slice(-6)}${random}`;
  }
  
  // Add status to history if status changed
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });
  }
  
  next();
});

export default mongoose.model('Order', orderSchema);