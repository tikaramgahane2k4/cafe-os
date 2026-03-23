const express = require("express");
const router = express.Router();
const { signup, login, getProfile, getLocationSettings, updateLocationSettings } = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");

router.post("/signup", signup);
router.post("/login", login);
router.get("/profile", requireAuth, getProfile);

router.get("/owner/:id/locationSettings", getLocationSettings);
router.put("/owner/:id/locationSettings", updateLocationSettings);

module.exports = router;
