const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('--- User Distribution ---');
    
    const goals = await User.aggregate([
      { $group: { _id: '$goal', count: { $sum: 1 }, onboarding: { $sum: { $cond: ['$onboardingComplete', 1, 0] } } } }
    ]);
    
    console.table(goals);
    
    const totalUsers = await User.countDocuments();
    console.log(`Total Users: ${totalUsers}`);
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

checkUsers();
