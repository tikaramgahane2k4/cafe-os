const express = require("express");
const router = express.Router();
const { signup, login, getProfile } = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");

router.post("/signup", signup);
router.post("/login", login);
router.get("/profile", requireAuth, getProfile);

module.exports = router;
