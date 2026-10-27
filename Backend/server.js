const dns = require("node:dns");
const path = require("node:path");
const fs = require("node:fs");

// Fix MongoDB Atlas DNS/SRV resolution issue safely
try {
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
} catch (dnsErr) {
  console.warn("Custom DNS servers could not be set:", dnsErr.message);
}

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");

const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const menuRoutes = require("./src/routes/menuRoutes");
const bookingRoutes = require("./src/routes/bookingRoutes");
const paymentController = require("./src/controllers/paymentController");
const paymentRoutes = require("./src/routes/paymentRoutes");
const analyticsRoutes = require("./src/routes/analyticsRoutes");

const app = express();

// Flexible CORS for production and development
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      /\.vercel\.app$/.test(origin) ||
      /\.onrender\.com$/.test(origin) ||
      /\.netlify\.app$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", message: "Kamar-Taj Refectory API is running" });
});

// Razorpay webhook: raw body required for signature verification
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentController.webhook
);

// Parse JSON for all other API routes
app.use(express.json());

// Existing routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/menus", menuRoutes);
app.use("/api/bookings", bookingRoutes);

app.use("/api/qr", require("./src/routes/qrRoutes"));
app.use("/api/admin/analytics", analyticsRoutes);

// Payment routes
app.use("/api/payments", paymentRoutes);

// Serve static frontend build if present (for unified single-service deployment)
const clientDistPath = path.join(__dirname, "../client/dist");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

const PORT = process.env.PORT || 5000;

async function startServer() {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
    throw new Error("Missing MONGODB_URI or JWT_SECRET in .env");
  }

  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exit(1);
});
