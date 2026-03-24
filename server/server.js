const path = require("path");
const fs = require("fs");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

const envPath = path.join(__dirname, ".env");
const dotenvResult = dotenv.config({ path: envPath });

if (dotenvResult.error) {
  const typoEnvPath = path.join(__dirname, ".env ");
  if (fs.existsSync(typoEnvPath)) {
    console.warn(
      `[Config] Found "${path.basename(typoEnvPath)}" with a trailing space. Rename it to ".env" so dotenv can load your MongoDB settings.`
    );
  }
}

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DB
const connectDB = require("./config/database");

// Auth (legacy owner auth)
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/adminRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// Admin Portal routes (legacy files under /routes)
const tenantRoutes = require("./routes/tenantRoutes");
const planRoutes = require("./routes/planRoutes");
const featureRoutes = require("./routes/featureRoutes");
const userRoutes = require("./routes/userRoutes");
const logRoutes = require("./routes/logRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
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
app.use("/api/admin/notifications", notificationRoutes);
app.use("/api/admin/invoices", invoiceRoutes);
app.use("/api/tenant", tenantEntityRoutes);

// Owner app routes
// Use Tanya's Menu Management routes (supports uploads + cafeId)
const menuRoutes = require("./routes/menuRoutes");
const staffRoutes = require("./routes/staff");
const customerRoutes = require("./routes/customer");
const inventoryRoutes = require("./routes/inventoryRoutes");

app.use("/api/menu", menuRoutes);
app.use("/api/inventory", inventoryRoutes);
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

const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} busy. Run: killall -9 node`);
      process.exit(1);
    }
  });
};

startServer().catch((error) => {
  console.error(error.message || error);
  if (mongoose.connection.readyState !== 0) {
    mongoose.connection.close().finally(() => process.exit(1));
    return;
  }

  process.exit(1);
});

