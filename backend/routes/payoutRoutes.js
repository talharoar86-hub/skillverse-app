const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');
const { requireMentor } = require('../middleware/requireMentor');
const Payout = require('../models/Payout');
const MentorWallet = require('../models/MentorWallet');
const Earning = require('../models/Earning');

const getStartDate = (period) => {
  const startDate = new Date();
  if (period === '7d') startDate.setDate(startDate.getDate() - 7);
  else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
  else if (period === '90d') startDate.setDate(startDate.getDate() - 90);
  else startDate = new Date(0);
  return startDate;
};

const getPreviousPeriodStartDate = (period) => {
  const startDate = new Date();
  let days;
  switch(period) {
    case '7d': days = 14; break;
    case '30d': days = 60; break;
    case '90d': days = 180; break;
    default: days = 365;
  }
  startDate.setDate(startDate.getDate() - days);
  return startDate;
};

router.get('/wallet', protect, requireMentor, async (req, res) => {
  try {
    console.log('[payoutRoutes] Wallet request - User:', req.user?._id);
    console.log('[payoutRoutes] User is mentor:', req.user?.isMentor, 'mentorStatus:', req.user?.mentorStatus);
    
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = new mongoose.Types.ObjectId(req.user._id);
    let wallet = await MentorWallet.findOne({ mentor: userId });
    
    if (!wallet) {
      console.log('[payoutRoutes] Creating new wallet for mentor:', userId);
      wallet = new MentorWallet({ mentor: userId });
      await wallet.save();
    }
    
    console.log('[payoutRoutes] Wallet found:', wallet._id);
    res.json(wallet);
  } catch (error) {
    console.error('[payoutRoutes] Wallet Error:', error.message, error.stack);
    res.status(500).json({ message: 'Error fetching wallet', error: error.message });
  }
});

router.put('/wallet/settings', protect, requireMentor, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const { payoutSettings, payoutPreferences } = req.body;
    
    let wallet = await MentorWallet.findOne({ mentor: userId });
    
    if (!wallet) {
      wallet = new MentorWallet({ mentor: userId });
    }
    
    if (payoutSettings) {
      wallet.payoutSettings = { ...wallet.payoutSettings, ...payoutSettings };
    }
    if (payoutPreferences) {
      wallet.payoutPreferences = { ...wallet.payoutPreferences, ...payoutPreferences };
    }
    
    await wallet.save();
    
    res.json(wallet);
  } catch (error) {
    console.error('Update Wallet Settings Error:', error);
    res.status(500).json({ message: 'Error updating wallet settings' });
  }
});

router.get('/earnings/analytics', protect, requireMentor, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const userId = new mongoose.Types.ObjectId(req.user._id);
    
    const startDate = getStartDate(period);
    const prevStartDate = getPreviousPeriodStartDate(period);
    
    const prevPeriodDays = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const prevEndDate = new Date(startDate);
    prevEndDate.setDate(prevEndDate.getDate() - 1);
    
    const [currentPeriodEarnings, previousPeriodEarnings, wallet, bySource, byDay, topCourses, recentStudents] = await Promise.all([
      Earning.aggregate([
        { $match: { mentor: userId, createdAt: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 }, avg: { $avg: '$amount' } } }
      ]),
      Earning.aggregate([
        { $match: { mentor: userId, createdAt: { $gte: prevStartDate, $lt: startDate } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      MentorWallet.findOne({ mentor: userId }),
      Earning.aggregate([
        { $match: { mentor: userId, createdAt: { $gte: startDate } } },
        { $group: { _id: '$source', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Earning.aggregate([
        { $match: { mentor: userId, createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            amount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $project: { date: '$_id', amount: 1, count: 1, _id: 0 } }
      ]),
      Earning.aggregate([
        { $match: { mentor: userId, source: 'course', createdAt: { $gte: startDate } } },
        { $group: { _id: '$courseTitle', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 5 },
        { $project: { courseTitle: '$_id', total: 1, count: 1, _id: 0 } }
      ]),
      Earning.aggregate([
        { $match: { mentor: userId, createdAt: { $gte: startDate } } },
        { $group: { _id: '$studentId', studentName: { $first: '$studentName' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 5 },
        { $project: { studentId: '$_id', studentName: 1, total: 1, count: 1, _id: 0 } }
      ])
    ]);
    
    const currentTotal = currentPeriodEarnings[0]?.total || 0;
    const currentCount = currentPeriodEarnings[0]?.count || 0;
    const currentAvg = currentPeriodEarnings[0]?.avg || 0;
    const prevTotal = previousPeriodEarnings[0]?.total || 0;
    
    const growthPercent = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal * 100).toFixed(1) : 0;
    
    const sourceBreakdown = {
      course: { total: 0, count: 0, percent: 0 },
      mentorship: { total: 0, count: 0, percent: 0 }
    };
    
    bySource.forEach(s => {
      if (sourceBreakdown[s._id]) {
        sourceBreakdown[s._id] = { 
          total: s.total, 
          count: s.count,
          percent: currentTotal > 0 ? Math.round((s.total / currentTotal) * 100) : 0
        };
      }
    });
    
    const trend = byDay.map(d => ({
      date: d.date,
      amount: d.amount,
      count: d.count
    }));
    
    res.json({
      summary: {
        totalEarnings: currentTotal,
        transactionCount: currentCount,
        avgPerTransaction: Math.round(currentAvg * 100) / 100,
        growthPercent: parseFloat(growthPercent),
        previousPeriodEarnings: prevTotal,
        availableBalance: wallet?.availableBalance || 0,
        pendingBalance: wallet?.pendingBalance || 0,
        totalPayout: wallet?.totalPayout || 0
      },
      sourceBreakdown,
      trend,
      topCourses,
      topStudents: recentStudents.filter(s => s.studentId),
      period
    });
  } catch (error) {
    console.error('Earnings Analytics Error:', error);
    res.status(500).json({ message: 'Error fetching earnings analytics' });
  }
});

router.get('/payouts', protect, requireMentor, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const userId = new mongoose.Types.ObjectId(req.user._id);
    
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    
    const filter = { mentor: userId };
    if (status) filter.status = status;
    
    const [payouts, total] = await Promise.all([
      Payout.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Payout.countDocuments(filter)
    ]);
    
    res.json({
      payouts,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      hasMore: skip + payouts.length < total
    });
  } catch (error) {
    console.error('Get Payouts Error:', error);
    res.status(500).json({ message: 'Error fetching payouts' });
  }
});

router.post('/payout/request', protect, requireMentor, async (req, res) => {
  try {
    const { amount, method } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user._id);
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    
    const wallet = await MentorWallet.findOne({ mentor: userId });
    
    if (!wallet || wallet.availableBalance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    
    if (amount < (wallet.payoutPreferences?.minPayoutAmount || 50)) {
      return res.status(400).json({ message: `Minimum payout amount is $${wallet.payoutPreferences?.minPayoutAmount || 50}` });
    }
    
    const eligibleEarnings = await Earning.find({
      mentor: userId,
      status: 'available'
    }).sort({ createdAt: 1 });
    
    let remainingAmount = amount;
    const transactionIds = [];
    
    for (const earning of eligibleEarnings) {
      if (remainingAmount <= 0) break;
      if (earning.amount <= remainingAmount) {
        transactionIds.push(earning._id);
        remainingAmount -= earning.amount;
      }
    }
    
    if (remainingAmount > 0) {
      return res.status(400).json({ message: 'Could not find eligible transactions' });
    }
    
    const payout = new Payout({
      mentor: userId,
      amount,
      currency: wallet.currency || 'USD',
      method: method || wallet.payoutSettings?.method || 'bank_transfer',
      methodDetails: wallet.payoutSettings || {},
      transactions: transactionIds
    });
    
    await payout.save();
    
    await Earning.updateMany(
      { _id: { $in: transactionIds } },
      { status: 'payout' }
    );
    
    wallet.availableBalance -= amount;
    wallet.pendingBalance += amount;
    await wallet.save();
    
    res.status(201).json(payout);
  } catch (error) {
    console.error('Request Payout Error:', error);
    res.status(500).json({ message: 'Error requesting payout' });
  }
});

router.get('/payouts/export', protect, requireMentor, async (req, res) => {
  try {
    const { period = '30d', type = 'earnings' } = req.query;
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const startDate = getStartDate(period);
    
    if (type === 'earnings') {
      const earnings = await Earning.find({
        mentor: userId,
        createdAt: { $gte: startDate }
      }).sort({ createdAt: -1 });
      
      const csvData = [
        ['Date', 'Source', 'Student', 'Course/Mentorship', 'Amount', 'Status'].join(','),
        ...earnings.map(e => [
          new Date(e.createdAt).toISOString(),
          e.source,
          e.studentName || '',
          e.courseTitle || (e.source === 'mentorship' ? 'Mentorship Session' : ''),
          e.amount.toFixed(2),
          e.status
        ].join(','))
      ];
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=earnings_${period}.csv`);
      res.send(csvData.join('\n'));
    } else {
      const payouts = await Payout.find({
        mentor: userId,
        createdAt: { $gte: startDate }
      }).sort({ createdAt: -1 });
      
      const csvData = [
        ['Date', 'Amount', 'Method', 'Status', 'Processed At'].join(','),
        ...payouts.map(p => [
          new Date(p.createdAt).toISOString(),
          p.amount.toFixed(2),
          p.method,
          p.status,
          p.processedAt ? new Date(p.processedAt).toISOString() : ''
        ].join(','))
      ];
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=payouts_${period}.csv`);
      res.send(csvData.join('\n'));
    }
  } catch (error) {
    console.error('Export Error:', error);
    res.status(500).json({ message: 'Error exporting data' });
  }
});

module.exports = router;