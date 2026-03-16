const ActivityLog = require('../models/ActivityLog');

// Normalize a DB log to the canonical frontend shape
function normalize(log) {
  const obj = log.toObject ? log.toObject() : log;
  return {
    ...obj,
    action:      obj.action      || obj.actionType   || '',
    target:      obj.target      || obj.targetEntity || '',
    performedBy: obj.performedBy || obj.adminUser    || '',
    severity:    obj.severity    || 'INFO',
    details:     obj.details     || obj.description  || '',
    beforeValue: obj.beforeValue || '',
    afterValue:  obj.afterValue  || '',
    ipAddress:   obj.ipAddress   || '',
    device:      obj.device      || '',
  };
}

// GET /api/admin/logs
const getLogs = async (req, res) => {
  try {
    const {
      limit    = 200,          // fetch a large batch; client handles pagination
      page     = 1,
      action   = '',
      severity = '',
      user     = '',
      dateFrom = '',
      dateTo   = '',
    } = req.query;

    const query = {};

    if (action && action !== 'ALL') {
      query.$or = [
        { action:     action },
        { actionType: action },
      ];
    }
    if (severity && severity !== 'ALL') {
      query.severity = severity;
    }
    if (user && user !== 'ALL') {
      query.$or = [
        ...(query.$or || []),
        { performedBy: user },
        { adminUser:   user },
      ];
    }
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo)   query.createdAt.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      ActivityLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      ActivityLog.countDocuments(query),
    ]);

    res.json({ success: true, data: logs.map(normalize), total, page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getLogs };
