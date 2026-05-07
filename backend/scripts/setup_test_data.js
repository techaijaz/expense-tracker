import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.development') });

const setup = async () => {
  try {
    console.log('Connecting to database...');
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not found in .env.development');
    }
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Connected.');

    const UserSchema = new mongoose.Schema({
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, unique: true, required: true },
      password: { type: String, select: false },
      onboardingDone: { type: Boolean, default: false },
      consent: { type: Boolean, default: true },
      preferences: Object
    });

    const User = mongoose.model('User', UserSchema);

    // Check if test user exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('Test user already exists. Updating password and required fields...');
      existingUser.password = await bcrypt.hash('password123', 10);
      existingUser.firstName = 'Test';
      existingUser.lastName = 'User';
      existingUser.onboardingDone = true;
      existingUser.consent = true;
      await existingUser.save();
    } else {
      console.log('Creating test user...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: hashedPassword,
        onboardingDone: true,
        consent: true,
        preferences: {
          currency: 'INR',
          decimalPlaces: 2,
          dateFormat: 'DD/MM/YYYY'
        }
      });
      console.log('Test user created.');
    }

    console.log('Setup complete.');
    process.exit(0);
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
};

setup();
