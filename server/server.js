const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

// DB
const connectDB = require("./src/config/database");
connectDB();

// Auth + Admin (new system)
const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/adminRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// Admin Portal routes (legacy files under /routes)
const tenantRoutes = require("./routes/tenantRoutes");
const planRoutes = require("./routes/planRoutes");
const featureRoutes = require("./routes/featureRoutes");
const userRoutes = require("./routes/userRoutes");
const logRoutes = require("./routes/logRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const alertRoutes = require("./routes/alertRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const tenantEntityRoutes = require("./routes/tenantEntityRoutes");

app.use("/api/admin/tenants", tenantRoutes);
// Keep legacy singular route for backward compatibility
app.use("/api/admin/tenant", tenantRoutes);
app.use("/api/admin/plans", planRoutes);
app.use("/api/admin/features", featureRoutes);
app.use("/api/admin/users", userRoutes);
app.use("/api/admin/logs", logRoutes);
app.use("/api/admin/analytics", analyticsRoutes);
app.use("/api/admin/alerts", alertRoutes);
app.use("/api/admin/invoices", invoiceRoutes);
app.use("/api/tenant", tenantEntityRoutes);

// Owner app routes
const menuRoutes = require("./routes/menu");
const staffRoutes = require("./routes/staff");
const customerRoutes = require("./routes/customer");

app.use("/api/menu", menuRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/customers", customerRoutes);

// Health check
app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState; // 0=disconnected,1=connected,2=connecting
  res.json({
    status: dbState === 1 ? "ok" : "degraded",
    db: ["disconnected", "connected", "connecting", "disconnecting"][dbState] || "unknown",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => res.json({ message: "Cafe-OS API running" }));

const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} busy. Run: killall -9 node`);
    process.exit(1);
  }
});
