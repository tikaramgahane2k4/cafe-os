/**
 * tenantMiddleware — attaches tenantId to req from:
 *   1. Header:      X-Tenant-Id
 *   2. Query param: ?tenantId=...
 *   3. JWT sub claim (future: when auth is added)
 *
 * Usage in routes:
 *   router.use(tenantMiddleware);
 *   router.get('/orders', (req, res) => {
 *     Order.find({ tenantId: req.tenantId })  // automatically scoped
 *   });
 *
 * For super-admin routes (no tenantId required), do NOT apply this middleware.
 */

const Tenant = require('../models/Tenant');

const tenantMiddleware = async (req, res, next) => {
  // Resolve tenantId from header or query string
  const rawId = req.headers['x-tenant-id'] || req.query.tenantId;

  if (!rawId) {
    return res.status(400).json({
      success: false,
      message: 'Missing tenant context. Provide X-Tenant-Id header or ?tenantId= query param.',
    });
  }

  try {
    // Validate the tenant exists and is Active
    const tenant = await Tenant.findOne({
      $or: [
        { _id: rawId.match(/^[0-9a-fA-F]{24}$/) ? rawId : null },
        { tenantId: rawId },
      ],
    }).lean();

    if (!tenant) {
      return res.status(404).json({ success: false, message: `Tenant "${rawId}" not found.` });
    }

    if (tenant.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: `Tenant "${tenant.cafeName}" is ${tenant.status}. Access denied.`,
      });
    }

    // Attach to request for downstream controllers
    req.tenantId   = tenant._id;
    req.tenantObj  = tenant;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = tenantMiddleware;
