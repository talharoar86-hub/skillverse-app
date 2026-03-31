const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const { protect } = require('../middleware/auth');
const { requireMentor } = require('../middleware/requireMentor');
const { createNotification } = require('../controllers/notificationController');

// @desc    Get mentor's weekly schedule
// @route   GET /api/schedule/:mentorId
router.get('/:mentorId', protect, async (req, res) => {
  try {
    const schedules = await Schedule.find({ mentorId: req.params.mentorId })
      .populate('slots.bookedBy', 'name avatarUrl');

    res.json(schedules);
  } catch (error) {
    console.error('Get Schedule Error:', error);
    res.status(500).json({ message: 'Error fetching schedule' });
  }
});

// @desc    Set/update own schedule (mentor only)
// @route   PUT /api/schedule
router.put('/', protect, requireMentor, async (req, res) => {
  try {
    const { schedules, timezone } = req.body;
    const mentorId = req.user._id;

    if (!schedules || !Array.isArray(schedules)) {
      return res.status(400).json({ message: 'Schedules array is required' });
    }

    const results = [];
    for (const sched of schedules) {
      const { dayOfWeek, slots } = sched;
      if (dayOfWeek === undefined || !slots) continue;

      const updated = await Schedule.findOneAndUpdate(
        { mentorId, dayOfWeek },
        {
          mentorId,
          dayOfWeek,
          slots,
          timezone: timezone || 'UTC',
          updatedAt: Date.now()
        },
        { upsert: true, new: true }
      );
      results.push(updated);
    }

    res.json(results);
  } catch (error) {
    console.error('Update Schedule Error:', error);
    res.status(500).json({ message: 'Error updating schedule' });
  }
});

// @desc    Book a time slot (student)
// @route   POST /api/schedule/book
router.post('/book', protect, async (req, res) => {
  try {
    const { mentorId, dayOfWeek, slotIndex } = req.body;

    if (mentorId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot book your own slot' });
    }

    const schedule = await Schedule.findOne({ mentorId, dayOfWeek });
    if (!schedule || !schedule.slots[slotIndex]) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    const slot = schedule.slots[slotIndex];
    if (slot.status !== 'available') {
      return res.status(400).json({ message: 'Slot is not available' });
    }

    slot.isBooked = true;
    slot.bookedBy = req.user._id;
    slot.status = 'booked';
    schedule.updatedAt = Date.now();

    await schedule.save();

    const io = req.app.get('io');
    await createNotification(io, {
      recipient: mentorId,
      sender: req.user._id,
      type: 'session_booked',
      content: `${req.user.name} booked a session with you`,
      metadata: { scheduleId: schedule._id, slotIndex }
    });

    res.json(schedule);
  } catch (error) {
    console.error('Book Slot Error:', error);
    res.status(500).json({ message: 'Error booking slot' });
  }
});

// @desc    Cancel a booking
// @route   PUT /api/schedule/:slotId/cancel
router.put('/:slotId/cancel', protect, async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ 'slots._id': req.params.slotId });
    if (!schedule) return res.status(404).json({ message: 'Slot not found' });

    const slot = schedule.slots.id(req.params.slotId);
    if (!slot) return res.status(404).json({ message: 'Slot not found' });

    const isOwner = schedule.mentorId.toString() === req.user._id.toString();
    const isBooker = slot.bookedBy && slot.bookedBy.toString() === req.user._id.toString();
    if (!isOwner && !isBooker) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const notifyUserId = isOwner ? slot.bookedBy : schedule.mentorId;

    slot.isBooked = false;
    slot.bookedBy = undefined;
    slot.status = 'available';
    schedule.updatedAt = Date.now();

    await schedule.save();

    if (notifyUserId) {
      const io = req.app.get('io');
      await createNotification(io, {
        recipient: notifyUserId,
        sender: req.user._id,
        type: 'session_cancelled',
        content: `A session booking has been cancelled`,
        metadata: { scheduleId: schedule._id, slotId: req.params.slotId }
      });
    }

    res.json(schedule);
  } catch (error) {
    console.error('Cancel Booking Error:', error);
    res.status(500).json({ message: 'Error cancelling booking' });
  }
});

module.exports = router;
