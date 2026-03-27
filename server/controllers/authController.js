const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Cafe = require("../models/Cafe");
const Tenant = require("../models/Tenant");
const Owner = require("../models/Owner"); // Legacy collection: read-only fallback for migration

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

const genTenantId = () => "tenant_" + Math.floor(1000 + Math.random() * 9000);

const genAdminEmail = (cafeName) => {
  const slug = (cafeName || "cafe")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20);
  return `admin@${slug}.com`;
};

const genPassword = (length = 12) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
  let pwd = "";
  for (let i = 0; i < length; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return pwd;
};

const planExpiry = (plan) => {
  const d = new Date();
  const months = { Free: 1, Starter: 1, Pro: 12, Growth: 12, Enterprise: 12 };
  d.setMonth(d.getMonth() + (months[plan] || 1));
  return d;
};

const ensureTenant = async ({ cafeName, ownerName, email }) => {
  const existing = await Tenant.findOne({ email });
  if (existing) {
    const updates = {};
    if (!existing.cafeName && cafeName) updates.cafeName = cafeName;
    if (!existing.ownerName && ownerName) updates.ownerName = ownerName;
    if (Object.keys(updates).length) {
      return Tenant.findByIdAndUpdate(existing._id, updates, { new: true });
    }
    return existing;
  }

  let tenantId = genTenantId();
  let tries = 0;
  while (await Tenant.findOne({ tenantId })) {
    tenantId = genTenantId();
    tries += 1;
    if (tries > 5) throw new Error("Unable to generate unique tenant id");
  }

  const subscriptionPlan = "Free";
  return Tenant.create({
    tenantId,
    cafeName,
    ownerName,
    email,
    adminEmail: genAdminEmail(cafeName),
    tempPassword: genPassword(),
    subscriptionPlan,
    subscriptionStartDate: new Date(),
    planExpiryDate: planExpiry(subscriptionPlan),
    status: "Active",
    lastActiveAt: new Date(),
  });
};

// POST /api/auth/signup
const signup = async (req, res) => {
  const { cafeName, ownerName, name, email, password } = req.body;
  const resolvedOwnerName = ownerName || name;
  console.log("Signup body:", req.body);
  try {
    if (!cafeName || !resolvedOwnerName || !email || !password)
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

    const existingOwner = await Owner.findOne({ email });
    if (existingOwner) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const cafe = await Cafe.create({ cafeName, ownerEmail: email });
    const user = await User.create({
      name: resolvedOwnerName,
      email,
      password,
      role: "owner",
      cafeId: cafe._id,
    });
    try {
      await ensureTenant({ cafeName, ownerName: resolvedOwnerName, email });
    } catch (tenantErr) {
      await User.findByIdAndDelete(user._id).catch(() => { });
      await Cafe.findByIdAndDelete(cafe._id).catch(() => { });
      throw tenantErr;
    }

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
    let user = await User.findOne({ email });

    // 2. If not found, try legacy Owner collection and migrate
    if (!user) {
      const owner = await Owner.findOne({ email });
      if (!owner) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      let isMatch = await bcrypt.compare(password, owner.password);
      if (!isMatch && owner.password === password) {
        isMatch = true;
        owner.password = await bcrypt.hash(password, 10);
        await owner.save();
      }
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      let cafe = await Cafe.findOne({ ownerEmail: email });
      if (!cafe) {
        cafe = await Cafe.create({ cafeName: owner.cafeName, ownerEmail: email });
      }

      user = await User.create({
        name: owner.name,
        email,
        password,
        role: "owner",
        cafeId: cafe._id,
      });

      await ensureTenant({ cafeName: owner.cafeName, ownerName: owner.name, email });
      await Owner.findByIdAndDelete(owner._id).catch(() => {});
    } else {
      // 3. Compare password using bcrypt (matchPassword method on User model)
      if (!(await user.matchPassword(password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
    }

    // 3. Generate JWT payload with userId and role
    const token = generateToken(user);

    // 4. Return token and user info (including role)
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        cafeId: user.cafeId || null,
      }
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

// GET /api/auth/owner/:id/locationSettings
const getLocationSettings = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Owner not found' });
    res.json(user.locationSettings || { enabled: false, radius: 100 });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/auth/owner/:id/locationSettings
const updateLocationSettings = async (req, res) => {
  try {
    const { latitude, longitude, radius, enabled } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Owner not found' });

    user.locationSettings = {
      latitude: latitude !== undefined ? latitude : user.locationSettings?.latitude,
      longitude: longitude !== undefined ? longitude : user.locationSettings?.longitude,
      radius: radius !== undefined ? radius : (user.locationSettings?.radius || 100),
      enabled: enabled !== undefined ? enabled : (user.locationSettings?.enabled || false)
    };

    await user.save();
    res.json(user.locationSettings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { signup, login, getProfile, getLocationSettings, updateLocationSettings };
