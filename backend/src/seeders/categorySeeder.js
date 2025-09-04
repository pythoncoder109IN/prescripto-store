import mongoose from 'mongoose';
import Category from '../models/Category.js';
import { logger } from '../utils/logger.js';

const categories = [
  {
    name: 'Pain Relief',
    slug: 'pain-relief',
    description: 'Medications for pain management and relief',
    icon: 'pill',
    isActive: true,
    isFeatured: true,
    sortOrder: 1
  },
  {
    name: 'Vitamins & Supplements',
    slug: 'vitamins-supplements',
    description: 'Essential vitamins and dietary supplements',
    icon: 'vitamin',
    isActive: true,
    isFeatured: true,
    sortOrder: 2
  },
  {
    name: 'Antibiotics',
    slug: 'antibiotics',
    description: 'Prescription antibiotics for bacterial infections',
    icon: 'shield',
    isActive: true,
    isFeatured: true,
    sortOrder: 3,
    prescriptionRequired: true
  },
  {
    name: 'Allergy & Sinus',
    slug: 'allergy-sinus',
    description: 'Allergy relief and sinus medications',
    icon: 'wind',
    isActive: true,
    isFeatured: true,
    sortOrder: 4
  },
  {
    name: 'Diabetes Care',
    slug: 'diabetes-care',
    description: 'Diabetes management medications and supplies',
    icon: 'heart',
    isActive: true,
    isFeatured: true,
    sortOrder: 5,
    prescriptionRequired: true
  },
  {
    name: 'Heart & Blood Pressure',
    slug: 'heart-blood-pressure',
    description: 'Cardiovascular health medications',
    icon: 'heart-pulse',
    isActive: true,
    isFeatured: true,
    sortOrder: 6,
    prescriptionRequired: true
  },
  {
    name: 'Digestive Health',
    slug: 'digestive-health',
    description: 'Medications for digestive and stomach issues',
    icon: 'stomach',
    isActive: true,
    sortOrder: 7
  },
  {
    name: 'Skin Care',
    slug: 'skin-care',
    description: 'Topical medications and skin care products',
    icon: 'droplet',
    isActive: true,
    sortOrder: 8
  },
  {
    name: 'Eye Care',
    slug: 'eye-care',
    description: 'Eye drops and vision care products',
    icon: 'eye',
    isActive: true,
    sortOrder: 9
  },
  {
    name: 'Respiratory',
    slug: 'respiratory',
    description: 'Respiratory and lung health medications',
    icon: 'lungs',
    isActive: true,
    sortOrder: 10
  },
  {
    name: 'Women\'s Health',
    slug: 'womens-health',
    description: 'Women\'s health and wellness products',
    icon: 'female',
    isActive: true,
    sortOrder: 11
  },
  {
    name: 'Men\'s Health',
    slug: 'mens-health',
    description: 'Men\'s health and wellness products',
    icon: 'male',
    isActive: true,
    sortOrder: 12
  },
  {
    name: 'Baby & Child Care',
    slug: 'baby-child-care',
    description: 'Pediatric medications and baby care products',
    icon: 'baby',
    isActive: true,
    sortOrder: 13
  },
  {
    name: 'First Aid',
    slug: 'first-aid',
    description: 'First aid supplies and emergency medications',
    icon: 'bandage',
    isActive: true,
    sortOrder: 14
  },
  {
    name: 'Medical Devices',
    slug: 'medical-devices',
    description: 'Medical equipment and monitoring devices',
    icon: 'stethoscope',
    isActive: true,
    sortOrder: 15
  }
];

export const seedCategories = async () => {
  try {
    // Clear existing categories
    await Category.deleteMany({});
    
    // Insert new categories
    await Category.insertMany(categories);
    
    logger.info('Categories seeded successfully');
  } catch (error) {
    logger.error('Error seeding categories:', error);
    throw error;
  }
};