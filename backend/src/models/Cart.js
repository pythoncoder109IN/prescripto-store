import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    max: [100, 'Quantity cannot exceed 100']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    unique: true
  },
  items: [cartItemSchema],
  couponCode: {
    type: String,
    trim: true
  },
  couponDiscount: {
    type: Number,
    default: 0,
    min: [0, 'Coupon discount cannot be negative']
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for subtotal
cartSchema.virtual('subtotal').get(function() {
  return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
});

// Virtual for total items count
cartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for total after discount
cartSchema.virtual('total').get(function() {
  return Math.max(0, this.subtotal - this.couponDiscount);
});

// Indexes
cartSchema.index({ user: 1 });
cartSchema.index({ lastModified: -1 });

// Pre-save middleware
cartSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

// Remove expired cart items (older than 30 days)
cartSchema.methods.removeExpiredItems = function() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  this.items = this.items.filter(item => item.addedAt > thirtyDaysAgo);
  return this.save();
};

export default mongoose.model('Cart', cartSchema);