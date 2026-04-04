const MentorWallet = require('../models/MentorWallet');

const updateWalletOnEarning = async (earning) => {
  try {
    let wallet = await MentorWallet.findOne({ mentor: earning.mentor });
    
    if (!wallet) {
      wallet = new MentorWallet({ mentor: earning.mentor });
    }
    
    wallet.availableBalance += earning.amount;
    wallet.totalEarned += earning.amount;
    await wallet.save();
    
    return wallet;
  } catch (error) {
    console.error('Wallet update error:', error);
    throw error;
  }
};

const updateWalletOnPayout = async (payout, action = 'deduct') => {
  try {
    const wallet = await MentorWallet.findOne({ mentor: payout.mentor });
    
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    
    if (action === 'deduct') {
      wallet.pendingBalance -= payout.amount;
      wallet.totalPayout += payout.amount;
      wallet.lastPayoutAt = new Date();
    } else if (action === 'refund') {
      wallet.pendingBalance -= payout.amount;
      wallet.availableBalance += payout.amount;
    }
    
    await wallet.save();
    return wallet;
  } catch (error) {
    console.error('Payout wallet update error:', error);
    throw error;
  }
};

module.exports = {
  updateWalletOnEarning,
  updateWalletOnPayout
};