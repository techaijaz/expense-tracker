import mongoose from 'mongoose';
import dotenvFlow from 'dotenv-flow';
import transactionModel from '../model/transactionModel.js';
import accountModel from '../model/accountModel.js';
import userModel from '../model/userModel.js';

dotenvFlow.config();

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/expense-tracker';

async function migrate() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(DATABASE_URL);
        console.log('Connected to database.');

        // 1. Migrate Transactions: note -> notes, add tags, pendingStatus
        console.log('Migrating Transaction records...');
        const transResult = await transactionModel.updateMany(
            {},
            [
                {
                    $set: {
                        notes: { $ifNull: ["$notes", "$note"] },
                        tags: { $ifNull: ["$tags", []] },
                        pendingStatus: { $ifNull: ["$pendingStatus", false] }
                    }
                },
                {
                    $unset: ["note"]
                }
            ]
        );
        console.log(`Updated ${transResult.modifiedCount} transaction records.`);

        // 2. Ensure every user has a "Cash" account
        console.log('Checking user accounts for Cash consistency...');
        const users = await userModel.find({});
        for (const user of users) {
            const hasCash = await accountModel.findOne({ userId: user._id, isCash: true });
            if (!hasCash) {
                console.log(`Creating missing Cash account for user: ${user.email}`);
                await accountModel.create({
                    userId: user._id,
                    name: 'Cash',
                    type: 'CASH',
                    isCash: true,
                    balance: 0,
                });
            }
        }
        console.log('Account consistency check complete.');

        console.log('Migration successfully completed!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

migrate();
