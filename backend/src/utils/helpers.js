import crypto from 'crypto';

// Generate unique identifier
export const generateUniqueId = (prefix = '', length = 8) => {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(length).toString('hex').slice(0, length);
  return `${prefix}${timestamp}${random}`.toUpperCase();
};

// Generate order number
export const generateOrderNumber = () => {
  return generateUniqueId('ORD', 6);
};

// Generate prescription number
export const generatePrescriptionNumber = () => {
  return generateUniqueId('RX', 6);
};

// Calculate distance between two coordinates
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

// Format currency
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Format date
export const formatDate = (date, locale = 'en-US') => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
};

// Sanitize filename
export const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-z0-9.-]/gi, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
};

// Generate slug from string
export const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Validate MongoDB ObjectId
export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Calculate tax
export const calculateTax = (amount, taxRate = 0.08) => {
  return Math.round(amount * taxRate * 100) / 100;
};

// Calculate shipping cost
export const calculateShipping = (subtotal, weight = 0, distance = 0) => {
  if (subtotal >= 50) return 0; // Free shipping over $50
  
  let baseCost = 5.99;
  
  // Add weight-based cost
  if (weight > 1) {
    baseCost += (weight - 1) * 0.5;
  }
  
  // Add distance-based cost
  if (distance > 50) {
    baseCost += Math.ceil((distance - 50) / 25) * 2;
  }
  
  return Math.round(baseCost * 100) / 100;
};

// Mask sensitive data
export const maskEmail = (email) => {
  const [username, domain] = email.split('@');
  const maskedUsername = username.slice(0, 2) + '*'.repeat(username.length - 2);
  return `${maskedUsername}@${domain}`;
};

export const maskPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length >= 10) {
    return `${cleaned.slice(0, 3)}***${cleaned.slice(-4)}`;
  }
  return phone;
};

// Generate random password
export const generateRandomPassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
};

// Deep merge objects
export const deepMerge = (target, source) => {
  const output = Object.assign({}, target);
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
};

const isObject = (item) => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

// Retry function with exponential backoff
export const retry = async (fn, maxAttempts = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      
      const backoffDelay = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
};

// Chunk array into smaller arrays
export const chunkArray = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};