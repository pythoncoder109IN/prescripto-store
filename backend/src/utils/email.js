import nodemailer from 'nodemailer';
import { logger } from './logger.js';

// Create reusable transporter
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production email service (e.g., SendGrid, AWS SES)
    return nodemailer.createTransporter({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  } else {
    // Development - use Gmail or other SMTP
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }
};

// Email templates
const emailTemplates = {
  emailVerification: (data) => ({
    subject: 'Verify Your Email - MedCare',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to MedCare, ${data.name}!</h2>
        <p>Thank you for registering with MedCare. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.verificationUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>If you didn't create an account with MedCare, please ignore this email.</p>
        <p>This verification link will expire in 24 hours.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          MedCare - Your Trusted Medical Partner<br>
          123 Healthcare Street, Medical District, New York, NY 10001
        </p>
      </div>
    `
  }),

  passwordReset: (data) => ({
    subject: 'Password Reset - MedCare',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>Hello ${data.name},</p>
        <p>You requested a password reset for your MedCare account. Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.resetUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>This reset link will expire in 10 minutes for security reasons.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          MedCare - Your Trusted Medical Partner<br>
          123 Healthcare Street, Medical District, New York, NY 10001
        </p>
      </div>
    `
  }),

  orderConfirmation: (data) => ({
    subject: `Order Confirmation #${data.orderNumber} - MedCare`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Order Confirmation</h2>
        <p>Hello ${data.customerName},</p>
        <p>Thank you for your order! We've received your order and it's being processed.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Order Details</h3>
          <p><strong>Order Number:</strong> ${data.orderNumber}</p>
          <p><strong>Total:</strong> $${data.total.toFixed(2)}</p>
        </div>

        <h3>Items Ordered:</h3>
        <ul>
          ${data.items.map(item => `
            <li>${item.name} - Quantity: ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</li>
          `).join('')}
        </ul>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.trackingUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Track Your Order
          </a>
        </div>

        <p>We'll send you updates as your order progresses.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          MedCare - Your Trusted Medical Partner<br>
          123 Healthcare Street, Medical District, New York, NY 10001
        </p>
      </div>
    `
  })
};

export const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    let emailContent;
    if (options.template && emailTemplates[options.template]) {
      emailContent = emailTemplates[options.template](options.data);
    } else {
      emailContent = {
        subject: options.subject,
        html: options.html || options.message
      };
    }

    const mailOptions = {
      from: `MedCare <${process.env.EMAIL_FROM}>`,
      to: options.email,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${options.email}: ${info.messageId}`);
    
    return info;
  } catch (error) {
    logger.error('Email sending failed:', error);
    throw error;
  }
};