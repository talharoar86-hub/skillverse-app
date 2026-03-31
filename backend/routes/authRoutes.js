const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  refreshUserToken,
  logoutUser,
  getMe,
  forgotPassword,
  resetPassword,
  googleCallback
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const passport = require('passport');

router.post('/signup', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refreshUserToken);
router.post('/logout', logoutUser);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.get('/me', protect, getMe);

// Google OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login' }), googleCallback);

module.exports = router;
