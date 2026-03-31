const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      recipient: req.user.id, 
      isRead: false 
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user.id });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper for other controllers to create notifications
exports.createNotification = async (io, data) => {
  try {
    // Don't notify if acting on own content (except for system/mentor types)
    const socialTypes = ['like', 'comment', 'reply', 'follow'];
    if (socialTypes.includes(data.type) && data.recipient.toString() === data.sender.toString()) return;

    const notification = new Notification(data);
    await notification.save();

    // Emit real-time via socket to the recipient's specific room
    if (io) {
      io.to(data.recipient.toString()).emit('notification_received', notification);
    }
    
    return notification;
  } catch (err) {
    console.error('Notification Creation Error:', err);
  }
};
