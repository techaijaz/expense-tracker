import { Router } from 'express';
import subscriptionController from '../controller/subscriptionController.js';
import authentication from '../middleware/authentication.js';
import express from 'express';

const router = Router();

// Webhook needs raw body, should be placed before express.json() in app.js or handled here
// For Stripe/Razorpay webhooks
router.post('/webhook', subscriptionController.webhook);

router.use(authentication);

router.get('/config', subscriptionController.getConfig);
router.post('/create-order', subscriptionController.createOrder);
router.post('/verify-payment', subscriptionController.verifyPayment);
router.post('/submit-manual', subscriptionController.submitManualPayment);
router.patch('/cancel', subscriptionController.cancelSubscription);

export default router;
