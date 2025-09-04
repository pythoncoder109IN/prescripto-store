import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/database.js';
import { seedCategories } from './categorySeeder.js';
import { seedProducts } from './productSeeder.js';
import { logger } from '../utils/logger.js';

// Load environment variables
dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();
    
    logger.info('Starting database seeding...');
    
    // Seed in order (categories first, then products)
    await seedCategories();
    await seedProducts();
    
    logger.info('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  }
};

// Run seeder if called directly
if (process.argv[2] === '--seed') {
  seedDatabase();
}

export { seedDatabase };