import Joi from 'joi';

// User validation schemas
export const userSchemas = {
  register: Joi.object({
    firstName: Joi.string().trim().min(2).max(50).required(),
    lastName: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().email().lowercase().required(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).required(),
    password: Joi.string().min(6).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      })
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().trim().min(2).max(50),
    lastName: Joi.string().trim().min(2).max(50),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/),
    dateOfBirth: Joi.date().max('now'),
    gender: Joi.string().valid('male', 'female', 'other', 'prefer-not-to-say'),
    emergencyContact: Joi.object({
      name: Joi.string().trim().max(100),
      phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/),
      relationship: Joi.string().trim().max(50)
    }),
    medicalInfo: Joi.object({
      allergies: Joi.array().items(Joi.string().trim().max(100)),
      chronicConditions: Joi.array().items(Joi.string().trim().max(100)),
      currentMedications: Joi.array().items(Joi.string().trim().max(100)),
      bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
    }),
    preferences: Joi.object({
      emailNotifications: Joi.boolean(),
      smsNotifications: Joi.boolean(),
      orderUpdates: Joi.boolean(),
      promotions: Joi.boolean()
    })
  })
};

// Product validation schemas
export const productSchemas = {
  create: Joi.object({
    name: Joi.string().trim().min(2).max(200).required(),
    description: Joi.string().trim().min(10).max(2000).required(),
    shortDescription: Joi.string().trim().max(500),
    sku: Joi.string().trim().min(3).max(50).required(),
    category: Joi.string().hex().length(24).required(),
    manufacturer: Joi.string().trim().min(2).max(100).required(),
    brand: Joi.string().trim().max(100),
    activeIngredient: Joi.string().trim().min(2).max(200).required(),
    strength: Joi.string().trim().required(),
    dosageForm: Joi.string().valid('tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'patch').required(),
    packSize: Joi.string().trim().required(),
    price: Joi.number().min(0).required(),
    originalPrice: Joi.number().min(0),
    costPrice: Joi.number().min(0).required(),
    prescriptionRequired: Joi.boolean(),
    scheduleType: Joi.string().valid('non-controlled', 'schedule-ii', 'schedule-iii', 'schedule-iv', 'schedule-v'),
    stock: Joi.object({
      quantity: Joi.number().integer().min(0).required(),
      lowStockThreshold: Joi.number().integer().min(0)
    }),
    tags: Joi.array().items(Joi.string().trim().max(50)),
    usage: Joi.object({
      indications: Joi.array().items(Joi.string().trim().max(200)),
      dosageInstructions: Joi.string().trim().max(1000),
      contraindications: Joi.array().items(Joi.string().trim().max(200)),
      sideEffects: Joi.array().items(Joi.string().trim().max(200)),
      interactions: Joi.array().items(Joi.string().trim().max(200)),
      warnings: Joi.array().items(Joi.string().trim().max(200)),
      storage: Joi.string().trim().max(200)
    })
  })
};

// Prescription validation schemas
export const prescriptionSchemas = {
  upload: Joi.object({
    doctorName: Joi.string().trim().min(2).max(100).required(),
    doctorLicenseNumber: Joi.string().trim().min(5).max(50).required(),
    doctorPhone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/),
    doctorEmail: Joi.string().email().lowercase(),
    doctorClinic: Joi.object({
      name: Joi.string().trim().max(200),
      address: Joi.string().trim().max(500),
      phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/)
    }),
    medications: Joi.array().min(1).items(
      Joi.object({
        name: Joi.string().trim().min(2).max(200).required(),
        dosage: Joi.string().trim().required(),
        frequency: Joi.string().trim().required(),
        duration: Joi.string().trim().required(),
        instructions: Joi.string().trim().max(500),
        quantity: Joi.number().integer().min(1).required(),
        refills: Joi.number().integer().min(0).max(12)
      })
    ).required(),
    diagnosis: Joi.string().trim().max(500),
    symptoms: Joi.array().items(Joi.string().trim().max(100)),
    allergies: Joi.array().items(Joi.string().trim().max(100)),
    instructions: Joi.string().trim().max(1000),
    prescriptionDate: Joi.date().max('now').required()
  })
};

// Order validation schemas
export const orderSchemas = {
  create: Joi.object({
    items: Joi.array().min(1).items(
      Joi.object({
        product: Joi.string().hex().length(24).required(),
        quantity: Joi.number().integer().min(1).max(100).required(),
        prescription: Joi.string().hex().length(24)
      })
    ).required(),
    shippingAddress: Joi.object({
      firstName: Joi.string().trim().min(2).max(50).required(),
      lastName: Joi.string().trim().min(2).max(50).required(),
      street: Joi.string().trim().min(5).max(200).required(),
      city: Joi.string().trim().min(2).max(100).required(),
      state: Joi.string().trim().min(2).max(50).required(),
      zipCode: Joi.string().pattern(/^\d{5}(-\d{4})?$/).required(),
      country: Joi.string().trim().max(100),
      phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).required()
    }).required(),
    billingAddress: Joi.object({
      firstName: Joi.string().trim().min(2).max(50),
      lastName: Joi.string().trim().min(2).max(50),
      street: Joi.string().trim().min(5).max(200),
      city: Joi.string().trim().min(2).max(100),
      state: Joi.string().trim().min(2).max(50),
      zipCode: Joi.string().pattern(/^\d{5}(-\d{4})?$/),
      country: Joi.string().trim().max(100),
      phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/),
      sameAsShipping: Joi.boolean()
    }),
    paymentMethod: Joi.string().valid('card', 'paypal', 'bank_transfer', 'cash_on_delivery').required(),
    couponCode: Joi.string().trim().max(50),
    customerNotes: Joi.string().trim().max(500),
    prescriptions: Joi.array().items(Joi.string().hex().length(24))
  })
};

// Cart validation schemas
export const cartSchemas = {
  addItem: Joi.object({
    productId: Joi.string().hex().length(24).required(),
    quantity: Joi.number().integer().min(1).max(100),
    prescriptionId: Joi.string().hex().length(24)
  }),

  updateItem: Joi.object({
    quantity: Joi.number().integer().min(1).max(100).required()
  }),

  applyCoupon: Joi.object({
    couponCode: Joi.string().trim().min(3).max(50).required()
  })
};

// Validation middleware factory
export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));

      return next(new AppError('Validation failed', 400, errorMessages));
    }

    next();
  };
};