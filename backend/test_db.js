import mongoose from 'mongoose';
import config from './src/config/config.js';

async function test() {
  await mongoose.connect(config.DATABASE_URL);
  const userModel = mongoose.model('User', new mongoose.Schema({ email: String }), 'users');
  const user = await userModel.findOne({ email: 'care@blazefragrance.in' });
  console.log('User:', user);
  if (user) {
    const accountModel = mongoose.model('Account', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, user: mongoose.Schema.Types.ObjectId }), 'accounts');
    const accounts = await accountModel.find({ $or: [{ userId: user._id }, { user: user._id }]});
    console.log('Accounts:', accounts);
  }
  process.exit(0);
}
test();
