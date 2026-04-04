const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6
  },
  slots: [{
    startTime: String,
    endTime: String,
    isBooked: { type: Boolean, default: false },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['available', 'booked', 'completed', 'cancelled'],
      default: 'available'
    },
    sessionType: {
      type: String,
      enum: ['one-on-one', 'group'],
      default: 'one-on-one'
    },
    maxParticipants: { type: Number, default: 1 },
    currentParticipants: { type: Number, default: 0 },
    priceOverride: { type: Number, default: null },
    bufferTime: { type: Number, default: 0 },
    breakTime: { type: Number, default: 0 },
    recurringTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScheduleTemplate' },
    googleEventId: String,
    outlookEventId: String
  }],
  timezone: { type: String, default: 'UTC' },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  blockedDates: [{
    date: Date,
    reason: String,
    isRecurring: { type: Boolean, default: false }
  }],
  templates: [{
    name: String,
    days: [Number],
    startTime: String,
    endTime: String,
    sessionType: { type: String, enum: ['one-on-one', 'group'], default: 'one-on-one' },
    maxParticipants: { type: Number, default: 1 },
    bufferTime: { type: Number, default: 0 },
    breakTime: { type: Number, default: 0 },
    priceOverride: { type: Number, default: null },
    duration: { type: Number, default: 60 }
  }],
  calendarSync: {
    google: {
      enabled: { type: Boolean, default: false },
      accessToken: String,
      refreshToken: String,
      calendarId: String
    },
    outlook: {
      enabled: { type: Boolean, default: false },
      accessToken: String,
      refreshToken: String,
      calendarId: String
    }
  }
});

ScheduleSchema.index({ mentorId: 1, dayOfWeek: 1 });

module.exports = mongoose.model('Schedule', ScheduleSchema);
