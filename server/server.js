require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

// Your auth routes
const connectDB = require("./src/config/database");
const authRoutes = require("./src/routes/authRoutes");

// Teammate routes
const Owner = require('./models/Owner');
const menuRoutes = require('./routes/menu');
const staffRoutes = require('./routes/staff');
const customerRoutes = require('./routes/customer');

const app = express();
app.use(cors({ origin: ["http://localhost:3000", "http://localhost:5173"], credentials: true }));
app.use(express.json());

// Connect DB + create default owner
connectDB().then(async () => {
  const exists = await Owner.findOne();
  if (!exists) {
    const hashed = await bcrypt.hash('admin123', 10);
    await Owner.create({ name: 'Owner', email: 'admin@cafe.com', password: hashed, cafeName: 'My Cafe' });
    console.log('Default owner created: admin@cafe.com / admin123');
  }
});

// Your auth routes
app.use("/api/auth", authRoutes);

// Teammate routes
app.use('/api/menu', menuRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/customers', customerRoutes);

app.get("/", (req, res) => res.json({ message: "Cafe-OS API running" }));

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} busy. Run: killall -9 node`);
    process.exit(1);
  }
});