import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { logger } from '../utils/logger.js';

export const seedProducts = async () => {
  try {
    // Get categories
    const categories = await Category.find({});
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.slug] = cat._id;
    });

    const products = [
      {
        name: 'Paracetamol 500mg',
        description: 'Effective pain relief and fever reducer. Suitable for headaches, muscle pain, arthritis, backache, toothaches, colds, and fevers.',
        shortDescription: 'Pain relief and fever reducer tablets',
        sku: 'PARA500-20',
        category: categoryMap['pain-relief'],
        manufacturer: 'PharmaCorp',
        brand: 'PainAway',
        activeIngredient: 'Paracetamol',
        strength: '500mg',
        dosageForm: 'tablet',
        packSize: '20 tablets',
        price: 12.99,
        originalPrice: 15.99,
        costPrice: 8.50,
        discount: 20,
        images: [{
          url: 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=400',
          alt: 'Paracetamol 500mg tablets',
          isPrimary: true
        }],
        stock: {
          quantity: 150,
          lowStockThreshold: 20
        },
        prescriptionRequired: false,
        isActive: true,
        isFeatured: true,
        tags: ['pain relief', 'fever', 'headache', 'otc'],
        usage: {
          indications: ['Pain relief', 'Fever reduction', 'Headache', 'Muscle pain'],
          dosageInstructions: 'Adults: 1-2 tablets every 4-6 hours as needed. Do not exceed 8 tablets in 24 hours.',
          contraindications: ['Severe liver disease', 'Allergy to paracetamol'],
          sideEffects: ['Nausea', 'Stomach upset', 'Allergic reactions (rare)'],
          warnings: ['Do not exceed recommended dose', 'Avoid alcohol while taking this medication'],
          storage: 'Store below 25°C in a dry place'
        },
        regulatory: {
          fdaApproved: true,
          approvalNumber: 'FDA-2023-001'
        }
      },
      {
        name: 'Vitamin D3 1000 IU',
        description: 'Essential vitamin for bone health, immune system support, and overall wellness. Helps with calcium absorption.',
        shortDescription: 'Bone health and immune support supplement',
        sku: 'VITD3-1000-60',
        category: categoryMap['vitamins-supplements'],
        manufacturer: 'HealthPlus',
        brand: 'VitaLife',
        activeIngredient: 'Cholecalciferol (Vitamin D3)',
        strength: '1000 IU',
        dosageForm: 'capsule',
        packSize: '60 capsules',
        price: 24.99,
        costPrice: 15.00,
        images: [{
          url: 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=400',
          alt: 'Vitamin D3 1000 IU capsules',
          isPrimary: true
        }],
        stock: {
          quantity: 200,
          lowStockThreshold: 30
        },
        prescriptionRequired: false,
        isActive: true,
        isFeatured: true,
        tags: ['vitamin', 'bone health', 'immune support', 'supplement'],
        usage: {
          indications: ['Vitamin D deficiency', 'Bone health support', 'Immune system support'],
          dosageInstructions: 'Adults: Take 1 capsule daily with food or as directed by healthcare provider.',
          contraindications: ['Hypercalcemia', 'Kidney stones', 'Sarcoidosis'],
          sideEffects: ['Mild nausea', 'Constipation', 'Weakness'],
          storage: 'Store in a cool, dry place away from direct sunlight'
        }
      },
      {
        name: 'Amoxicillin 250mg',
        description: 'Broad-spectrum antibiotic for treating various bacterial infections including respiratory tract, urinary tract, and skin infections.',
        shortDescription: 'Antibiotic for bacterial infections',
        sku: 'AMOX250-21',
        category: categoryMap['antibiotics'],
        manufacturer: 'MediCore',
        brand: 'AmoxiCure',
        activeIngredient: 'Amoxicillin',
        strength: '250mg',
        dosageForm: 'capsule',
        packSize: '21 capsules',
        price: 18.99,
        costPrice: 12.00,
        images: [{
          url: 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=400',
          alt: 'Amoxicillin 250mg capsules',
          isPrimary: true
        }],
        stock: {
          quantity: 80,
          lowStockThreshold: 15
        },
        prescriptionRequired: true,
        scheduleType: 'non-controlled',
        isActive: true,
        isFeatured: true,
        tags: ['antibiotic', 'bacterial infection', 'prescription'],
        usage: {
          indications: ['Bacterial infections', 'Respiratory tract infections', 'Urinary tract infections', 'Skin infections'],
          dosageInstructions: 'Adults: 250-500mg every 8 hours. Complete the full course as prescribed.',
          contraindications: ['Penicillin allergy', 'Mononucleosis', 'Severe kidney disease'],
          sideEffects: ['Diarrhea', 'Nausea', 'Vomiting', 'Skin rash', 'Abdominal pain'],
          interactions: ['Oral contraceptives', 'Warfarin', 'Methotrexate'],
          warnings: ['Complete full course even if feeling better', 'May reduce effectiveness of oral contraceptives'],
          storage: 'Store below 25°C in original container'
        },
        regulatory: {
          fdaApproved: true,
          approvalNumber: 'FDA-2023-002'
        }
      }
    ];

    // Clear existing products
    await Product.deleteMany({});
    
    // Insert new products
    await Product.insertMany(products);
    
    logger.info('Products seeded successfully');
  } catch (error) {
    logger.error('Error seeding products:', error);
    throw error;
  }
};