import db from '../src/service/databseService.js';
import accountModel from '../src/model/accountModel.js';
import mongoose from 'mongoose';
import dotenvFlow from 'dotenv-flow';

// Ensure env is loaded
dotenvFlow.config();

async function runTest() {
    try {
        await db.connect();
        console.log('Connected to DB');

        // 1. Find two users
        const users = await mongoose.model('User').find().limit(2);
        if (users.length < 2) {
            console.error('Not enough users for test. Need at least 2 users in the DB.');
            process.exit(1);
        }
        const userA = users[0];
        const userB = users[1];
        console.log(`User A: ${userA.email} (${userA._id})`);
        console.log(`User B: ${userB.email} (${userB._id})`);

        // 2. Find an account belonging to User B
        const accountB = await accountModel.findOne({ userId: userB._id });
        if (!accountB) {
            console.error(`User B (${userB.email}) has no accounts. Cannot proceed with IDOR test.`);
            process.exit(1);
        }
        console.log(`User B Account: ${accountB.name} (${accountB._id})`);

        // 3. Try to create a transaction for User A using User B's account
        console.log('\n--- Test 1: Create Transaction for User A with User B Account ---');
        const payload = {
            userId: userA._id,
            accountId: accountB._id, // UNAUTHORIZED for User A
            type: 'income',
            amount: 100,
            title: 'IDOR Test',
            date: new Date()
        };

        try {
            await db.createTransaction(payload);
            console.error('FAIL: createTransaction succeeded when it should have failed!');
        } catch (error) {
            console.log(`SUCCESS: createTransaction failed as expected. Error: ${error.message}`);
            if (error.message === 'Account not found') {
                console.log('Verified: IDOR prevented by userId scoping in account lookup.');
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Test script error:', error);
        process.exit(1);
    }
}

runTest();
