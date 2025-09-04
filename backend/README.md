# MedCare Backend API

A comprehensive backend API for the MedCare medical platform built with Node.js, Express, and MongoDB.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Complete user profiles with medical information
- **Product Catalog**: Comprehensive medicine and healthcare product management
- **Prescription Processing**: OCR-powered prescription upload and verification
- **Order Management**: Full order lifecycle with status tracking
- **Payment Processing**: Stripe integration for secure payments
- **File Uploads**: Cloudinary integration for image storage
- **Email Notifications**: Automated email system for various events
- **Security**: Production-ready security measures
- **Logging**: Comprehensive logging with Winston
- **Validation**: Input validation and sanitization
- **Error Handling**: Centralized error handling

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcryptjs
- **File Storage**: Cloudinary
- **Payment**: Stripe
- **Email**: Nodemailer
- **OCR**: Tesseract.js
- **Validation**: Express-validator & Joi
- **Security**: Helmet, CORS, Rate limiting
- **Logging**: Winston
- **Testing**: Jest & Supertest

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`

5. Seed the database:
   ```bash
   npm run seed
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

See `.env.example` for all required environment variables.

### Required Services

1. **MongoDB**: Database for storing application data
2. **Cloudinary**: Image storage and processing
3. **Stripe**: Payment processing
4. **SMTP Service**: Email delivery (Gmail, SendGrid, etc.)

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user
- `PUT /api/v1/auth/updatedetails` - Update user details
- `PUT /api/v1/auth/updatepassword` - Update password
- `POST /api/v1/auth/forgotpassword` - Forgot password
- `PUT /api/v1/auth/resetpassword/:token` - Reset password

### Products
- `GET /api/v1/products` - Get all products
- `GET /api/v1/products/:id` - Get single product
- `GET /api/v1/products/featured` - Get featured products
- `GET /api/v1/products/search` - Search products
- `GET /api/v1/products/category/:slug` - Get products by category

### Prescriptions
- `POST /api/v1/prescriptions` - Upload prescription
- `GET /api/v1/prescriptions` - Get user prescriptions
- `GET /api/v1/prescriptions/:id` - Get single prescription
- `PATCH /api/v1/prescriptions/:id/verify` - Verify prescription (Pharmacist)

### Orders
- `POST /api/v1/orders` - Create new order
- `GET /api/v1/orders` - Get user orders
- `GET /api/v1/orders/:id` - Get single order
- `PATCH /api/v1/orders/:id/cancel` - Cancel order
- `GET /api/v1/orders/track/:trackingNumber` - Track order

### Cart
- `GET /api/v1/cart` - Get user cart
- `POST /api/v1/cart/items` - Add item to cart
- `PUT /api/v1/cart/items/:itemId` - Update cart item
- `DELETE /api/v1/cart/items/:itemId` - Remove from cart
- `DELETE /api/v1/cart` - Clear cart

### Payments
- `POST /api/v1/payments/create-intent` - Create payment intent
- `POST /api/v1/payments/confirm` - Confirm payment
- `POST /api/v1/payments/webhook` - Stripe webhook

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request rate limiting
- **Input Sanitization**: MongoDB injection prevention
- **XSS Protection**: Cross-site scripting prevention
- **HPP**: HTTP parameter pollution prevention
- **JWT**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security

## Database Models

- **User**: User accounts with medical information
- **Product**: Medicine and healthcare products
- **Category**: Product categorization
- **Prescription**: Prescription management with OCR
- **Order**: Order processing and tracking
- **Cart**: Shopping cart functionality
- **Review**: Product reviews and ratings

## File Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── prescriptionController.js
│   │   ├── orderController.js
│   │   └── cartController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   ├── errorHandler.js
│   │   ├── upload.js
│   │   └── notFound.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Category.js
│   │   ├── Prescription.js
│   │   ├── Order.js
│   │   ├── Cart.js
│   │   └── Review.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── products.js
│   │   ├── categories.js
│   │   ├── prescriptions.js
│   │   ├── orders.js
│   │   ├── cart.js
│   │   ├── payments.js
│   │   ├── uploads.js
│   │   └── admin.js
│   ├── seeders/
│   │   ├── categorySeeder.js
│   │   ├── productSeeder.js
│   │   └── index.js
│   ├── utils/
│   │   ├── asyncHandler.js
│   │   ├── appError.js
│   │   ├── apiFeatures.js
│   │   ├── logger.js
│   │   ├── email.js
│   │   └── ocrProcessor.js
│   └── server.js
├── logs/
├── .env.example
├── package.json
└── README.md
```

## Development

1. Start development server:
   ```bash
   npm run dev
   ```

2. Run tests:
   ```bash
   npm test
   ```

3. Lint code:
   ```bash
   npm run lint
   ```

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database
3. Set up proper SMTP service
4. Configure Cloudinary for production
5. Set up Stripe production keys
6. Use PM2 or similar for process management

## API Documentation

The API follows RESTful conventions and returns JSON responses. All endpoints include proper error handling and validation.

### Response Format

Success responses:
```json
{
  "success": true,
  "data": {...}
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "message": "Error description"
  }
}
```

## Contributing

1. Follow the existing code structure
2. Add proper validation for all inputs
3. Include error handling
4. Write tests for new features
5. Update documentation

## License

This project is licensed under the MIT License.