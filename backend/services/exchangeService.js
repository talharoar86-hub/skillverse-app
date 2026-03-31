const ExchangeRequest = require('../models/ExchangeRequest');
const User = require('../models/User');

// Get skill matches
async function getMatches(userId) {
  // Find exchange requests where user is involved and status is matched/accepted
  const requests = await ExchangeRequest.find({ 
    $or: [
      { sender: userId, status: 'accepted' },
      { receiver: userId, status: 'accepted' }
    ]
  }).populate('sender receiver', '-password -email');
   
  // Format as matches
  return requests.map(request => {
    const otherUser = request.sender._id.equals(userId) ? request.receiver : request.sender;
    return {
      _id: otherUser._id,
      name: otherUser.name,
      avatarUrl: otherUser.avatarUrl,
      experienceLevel: otherUser.experienceLevel,
      give: request.sender._id.equals(userId) ? request.offeredSkill : request.requestedSkill,
      get: request.sender._id.equals(userId) ? request.requestedSkill : request.offeredSkill,
      match: Math.floor(Math.random() * 50 + 50) // Random match percentage for demo
    };
  });
}

// Get incoming exchange requests
async function getIncomingRequests(userId) {
  return await ExchangeRequest.find({ 
    receiver: userId, 
    status: 'pending' 
  }).populate('sender', '-password -email');
}

// Get exchange stats
async function getStats(userId) {
  const [active, completed, pending] = await Promise.all([
    ExchangeRequest.countDocuments({ 
      $or: [{ sender: userId }, { receiver: userId }],
      status: 'accepted'
    }),
    ExchangeRequest.countDocuments({ 
      $or: [{ sender: userId }, { receiver: userId }],
      status: 'completed'
    }),
    ExchangeRequest.countDocuments({ 
      $or: [{ sender: userId }, { receiver: userId }],
      status: 'pending'
    })
  ]);
   
  return {
    active,
    completed,
    pending
  };
}

module.exports = {
  getMatches,
  getIncomingRequests,
  getStats
};