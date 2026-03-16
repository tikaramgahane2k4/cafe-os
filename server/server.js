require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require("./src/config/database");
const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/adminRoutes"); // Added admin route

const app = express();
app.use(cors({ origin: ["http://localhost:3000", "http://localhost:5173"], credentials: true }));
app.use(express.json());

// Connect DB (Removed automatic superadmin creation block)
connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes); // Mount protected admin routes

app.get("/", (req, res) => res.json({ message: "Cafe-OS API running" }));

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} busy. Run: killall -9 node`);
    process.exit(1);
  }
});