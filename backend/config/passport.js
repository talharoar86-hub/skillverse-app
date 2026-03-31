const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'mock',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find user by googleId
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        // If no user found by googleId, check by email
        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;

        if (email) {
          user = await User.findOne({ email });

          if (user) {
            // Link existing local account to Google
            user.googleId = profile.id;
            user.isEmailVerified = true;
            if (!user.avatarUrl && profile.photos && profile.photos.length > 0) {
              user.avatarUrl = profile.photos[0].value;
            }
            await user.save();
            return done(null, user);
          }
        }

        // Output completely new User object
        user = await User.create({
          googleId: profile.id,
          provider: 'google',
          name: profile.displayName,
          email: email,
          isEmailVerified: !!email,
          avatarUrl: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '',
        });

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// serialize and deserialize for sessions
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
