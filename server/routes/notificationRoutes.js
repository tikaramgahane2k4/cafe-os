const express = require('express');
const router = express.Router();
const {
  getNotifications,
  readNotification,
  readAllNotifications,
} = require('../controllers/notificationController');

router.get('/', getNotifications);
router.patch('/read-all', readAllNotifications);
router.patch('/:id/read', readNotification);

module.exports = router;
