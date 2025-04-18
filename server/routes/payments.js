/**
 * Payment routes for handling Stripe integration
 */
import express from 'express';
import Stripe from 'stripe';
import { requireAuth } from '../middleware/clerkAuth.js';
import Course from '../../models/Course.js';
import User from '../../models/User.js';
import Enrollment from '../../models/Enrollment.js';

const router = express.Router();

// Initialize Stripe with API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a payment intent for course purchase
 * Route: POST /api/payments/create-payment-intent
 */
router.post('/create-payment-intent', requireAuth, async (req, res) => {
  try {
    const { courseId, amount } = req.body;
    
    if (!courseId || !amount) {
      return res.status(400).json({ message: 'Course ID and amount are required' });
    }
    
    // Verify the course exists
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if the user is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      userId: req.user._id,
      courseId: course._id
    });
    
    if (existingEnrollment) {
      return res.status(400).json({ message: 'You are already enrolled in this course' });
    }
    
    // Create a payment intent with the amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents for Stripe
      currency: 'gbp', // Using GBP as currency
      metadata: {
        courseId: courseId.toString(),
        userId: req.user._id.toString()
      }
    });
    
    res.status(200).json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Webhook for Stripe events
 * Route: POST /api/payments/webhook
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  let event;
  
  try {
    // Verify the webhook signature
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // For development without a webhook secret
      event = JSON.parse(req.body);
    }
    
    // Handle different event types
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      await handleSuccessfulPayment(paymentIntent);
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      await handleFailedPayment(paymentIntent);
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ message: error.message });
  }
});

/**
 * Handle successful payment
 * @param {Object} paymentIntent - Stripe payment intent
 */
async function handleSuccessfulPayment(paymentIntent) {
  try {
    const { courseId, userId } = paymentIntent.metadata;
    
    // Check if an enrollment already exists
    const existingEnrollment = await Enrollment.findOne({
      userId,
      courseId
    });
    
    if (existingEnrollment) {
      // Update payment status if enrollment exists but wasn't paid
      if (existingEnrollment.paymentStatus !== 'paid') {
        existingEnrollment.paymentStatus = 'paid';
        existingEnrollment.paymentId = paymentIntent.id;
        await existingEnrollment.save();
      }
      return;
    }
    
    // Create a new enrollment
    const enrollment = new Enrollment({
      userId,
      courseId,
      enrolledAt: new Date(),
      paymentStatus: 'paid',
      paymentId: paymentIntent.id,
      completedLessons: [],
      progress: 0
    });
    
    await enrollment.save();
    
    // Update user and course stats
    await Course.findByIdAndUpdate(courseId, {
      $inc: { enrollmentCount: 1 }
    });
    
    console.log(`Enrollment created for user ${userId} in course ${courseId}`);
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

/**
 * Handle failed payment
 * @param {Object} paymentIntent - Stripe payment intent
 */
async function handleFailedPayment(paymentIntent) {
  try {
    const { courseId, userId } = paymentIntent.metadata;
    
    // Find existing enrollment with this payment intent
    const enrollment = await Enrollment.findOne({
      paymentId: paymentIntent.id
    });
    
    if (enrollment) {
      enrollment.paymentStatus = 'failed';
      await enrollment.save();
    }
    
    console.log(`Payment failed for user ${userId} in course ${courseId}`);
  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
}

export default router;