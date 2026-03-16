const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const { getAllCafes } = require("../controllers/adminController");

// Example protected route: GET /api/admin/cafes
// Middleware ensures req has valid JWT AND role === "superadmin"
router.get("/cafes", requireAuth, requireRole("superadmin"), getAllCafes);

module.exports = router;
