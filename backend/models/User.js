const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      return this.provider === 'local';
    },
    minlength: 6
  },
  googleId: String,
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  skills: [String],
  learningGoals: [String],
  experienceLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced / Expert'],
    default: 'Beginner'
  },
  goal: {
    type: String,
    enum: ['Learn', 'Mentor', 'Exchange'],
    default: 'Learn'
  },
  availability: {
    type: String,
    trim: true
  },
  bio: String,
  avatarUrl: String,
  socialLinks: {
    github: String,
    linkedin: String,
    twitter: String,
    website: String
  },
  onboardingComplete: {
    type: Boolean,
    default: false
  },
  isMentor: {
    type: Boolean,
    default: false
  },
  mentorStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none'
  },
  mentorProfile: {
    headline: String,
    bio: String,
    skills: [{ name: String, level: String }],
    experience: Number,
    teachingPreference: String,
    availability: String,
    pricing: Number,
    portfolioLinks: {
      github: String,
      linkedin: String,
      website: String
    },
    coverImageUrl: String,
    videoIntroUrl: String,
    videoIntroPublicId: String,
    certifications: [{
      name: String,
      issuer: String,
      year: Number,
      credentialUrl: String
    }],
    languages: [{
      name: String,
      proficiency: {
        type: String,
        enum: ['Basic', 'Conversational', 'Fluent', 'Native'],
        default: 'Fluent'
      }
    }],
    totalStudents: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0 },
    totalReviews: { type: Number, default: 0 },
    totalCourses: { type: Number, default: 0 },
    totalSessions: { type: Number, default: 0 },
    profileViews: { type: Number, default: 0 },
    lastProfileUpdate: Date
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  totalXP: {
    type: Number,
    default: 0
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

UserSchema.virtual('level').get(function() {
  return Math.floor((this.totalXP || 0) / 1000) + 1;
});

// High-performance Indexes for Discovery
UserSchema.index({ goal: 1 });
UserSchema.index({ onboardingComplete: 1 });
UserSchema.index({ skills: 1 }); // Multikey index for array lookups
UserSchema.index({ goal: 1, onboardingComplete: 1 }); // Compound index for filtering active groups
UserSchema.index({ mentorStatus: 1 });
UserSchema.index({ isMentor: 1, mentorStatus: 1 });
UserSchema.index({ 'mentorProfile.skills.name': 1 });
UserSchema.index({ isMentor: 1, 'mentorProfile.rating': -1 });

// Hash password before saving
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire (10 mins)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model('User', UserSchema);
