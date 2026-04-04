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
    const { schedules, timezone, blockedDates, templates, calendarSync } = req.body;
    const mentorId = req.user._id;

    if (!schedules || !Array.isArray(schedules)) {
      return res.status(400).json({ message: 'Schedules array is required' });
    }

    const results = [];
    for (const sched of schedules) {
      const { dayOfWeek, slots } = sched;
      if (dayOfWeek === undefined || !slots) continue;

      const updateData = {
        mentorId,
        dayOfWeek,
        slots,
        timezone: timezone || 'UTC',
        updatedAt: Date.now()
      };

      if (blockedDates !== undefined) updateData.blockedDates = blockedDates;
      if (templates !== undefined) updateData.templates = templates;
      if (calendarSync !== undefined) updateData.calendarSync = calendarSync;

      const updated = await Schedule.findOneAndUpdate(
        { mentorId, dayOfWeek },
        updateData,
        { upsert: true, new: true }
      );
      results.push(updated);
    }

    if (blockedDates !== undefined || templates !== undefined || calendarSync !== undefined) {
      const anySchedule = await Schedule.findOne({ mentorId });
      if (anySchedule) {
        if (blockedDates !== undefined) anySchedule.blockedDates = blockedDates;
        if (templates !== undefined) anySchedule.templates = templates;
        if (calendarSync !== undefined) anySchedule.calendarSync = calendarSync;
        await anySchedule.save();
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Update Schedule Error:', error);
    res.status(500).json({ message: 'Error updating schedule' });
  }
});

// @desc    Block dates for holidays/vacations
// @route   PUT /api/schedule/:mentorId/block-dates
router.put('/:mentorId/block-dates', protect, requireMentor, async (req, res) => {
  try {
    const { blockedDates } = req.body;
    const mentorId = req.user._id;

    await Schedule.updateMany(
      { mentorId },
      { blockedDates, updatedAt: Date.now() }
    );

    res.json({ message: 'Blocked dates updated', blockedDates });
  } catch (error) {
    console.error('Block Dates Error:', error);
    res.status(500).json({ message: 'Error blocking dates' });
  }
});

// @desc    Save schedule template
// @route   POST /api/schedule/:mentorId/template
router.post('/:mentorId/template', protect, requireMentor, async (req, res) => {
  try {
    const { name, days, startTime, duration, sessionType, maxParticipants, bufferTime, breakTime, priceOverride } = req.body;
    const mentorId = req.user._id;

    const schedule = await Schedule.findOne({ mentorId });
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    const newTemplate = {
      name,
      days,
      startTime,
      duration,
      sessionType: sessionType || 'one-on-one',
      maxParticipants: maxParticipants || 1,
      bufferTime: bufferTime || 0,
      breakTime: breakTime || 0,
      priceOverride
    };

    schedule.templates = schedule.templates || [];
    schedule.templates.push(newTemplate);
    await schedule.save();

    res.json({ message: 'Template created', template: newTemplate });
  } catch (error) {
    console.error('Save Template Error:', error);
    res.status(500).json({ message: 'Error saving template' });
  }
});

// @desc    Get schedule templates
// @route   GET /api/schedule/:mentorId/templates
router.get('/:mentorId/templates', protect, async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ mentorId: req.params.mentorId });
    res.json(schedule?.templates || []);
  } catch (error) {
    console.error('Get Templates Error:', error);
    res.status(500).json({ message: 'Error fetching templates' });
  }
});

// @desc    Delete schedule template
// @route   DELETE /api/schedule/:mentorId/template/:templateId
router.delete('/:mentorId/template/:templateId', protect, requireMentor, async (req, res) => {
  try {
    const mentorId = req.user._id;
    const templateId = req.params.templateId;

    const schedule = await Schedule.findOne({ mentorId });
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    schedule.templates = schedule.templates.filter(t => t._id?.toString() !== templateId);
    await schedule.save();

    res.json({ message: 'Template deleted' });
  } catch (error) {
    console.error('Delete Template Error:', error);
    res.status(500).json({ message: 'Error deleting template' });
  }
});

// @desc    Apply template to days
// @route   POST /api/schedule/:mentorId/apply-template
router.post('/:mentorId/apply-template', protect, requireMentor, async (req, res) => {
  try {
    const { templateId, days } = req.body;
    const mentorId = req.user._id;

    const schedule = await Schedule.findOne({ mentorId });
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    const template = schedule.templates?.find(t => t._id?.toString() === templateId);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    for (const dayOfWeek of days) {
      const [hours, minutes] = template.startTime.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + (template.duration || 60);
      const endHours = Math.floor(totalMinutes / 60);
      const endMinutes = totalMinutes % 60;
      const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

      const existingSchedule = await Schedule.findOne({ mentorId, dayOfWeek });
      if (existingSchedule) {
        existingSchedule.slots.push({
          startTime: template.startTime,
          endTime,
          duration: template.duration || 60,
          sessionType: template.sessionType || 'one-on-one',
          maxParticipants: template.maxParticipants || 1,
          bufferTime: template.bufferTime || 0,
          breakTime: template.breakTime || 0,
          priceOverride: template.priceOverride,
          status: 'available',
          isBooked: false
        });
        await existingSchedule.save();
      } else {
        await Schedule.create({
          mentorId,
          dayOfWeek,
          slots: [{
            startTime: template.startTime,
            endTime,
            duration: template.duration || 60,
            sessionType: template.sessionType || 'one-on-one',
            maxParticipants: template.maxParticipants || 1,
            bufferTime: template.bufferTime || 0,
            breakTime: template.breakTime || 0,
            priceOverride: template.priceOverride,
            status: 'available',
            isBooked: false
          }],
          timezone: schedule.timezone || 'UTC'
        });
      }
    }

    res.json({ message: 'Template applied successfully' });
  } catch (error) {
    console.error('Apply Template Error:', error);
    res.status(500).json({ message: 'Error applying template' });
  }
});

// @desc    Copy slots from one day to multiple days
// @route   POST /api/schedule/:mentorId/copy-slots
router.post('/:mentorId/copy-slots', protect, requireMentor, async (req, res) => {
  try {
    const { fromDay, toDays } = req.body;
    const mentorId = req.user._id;

    const sourceSchedule = await Schedule.findOne({ mentorId, dayOfWeek: fromDay });
    if (!sourceSchedule) {
      return res.status(404).json({ message: 'Source day schedule not found' });
    }

    for (const dayOfWeek of toDays) {
      const existingSchedule = await Schedule.findOne({ mentorId, dayOfWeek });
      
      const newSlots = sourceSchedule.slots.map(slot => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: slot.duration || 60,
        sessionType: slot.sessionType || 'one-on-one',
        maxParticipants: slot.maxParticipants || 1,
        bufferTime: slot.bufferTime || 0,
        breakTime: slot.breakTime || 0,
        priceOverride: slot.priceOverride,
        status: 'available',
        isBooked: false
      }));

      if (existingSchedule) {
        existingSchedule.slots.push(...newSlots);
        existingSchedule.updatedAt = Date.now();
        await existingSchedule.save();
      } else {
        await Schedule.create({
          mentorId,
          dayOfWeek,
          slots: newSlots,
          timezone: sourceSchedule.timezone || 'UTC'
        });
      }
    }

    res.json({ message: 'Slots copied successfully' });
  } catch (error) {
    console.error('Copy Slots Error:', error);
    res.status(500).json({ message: 'Error copying slots' });
  }
});

// @desc    Connect calendar (Google/Outlook)
// @route   POST /api/schedule/:mentorId/connect-calendar
router.post('/:mentorId/connect-calendar', protect, requireMentor, async (req, res) => {
  try {
    const { provider, accessToken, refreshToken } = req.body;
    const mentorId = req.user._id;

    const schedule = await Schedule.findOne({ mentorId });
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    schedule.calendarSync = schedule.calendarSync || { google: {}, outlook: {} };

    if (provider === 'google') {
      schedule.calendarSync.google = {
        enabled: true,
        accessToken,
        refreshToken,
        calendarId: 'primary'
      };
    } else if (provider === 'outlook') {
      schedule.calendarSync.outlook = {
        enabled: true,
        accessToken,
        refreshToken,
        calendarId: 'primary'
      };
    }

    await schedule.save();
    res.json({ message: 'Calendar connected successfully' });
  } catch (error) {
    console.error('Connect Calendar Error:', error);
    res.status(500).json({ message: 'Error connecting calendar' });
  }
});

// @desc    Disconnect calendar
// @route   DELETE /api/schedule/:mentorId/disconnect-calendar
router.delete('/:mentorId/disconnect-calendar', protect, requireMentor, async (req, res) => {
  try {
    const { provider } = req.query;
    const mentorId = req.user._id;

    const schedule = await Schedule.findOne({ mentorId });
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    if (provider === 'google' && schedule.calendarSync?.google) {
      schedule.calendarSync.google = { enabled: false };
    } else if (provider === 'outlook' && schedule.calendarSync?.outlook) {
      schedule.calendarSync.outlook = { enabled: false };
    }

    await schedule.save();
    res.json({ message: 'Calendar disconnected successfully' });
  } catch (error) {
    console.error('Disconnect Calendar Error:', error);
    res.status(500).json({ message: 'Error disconnecting calendar' });
  }
});

// @desc    Sync calendar
// @route   POST /api/schedule/:mentorId/sync-calendar
router.post('/:mentorId/sync-calendar', protect, requireMentor, async (req, res) => {
  try {
    const mentorId = req.user._id;
    const schedule = await Schedule.findOne({ mentorId });

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Placeholder for calendar sync logic
    // In production, implement Google Calendar API and Microsoft Graph API calls
    
    res.json({ message: 'Calendar synced successfully', syncedSlots: 0 });
  } catch (error) {
    console.error('Sync Calendar Error:', error);
    res.status(500).json({ message: 'Error syncing calendar' });
  }
});

// @desc    Book a time slot (student)
// @route   POST /api/schedule/book
router.post('/book', protect, async (req, res) => {
  try {
    const { mentorId, dayOfWeek, slotIndex, sessionType } = req.body;

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

    const isGroupSession = slot.sessionType === 'group';
    const maxParticipants = slot.maxParticipants || 1;
    const currentParticipants = slot.currentParticipants || 0;

    if (isGroupSession && currentParticipants >= maxParticipants) {
      return res.status(400).json({ message: 'Group session is full' });
    }

    slot.isBooked = true;
    slot.bookedBy = req.user._id;
    slot.status = 'booked';
    
    if (isGroupSession) {
      slot.currentParticipants = (slot.currentParticipants || 0) + 1;
    }
    
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

    if (slot.sessionType === 'group' && slot.currentParticipants > 1) {
      slot.currentParticipants -= 1;
      slot.bookedBy = undefined;
      slot.status = 'available';
    } else {
      slot.isBooked = false;
      slot.bookedBy = undefined;
      slot.status = 'available';
      slot.currentParticipants = 0;
    }
    
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

// @desc    Google Calendar OAuth callback
// @route   GET /api/schedule/calendar/callback
router.get('/calendar/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/mentor/schedule?calendar=error`);
    }

    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_CALENDAR_CALLBACK_URL;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      console.error('Google token error:', tokens.error);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/mentor/schedule?calendar=error`);
    }

    const frontendUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/mentor/schedule?calendar=google&accessToken=${tokens.access_token}&refreshToken=${tokens.refresh_token}`;
    res.redirect(frontendUrl);
  } catch (error) {
    console.error('Google Calendar callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/mentor/schedule?calendar=error`);
  }
});

// @desc    Outlook Calendar OAuth callback
// @route   GET /api/schedule/outlook/callback
router.get('/outlook/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/mentor/schedule?calendar=error`);
    }

    const clientId = process.env.OUTLOOK_CLIENT_ID;
    const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
    const redirectUri = process.env.OUTLOOK_CALLBACK_URL;

    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      console.error('Outlook token error:', tokens.error);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/mentor/schedule?calendar=error`);
    }

    const frontendUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/mentor/schedule?calendar=outlook&accessToken=${tokens.access_token}&refreshToken=${tokens.refresh_token}`;
    res.redirect(frontendUrl);
  } catch (error) {
    console.error('Outlook callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/mentor/schedule?calendar=error`);
  }
});

module.exports = router;
