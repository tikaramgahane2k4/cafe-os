const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    message:      { type: String, required: true, trim: true },
    type:         { type: String, enum: ['info', 'warning', 'success', 'error'], default: 'info' },
    timestamp:    { type: Date, default: Date.now, index: true },
    isRead:       { type: Boolean, default: false, index: true },
    readAt:       { type: Date, default: null },
    eventType:    { type: String, default: 'system' },
    sourceKey:    { type: String, unique: true, sparse: true },
    tenantId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null },
    tenantName:   { type: String, default: '' },
    link:         { type: String, default: '/admin/notifications' },
    meta:         { type: Object, default: {} },
    autoDismissAt:{ type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ isRead: 1, timestamp: -1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
