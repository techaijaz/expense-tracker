import db from '../src/service/databseService.js';
import userModel from '../src/model/userModel.js';
import accountModel from '../src/model/accountModel.js';
import dotenvFlow from 'dotenv-flow';

dotenvFlow.config();

async function seed() {
    try {
        await db.connect();
        console.log('Connected to DB');

        // Check if test user exists
        let testUser = await userModel.findOne({ email: 'test.user@example.com' });
        if (!testUser) {
            testUser = await userModel.create({
                firstName: 'Test',
                lastName: 'User',
                email: 'test.user@example.com',
                password: 'password123', // In a real app this would be hashed
                consent: true,
                isVerified: true
            });
            console.log('Created test user:', testUser.email);
        } else {
            console.log('Test user already exists:', testUser.email);
        }

        // Check if an account exists for this user
        let testAccount = await accountModel.findOne({ userId: testUser._id });
        if (!testAccount) {
            testAccount = await accountModel.create({
                userId: testUser._id,
                name: 'Test Savings',
                type: 'BANK',
                balance: 1000,
                currency: 'INR'
            });
            console.log('Created test account:', testAccount.name);
        } else {
            console.log('Test account already exists:', testAccount.name);
        }

        console.log('Seeding completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seed();
