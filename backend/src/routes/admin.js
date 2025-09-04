import express from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Prescription from '../models/Prescription.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin access
router.use(protect);
router.use(authorize('admin'));

// @desc    Get dashboard statistics
// @route   GET /api/v1/admin/dashboard
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res, next) => {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Get various statistics
  const [
    totalUsers,
    totalProducts,
    totalOrders,
    totalPrescriptions,
    todayOrders,
    weeklyOrders,
    monthlyOrders,
    pendingOrders,
    pendingPrescriptions,
    lowStockProducts,
    recentOrders,
    topProducts
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Prescription.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: startOfDay } }),
    Order.countDocuments({ createdAt: { $gte: startOfWeek } }),
    Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Order.countDocuments({ status: { $in: ['pending', 'confirmed'] } }),
    Prescription.countDocuments({ status: 'pending_verification' }),
    Product.countDocuments({ 
      isActive: true,
      $expr: { $lte: ['$stock.quantity', '$stock.lowStockThreshold'] }
    }),
    Order.find()
      .populate('customer', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10),
    Order.aggregate([
      { $unwind: '$items' },
      { 
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' }
    ])
  ]);

  // Calculate revenue statistics
  const revenueStats = await Order.aggregate([
    { $match: { 'payment.status': 'completed' } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$pricing.total' },
        averageOrderValue: { $avg: '$pricing.total' },
        totalOrders: { $sum: 1 }
      }
    }
  ]);

  const revenue = revenueStats[0] || { totalRevenue: 0, averageOrderValue: 0, totalOrders: 0 };

  res.status(200).json({
    success: true,
    stats: {
      users: {
        total: totalUsers,
        growth: 0 // Calculate growth percentage
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts
      },
      orders: {
        total: totalOrders,
        today: todayOrders,
        weekly: weeklyOrders,
        monthly: monthlyOrders,
        pending: pendingOrders
      },
      prescriptions: {
        total: totalPrescriptions,
        pending: pendingPrescriptions
      },
      revenue: {
        total: revenue.totalRevenue,
        average: revenue.averageOrderValue,
        orders: revenue.totalOrders
      }
    },
    recentOrders,
    topProducts
  });
});

// @desc    Get system health
// @route   GET /api/v1/admin/health
// @access  Private/Admin
const getSystemHealth = asyncHandler(async (req, res, next) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status: dbStatus,
        responseTime: null
      },
      api: {
        status: 'healthy',
        uptime: process.uptime()
      },
      memory: {
        used: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        total: process.memoryUsage().heapTotal / 1024 / 1024 // MB
      }
    }
  };

  // Test database response time
  const start = Date.now();
  try {
    await User.findOne().limit(1);
    health.services.database.responseTime = Date.now() - start;
  } catch (error) {
    health.services.database.status = 'error';
    health.status = 'unhealthy';
  }

  res.status(200).json({
    success: true,
    health
  });
});

// @desc    Get audit logs
// @route   GET /api/v1/admin/audit-logs
// @access  Private/Admin
const getAuditLogs = asyncHandler(async (req, res, next) => {
  // In a real application, you would have an AuditLog model
  // For now, return recent activities from various models
  
  const recentActivities = await Promise.all([
    User.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email createdAt')
      .lean(),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'firstName lastName')
      .select('orderNumber status createdAt customer')
      .lean(),
    Prescription.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('patient', 'firstName lastName')
      .select('prescriptionNumber status createdAt patient')
      .lean()
  ]);

  const activities = [
    ...recentActivities[0].map(user => ({
      type: 'user_registration',
      description: `New user registered: ${user.firstName} ${user.lastName}`,
      timestamp: user.createdAt,
      userId: user._id
    })),
    ...recentActivities[1].map(order => ({
      type: 'order_created',
      description: `New order: ${order.orderNumber} by ${order.customer.firstName} ${order.customer.lastName}`,
      timestamp: order.createdAt,
      orderId: order._id
    })),
    ...recentActivities[2].map(prescription => ({
      type: 'prescription_uploaded',
      description: `Prescription uploaded: ${prescription.prescriptionNumber} by ${prescription.patient.firstName} ${prescription.patient.lastName}`,
      timestamp: prescription.createdAt,
      prescriptionId: prescription._id
    }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.status(200).json({
    success: true,
    activities: activities.slice(0, 20)
  });
});

// Routes
router.get('/dashboard', getDashboardStats);
router.get('/health', getSystemHealth);
router.get('/audit-logs', getAuditLogs);

export default router;