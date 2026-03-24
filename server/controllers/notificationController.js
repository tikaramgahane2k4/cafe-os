const Notification = require('../models/Notification');
const {
  markAllNotificationsRead,
  markNotificationRead,
  serializeNotification,
  syncSystemNotifications,
} = require('../services/notificationService');

async function getNotifications(req, res) {
  try {
    await syncSystemNotifications();

    const { page = 1, limit = 20, type = 'ALL', read = 'ALL' } = req.query;
    const query = {};

    if (type && type !== 'ALL') query.type = type;
    if (read === 'READ') query.isRead = true;
    if (read === 'UNREAD') query.isRead = false;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 20);
    const skip = (pageNum - 1) * limitNum;

    const [total, unread, notifications] = await Promise.all([
      Notification.countDocuments(query),
      Notification.countDocuments({ ...query, isRead: false }),
      Notification.find(query).sort({ timestamp: -1 }).skip(skip).limit(limitNum).lean(),
    ]);

    res.json({
      success: true,
      data: notifications.map(serializeNotification),
      stats: {
        total,
        unread,
        page: pageNum,
        pages: Math.max(1, Math.ceil(total / limitNum)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function readNotification(req, res) {
  try {
    const notification = await markNotificationRead(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
    res.json({ success: true, data: serializeNotification(notification.toObject()) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function readAllNotifications(req, res) {
  try {
    await markAllNotificationsRead();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getNotifications, readNotification, readAllNotifications };
