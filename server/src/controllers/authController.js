const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Cafe = require("../models/Cafe");

const generateToken = (user) => {
  // include role in JWT
  return jwt.sign(
    { userId: user._id, role: user.role, cafeId: user.cafeId || null },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const isStrongPassword = (password) => {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
  return strongRegex.test(password);
};

// POST /api/auth/signup
const signup = async (req, res) => {
  const { cafeName, ownerName, email, password } = req.body;
  console.log("Signup body:", req.body);
  try {
    if (!cafeName || !ownerName || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    const cafe = await Cafe.create({ cafeName, ownerEmail: email });
    const user = await User.create({ name: ownerName, email, password, role: "owner", cafeId: cafe._id });

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, cafeId: cafe._id },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // 1. Find user by email
    const user = await User.findOne({ email });
    
    // 2. Compare password using bcrypt (matchPassword method on User model)
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 3. Generate JWT payload with userId and role
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 4. Return token and user info (including role)
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password").populate("cafeId");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { signup, login, getProfile };
