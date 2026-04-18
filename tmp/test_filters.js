import mongoose from 'mongoose';
import databseService from './backend/src/service/databseService.js';
import transactionModel from './backend/src/model/transactionModel.js';
import ledgerModel from './backend/src/model/ledgerModel.js';
import accountModel from './backend/src/model/accountModel.js';
import categoryModel from './backend/src/model/categoryModel.js';
import config from './backend/src/config/config.js';

async function test() {
    await mongoose.connect(config.DATABASE_URL);
    console.log('Connected to DB');

    const userId = '67f1309d58728d888126e792'; // you@example.com ID (guessed or need to find)
    // Actually let's find the user first
    const user = await mongoose.connection.db.collection('users').findOne({ email: 'you@example.com' });
    if (!user) {
        console.log('User not found');
        process.exit(1);
    }
    const uid = user._id;

    console.log('Testing filters for user:', user.email, 'ID:', uid);

    // Test 1: All transactions
    const res1 = await databseService.getAllTransections(uid, { pagination: { limit: 10, page: 1 } });
    console.log('Total transactions (no filter):', res1.totalCount);
    res1.transactions.forEach(t => console.log(` - ${t.description} | ${t.account?.name} | ${t.amount}`));

    // Test 2: Filter by account (get an ID from results)
    if (res1.transactions.length > 0) {
        const accId = res1.transactions[0].account._id;
        console.log('\nFiltering by account ID:', accId, ' (Name:', res1.transactions[0].account.name, ')');
        const res2 = await databseService.getAllTransections(uid, { 
            account: accId.toString(), 
            pagination: { limit: 10, page: 1 } 
        });
        console.log('Total transactions (account filter):', res2.totalCount);
        res2.transactions.forEach(t => console.log(` - ${t.description} | ${t.account?.name} | ${t.amount}`));
        
        const hasOtherAccount = res2.transactions.some(t => t.account._id.toString() !== accId.toString());
        if (hasOtherAccount) {
            console.error('BUG DETECTED: Found transactions for other accounts in filtered result!');
        } else {
            console.log('Account filter seems to work in isolation.');
        }
    }

    await mongoose.disconnect();
}

test();
