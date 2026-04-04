const axios = require('axios');
const jwt = require('jsonwebtoken');

require('dotenv').config({ path: 'd:/This/skillverse/backend/.env' });

async function testVoting() {
  try {
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const User = require('./models/User');
    const Post = require('./models/Post');
    
    const user = await User.findOne({});
    if (!user) {
      console.log('No user found');
      return;
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    // Get poll posts
    const pollRes = await axios.get('http://localhost:5000/api/posts?page=1&type=Poll', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (pollRes.data.length === 0) {
      console.log('No poll posts found');
      return;
    }
    
    const poll = pollRes.data[0];
    console.log('=== Poll Data from API ===');
    console.log('Poll ID:', poll._id);
    console.log('Question:', poll.poll.question);
    console.log('Total Votes:', poll.poll.totalVotes);
    console.log('Voted Users:', JSON.stringify(poll.poll.votedUsers, null, 2));
    console.log('Options:', poll.poll.options.map((o, i) => `${i}: ${o.text} (${o.voteCount})`).join(', '));
    
    // Check user match
    const userId = user._id.toString();
    console.log('\nUser ID:', userId);
    console.log('Has User Voted:', poll.poll.votedUsers?.some(id => {
      const idStr = typeof id === 'object' ? id._id : id;
      return idStr === userId;
    }));
    
  } catch (err) {
    if (err.response) {
      console.error('Error:', err.response.status, err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  } finally {
    process.exit(0);
  }
}

testVoting();