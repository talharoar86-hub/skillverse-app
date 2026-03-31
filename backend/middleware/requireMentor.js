const requireMentor = (req, res, next) => {
  if (!req.user || req.user.mentorStatus !== 'approved') {
    return res.status(403).json({ message: 'Mentor access required' });
  }
  next();
};

module.exports = { requireMentor };
