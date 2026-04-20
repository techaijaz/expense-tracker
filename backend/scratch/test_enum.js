import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    plan: {
        type: String,
        enum: ['basic', 'pro'],
        default: 'basic'
    },
    subscriptionPeriod: {
        type: String,
        enum: ['monthly', 'yearly'],
        default: null
    }
});

const User = mongoose.model('TestUser', userSchema);

async function test() {
    try {
        await mongoose.connect('mongodb://localhost:27017/test_db_enum');
        console.log('Connected');
        
        const user = new User({ plan: 'pro', subscriptionPeriod: 'monthly' });
        await user.save();
        console.log('Saved pro');
        
        user.plan = 'basic';
        user.subscriptionPeriod = null;
        await user.save();
        console.log('Saved basic (cancelled)');
        
    } catch (err) {
        console.error('FAILED:', err.message);
    } finally {
        await mongoose.connection.close();
    }
}

test();
