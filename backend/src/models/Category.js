import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: [true, 'Category slug is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    url: String,
    publicId: String,
    alt: String
  },
  icon: {
    type: String,
    trim: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 0,
    min: [0, 'Level cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  seoTitle: String,
  seoDescription: String,
  seoKeywords: [String],
  prescriptionRequired: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Virtual for products count
categorySchema.virtual('productsCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  count: true
});

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ isActive: 1, sortOrder: 1 });
categorySchema.index({ isFeatured: -1 });

// Pre-save middleware to generate slug
categorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

export default mongoose.model('Category', categorySchema);