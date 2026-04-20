import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import userModel from '../src/model/userModel.js';

dotenv.config({ path: '.env.development' });

async function checkUsers() {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        const users = await userModel.find({}, 'email role');
        console.log(JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
