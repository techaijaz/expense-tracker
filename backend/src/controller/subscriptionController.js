import httpResponse from '../util/httpResponse.js';
import httpError from '../util/httpError.js';
import PaymentService from '../service/paymentService.js';
import databseService from '../service/databseService.js';
import dayjs from 'dayjs';
import config from '../config/config.js';
import Stripe from 'stripe';
import userModel from '../model/userModel.js';
import paymentRequestModel from '../model/paymentRequestModel.js';
import globalSettingsModel from '../model/globalSettingsModel.js';

const stripe = config.STRIPE.SECRET_KEY ? new Stripe(config.STRIPE.SECRET_KEY) : null;

export default {
    getConfig: async (req, res, next) => {
        try {
            let settings = await globalSettingsModel.findOne();
            if (!settings) {
                settings = await globalSettingsModel.create({
                    activePaymentGateway: config.PAYMENT_GATEWAY,
                    manualPaymentInfo: { instructions: 'Please transfer and upload receipt.' }
                });
            }
            
            httpResponse(req, res, 200, 'Config retrieved', {
                gateway: settings.activePaymentGateway,
                razorpayKeyId: config.RAZORPAY.KEY_ID,
                stripePublishableKey: config.STRIPE.PUBLISHABLE_KEY,
                manualPaymentInfo: settings.manualPaymentInfo
            });
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    submitManualPayment: async (req, res, next) => {
        try {
            const { plan, period, transactionId, evidence } = req.body;
            const userId = req.authenticatedUser._id;

            // Define pricing
            const prices = {
                'pro_monthly': 99,
                'pro_yearly': 799
            };

            const amount = prices[`${plan}_${period}`];
            if (!amount) {
                return httpError(next, new Error('Invalid plan or period'), req, 400);
            }

            const paymentRequest = await paymentRequestModel.create({
                userId,
                plan,
                period,
                amount,
                transactionId,
                evidence,
                status: 'pending'
            });

            httpResponse(req, res, 201, 'Payment request submitted successfully. Waiting for admin verification.', paymentRequest);
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    createOrder: async (req, res, next) => {
        try {
            const { plan, period } = req.body;
            const userId = req.authenticatedUser._id;

            // Define pricing (This should probably be in a config or DB)
            const prices = {
                'pro_monthly': 99,
                'pro_yearly': 799
            };

            const planKey = `pro_${period}`;
            const amount = prices[planKey];
            
            if (!amount) {
                return httpError(next, new Error('Invalid plan or period'), req, 400);
            }

            const paymentProvider = PaymentService.getProvider();
            const order = await paymentProvider.createOrder(amount, 'INR', `receipt_${userId}_${Date.now()}`, {
                userId: userId.toString(),
                plan,
                period,
                planName: planKey === 'pro_monthly' ? 'Pro Monthly' : 'Pro Yearly'
            });

            httpResponse(req, res, 200, 'Order created successfully', order);
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    verifyPayment: async (req, res, next) => {
        try {
            const { paymentDetails, plan, period } = req.body;
            const userId = req.authenticatedUser._id;

            const paymentProvider = PaymentService.getProvider();
            const verification = await paymentProvider.verifyPayment(paymentDetails);

            if (verification.success) {
                // Update user subscription
                const subscriptionData = {
                    plan: 'pro',
                    subscriptionPeriod: period,
                    subscriptionStart: dayjs().toDate(),
                    subscriptionEnd: period === 'monthly' ? dayjs().add(1, 'month').toDate() : dayjs().add(1, 'year').toDate()
                };

                const updatedUser = await databseService.updateUserSubscription(userId, subscriptionData);

                httpResponse(req, res, 200, 'Payment verified and subscription activated', {
                    plan: updatedUser.plan,
                    subscriptionPeriod: updatedUser.subscriptionPeriod,
                    subscriptionEnd: updatedUser.subscriptionEnd
                });
            } else {
                httpError(next, new Error('Payment verification failed'), req, 400);
            }
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    webhook: async (req, res, next) => {
        const sig = req.headers['stripe-signature'];
        const razorpaySig = req.headers['x-razorpay-signature'];
        
        try {
            if (sig) {
                // Stripe Webhook logic
                let event;
                try {
                    event = stripe.webhooks.constructEvent(req.rawBody, sig, config.STRIPE.WEBHOOK_SECRET);
                } catch (err) {
                    return res.status(400).send(`Webhook Error: ${err.message}`);
                }

                if (event.type === 'checkout.session.completed') {
                    const session = event.data.object;
                    const { userId, plan, period } = session.metadata;
                    
                    const subscriptionData = {
                        plan,
                        subscriptionPeriod: period,
                        subscriptionStart: dayjs().toDate(),
                        subscriptionEnd: period === 'monthly' ? dayjs().add(1, 'month').toDate() : dayjs().add(1, 'year').toDate()
                    };

                    await databseService.updateUserSubscription(userId, subscriptionData);
                }
            } else if (razorpaySig) {
                // Razorpay Webhook logic
                // Razorpay doesn't strictly require signature verification for simple success tracking 
                // but it's recommended. For now, let's just handle it.
                // Note: body needs to be raw for signature verification
            }

            res.json({ received: true });
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    cancelSubscription: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id;
            console.log(`[Subscription-DEBUG] ENTER cancelSubscription for user: ${userId}`);
            
            const subscriptionData = {
                plan: 'basic',
                subscriptionPeriod: null,
                subscriptionStart: null,
                subscriptionEnd: null
            };

            console.log(`[Subscription-DEBUG] Attempting DB update for ${userId}`);
            const updatedUser = await userModel.findOneAndUpdate(
                { _id: userId },
                { $set: subscriptionData },
                { new: true, runValidators: false }
            );

            if (!updatedUser) {
                console.error(`[Subscription-DEBUG] User NOT FOUND: ${userId}`);
                return httpError(next, new Error('User not found in system during cancellation'), req, 404);
            }

            console.log(`[Subscription-DEBUG] SUCCESS for user: ${userId}. New Plan: ${updatedUser.plan}`);

            httpResponse(req, res, 200, 'Subscription cancelled successfully', {
                plan: updatedUser.plan,
                subscriptionPeriod: updatedUser.subscriptionPeriod,
                subscriptionStart: updatedUser.subscriptionStart,
                subscriptionEnd: updatedUser.subscriptionEnd,
            });
        } catch (error) {
            console.error(`[Subscription-DEBUG] CRITICAL ERROR for ${req.authenticatedUser?._id}:`, error);
            httpError(next, error, req, 500);
        }
    }
};
