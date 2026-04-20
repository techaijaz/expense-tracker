import Stripe from 'stripe';
try {
    const stripe = new Stripe(undefined);
    console.log('Stripe initialized with undefined');
} catch (err) {
    console.log('Stripe initialization FAILED:', err.message);
}
