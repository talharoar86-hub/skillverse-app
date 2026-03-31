const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const migrateUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('--- Migrating Users ---');
    
    // Assign random goals if null
    const users = await User.find({ goal: { $in: [null, ""] } });
    console.log(`Found ${users.length} users with null goals.`);
    
    const goals = ['Learn', 'Mentor', 'Exchange'];
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      user.goal = goals[i % goals.length];
      user.onboardingComplete = true; // Ensure they show up in discovery
      await user.save();
      console.log(`Updated ${user.name} to ${user.goal}`);
    }
    
    console.log('--- Migration Complete ---');
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

migrateUsers();
