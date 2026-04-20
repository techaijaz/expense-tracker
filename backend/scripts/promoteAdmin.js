import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import userModel from '../src/model/userModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.join(__dirname, '..', '.env.development') });

const promoteUser = async (email) => {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('Connected to database.');

        const user = await userModel.findOne({ email });
        if (!user) {
            console.error(`User with email ${email} not found.`);
            process.exit(1);
        }

        user.role = 'admin';
        await user.save();

        console.log(`Successfully promoted ${email} to admin.`);
        process.exit(0);
    } catch (error) {
        console.error('Error promoting user:', error);
        process.exit(1);
    }
};

const email = process.argv[2];
if (!email) {
    console.error('Please provide an email address: node scripts/promoteAdmin.js user@example.com');
    process.exit(1);
}

promoteUser(email);
