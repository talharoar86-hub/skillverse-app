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
    }
  }],
  timezone: { type: String, default: 'UTC' },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

ScheduleSchema.index({ mentorId: 1, dayOfWeek: 1 });

module.exports = mongoose.model('Schedule', ScheduleSchema);
