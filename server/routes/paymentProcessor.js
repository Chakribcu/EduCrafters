/**
 * Payment Processing Routes
 * Created by Chakridhar - April 2025
 * 
 * This module handles payment processing using Stripe
 */

import express from 'express';
import { storage } from '../storage.js';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

// Auth middleware for routes
const requireAuth = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // If no token in header, check cookies
    if (!token && req.cookies?.authToken) {
      token = req.cookies.authToken;
    }
    
    if (!token) {
      return res.status(401).json({ error: 'Not authorized, no token' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    const user = await storage.getUser(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'Not authorized, user not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Not authorized, invalid token' });
  }
};

// Get Stripe public key for client initialization
router.get('/stripe-config', (req, res) => {
  res.json({
    publicKey: process.env.VITE_STRIPE_PUBLIC_KEY
  });
});

// Create a payment intent for a course purchase
router.post('/create-payment-intent', requireAuth, async (req, res) => {
  try {
    const { courseId, amount } = req.body;
    
    if (!courseId || !amount) {
      return res.status(400).json({
        error: 'Missing required fields: courseId and amount are required'
      });
    }
    
    // Verify course exists
    const course = await storage.getCourse(courseId);
    if (!course) {
      return res.status(404).json({
        error: 'Course not found'
      });
    }
    
    // Check if user is already enrolled
    const existingEnrollment = await storage.getEnrollment(req.user.id, courseId);
    if (existingEnrollment) {
      return res.status(400).json({
        error: 'You are already enrolled in this course'
      });
    }
    
    // Verify amount matches course price
    if (parseFloat(amount) !== parseFloat(course.price)) {
      return res.status(400).json({
        error: 'Invalid payment amount'
      });
    }
    
    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'gbp',
      metadata: {
        userId: req.user.id.toString(),
        courseId: courseId.toString(),
        integration_check: 'accept_a_payment'
      }
    });
    
    // Return the client secret
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      error: 'Failed to create payment intent',
      message: error.message
    });
  }
});

// Process a successful payment and enroll the user
router.post('/process-payment', requireAuth, async (req, res) => {
  try {
    const { paymentIntentId, courseId } = req.body;
    
    if (!paymentIntentId || !courseId) {
      return res.status(400).json({
        error: 'Missing required fields: paymentIntentId and courseId are required'
      });
    }
    
    // Retrieve the payment intent to verify it's successful
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        error: 'Payment has not been successfully completed'
      });
    }
    
    // Verify the payment is for the correct course and user
    if (
      paymentIntent.metadata.courseId !== courseId.toString() ||
      paymentIntent.metadata.userId !== req.user.id.toString()
    ) {
      return res.status(400).json({
        error: 'Payment metadata mismatch'
      });
    }
    
    // Enroll the user in the course
    const enrollmentData = {
      userId: req.user.id,
      courseId: parseInt(courseId),
      enrollmentDate: new Date(),
      paymentIntent: paymentIntentId,
      paymentStatus: 'success'
    };
    
    const enrollment = await storage.createEnrollment(enrollmentData);
    
    // Return the enrollment and payment intent
    res.json({
      enrollment,
      paymentIntent
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      error: 'Failed to process payment',
      message: error.message
    });
  }
});

// Webhook for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;
  
  try {
    // Verify the event came from Stripe
    const signature = req.headers['stripe-signature'];
    
    // You should use this in production with a webhook secret
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } else {
      // For development without a webhook secret
      event = JSON.parse(req.body.toString());
    }
    
    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      
      // Extract metadata
      const { userId, courseId } = paymentIntent.metadata;
      
      if (userId && courseId) {
        // Check if enrollment already exists
        const existingEnrollment = await storage.getEnrollment(userId, courseId);
        
        if (!existingEnrollment) {
          // Create enrollment
          await storage.createEnrollment({
            userId: parseInt(userId),
            courseId: parseInt(courseId),
            enrollmentDate: new Date(),
            paymentIntent: paymentIntent.id,
            paymentStatus: 'success'
          });
        }
      }
    }
    
    // Acknowledge receipt of the event
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook error', message: error.message });
  }
});

export default router;