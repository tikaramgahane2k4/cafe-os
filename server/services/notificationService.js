const Notification = require('../models/Notification');
const Tenant = require('../models/Tenant');
const Invoice = require('../models/Invoice');

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatMoney(value = 0) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function autoDismissAtForType(type, baseDate = new Date()) {
  if (!['info', 'success'].includes(type)) return null;
  return addDays(baseDate, 7);
}

async function upsertNotification({
  message,
  type = 'info',
  timestamp = new Date(),
  sourceKey = '',
  eventType = 'system',
  tenantId = null,
  tenantName = '',
  link = '/admin/notifications',
  meta = {},
  reopenOnUpdate = false,
  refreshTimestamp = true,
}) {
  if (!sourceKey) {
    return Notification.create({
      message,
      type,
      timestamp,
      isRead: false,
      readAt: null,
      eventType,
      tenantId,
      tenantName,
      link,
      meta,
      autoDismissAt: null,
    });
  }

  const existing = await Notification.findOne({ sourceKey });
  if (!existing) {
    return Notification.create({
      message,
      type,
      timestamp,
      isRead: false,
      readAt: null,
      sourceKey,
      eventType,
      tenantId,
      tenantName,
      link,
      meta,
      autoDismissAt: null,
    });
  }

  existing.message = message;
  existing.type = type;
  existing.eventType = eventType;
  existing.tenantId = tenantId;
  existing.tenantName = tenantName;
  existing.link = link;
  existing.meta = meta;

  if (refreshTimestamp) existing.timestamp = timestamp;

  if (reopenOnUpdate) {
    existing.isRead = false;
    existing.readAt = null;
    existing.autoDismissAt = null;
  }

  await existing.save();
  return existing;
}

async function createNotification(payload) {
  return upsertNotification(payload);
}

async function pruneAutoDismissedNotifications() {
  await Notification.deleteMany({
    isRead: true,
    autoDismissAt: { $ne: null, $lte: new Date() },
  });
}

async function syncSubscriptionNotifications() {
  const now = new Date();
  const expiryCutoff = addDays(now, 7);
  const tenants = await Tenant.find({
    status: 'Active',
    planExpiryDate: { $gte: now, $lte: expiryCutoff },
  }).lean();

  for (const tenant of tenants) {
    const daysRemaining = Math.max(
      0,
      Math.ceil((new Date(tenant.planExpiryDate).getTime() - now.getTime()) / 86400000)
    );

    await upsertNotification({
      sourceKey: `subscription-expiring:${tenant._id}:${new Date(tenant.planExpiryDate).toISOString().slice(0, 10)}`,
      eventType: 'subscription_expiring',
      type: daysRemaining <= 2 ? 'error' : 'warning',
      message: `${tenant.cafeName} subscription expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.`,
      tenantId: tenant._id,
      tenantName: tenant.cafeName,
      link: '/admin/billing',
      meta: {
        daysRemaining,
        planName: tenant.subscriptionPlan,
        planExpiryDate: tenant.planExpiryDate,
      },
      refreshTimestamp: false,
    });
  }
}

async function syncFailedPaymentNotifications() {
  const failedInvoices = await Invoice.find({ status: { $in: ['Failed', 'Overdue'] } })
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean();

  for (const invoice of failedInvoices) {
    await upsertNotification({
      sourceKey: `payment-failed:${invoice._id}`,
      eventType: 'payment_failed',
      type: 'error',
      message: `${invoice.tenantName} payment failed for ${invoice.invoiceNumber} (${formatMoney(invoice.amount)}).`,
      tenantId: invoice.tenantId,
      tenantName: invoice.tenantName,
      link: '/admin/billing',
      meta: {
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        status: invoice.status,
      },
      refreshTimestamp: false,
    });
  }
}

async function syncSystemNotifications() {
  await pruneAutoDismissedNotifications();
  await Promise.all([syncSubscriptionNotifications(), syncFailedPaymentNotifications()]);
}

async function markNotificationRead(id) {
  const notification = await Notification.findById(id);
  if (!notification) return null;

  notification.isRead = true;
  notification.readAt = new Date();
  if (['info', 'success'].includes(notification.type)) {
    notification.autoDismissAt = autoDismissAtForType(notification.type, notification.readAt);
  }

  await notification.save();
  return notification;
}

async function markAllNotificationsRead() {
  const now = new Date();

  await Notification.updateMany(
    { isRead: false, type: { $in: ['info', 'success'] } },
    {
      $set: {
        isRead: true,
        readAt: now,
        autoDismissAt: autoDismissAtForType('info', now),
      },
    }
  );

  await Notification.updateMany(
    { isRead: false, type: { $in: ['warning', 'error'] } },
    {
      $set: {
        isRead: true,
        readAt: now,
      },
    }
  );
}

function serializeNotification(notification) {
  return {
    id: notification._id,
    message: notification.message,
    type: notification.type,
    timestamp: notification.timestamp,
    isRead: notification.isRead,
    link: notification.link,
    eventType: notification.eventType,
    tenantId: notification.tenantId,
    tenantName: notification.tenantName,
    meta: notification.meta || {},
  };
}

module.exports = {
  autoDismissAtForType,
  createNotification,
  markAllNotificationsRead,
  markNotificationRead,
  pruneAutoDismissedNotifications,
  serializeNotification,
  syncSystemNotifications,
  upsertNotification,
};
