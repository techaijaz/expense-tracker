import Razorpay from 'razorpay';
import Stripe from 'stripe';
import crypto from 'crypto';
import config from '../config/config.js';
import dayjs from 'dayjs';

class PaymentProvider {
    async createOrder(amount, currency, receipt, metadata) {
        throw new Error('Method not implemented');
    }
    async verifyPayment(paymentDetails) {
        throw new Error('Method not implemented');
    }
}

class RazorpayProvider extends PaymentProvider {
    constructor() {
        super();
        if (config.RAZORPAY.KEY_ID && config.RAZORPAY.KEY_SECRET) {
            this.razorpay = new Razorpay({
                key_id: config.RAZORPAY.KEY_ID,
                key_secret: config.RAZORPAY.KEY_SECRET,
            });
        } else {
            console.warn('Razorpay keys missing. RazorpayProvider will not function correctly.');
            this.razorpay = null;
        }
    }

    async createOrder(amount, currency = 'INR', receipt, metadata) {
        const options = {
            amount: amount * 100, // amount in the smallest currency unit
            currency,
            receipt,
            notes: metadata,
        };
        const order = await this.razorpay.orders.create(options);
        return {
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            provider: 'razorpay',
        };
    }

    async verifyPayment(paymentDetails) {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentDetails;
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', config.RAZORPAY.KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            return {
                success: true,
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
            };
        }
        return { success: false };
    }
}

class StripeProvider extends PaymentProvider {
    constructor() {
        super();
        if (config.STRIPE.SECRET_KEY) {
            this.stripe = new Stripe(config.STRIPE.SECRET_KEY);
        } else {
            console.warn('Stripe secret key missing. StripeProvider will not function correctly.');
            this.stripe = null;
        }
    }

    async createOrder(amount, currency = 'inr', receipt, metadata) {
        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency,
                        product_data: {
                            name: metadata.planName || 'Subscription',
                        },
                        unit_amount: amount * 100,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${config.FRONTEND_URL}/settings?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${config.FRONTEND_URL}/settings`,
            metadata: {
                userId: metadata.userId,
                plan: metadata.plan,
                period: metadata.period,
            },
        });

        return {
            id: session.id,
            url: session.url,
            provider: 'stripe',
        };
    }

    async verifyPayment(paymentDetails) {
        const { session_id } = paymentDetails;
        const session = await this.stripe.checkout.sessions.retrieve(session_id);
        if (session.payment_status === 'paid') {
            return {
                success: true,
                orderId: session.id,
                metadata: session.metadata,
            };
        }
        return { success: false };
    }
}

class ManualProvider extends PaymentProvider {
    async createOrder(amount, currency, receipt, metadata) {
        return {
            id: `manual_${Date.now()}`,
            provider: 'manual',
            status: 'pending'
        };
    }

    async verifyPayment(paymentDetails) {
        // In manual mode, we just return success if called
        return { success: true };
    }
}

class PaymentService {
    static getProvider() {
        const gateway = config.PAYMENT_GATEWAY;
        switch (gateway) {
            case 'razorpay':
                return new RazorpayProvider();
            case 'stripe':
                return new StripeProvider();
            case 'manual':
            default:
                return new ManualProvider();
        }
    }
}

export default PaymentService;
