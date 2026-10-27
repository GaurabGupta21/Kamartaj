
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const {
  createOrder,
  verifyPayment
} = require("../controllers/paymentController");

// SECTION: Protect both endpoints so students can pay only
// for their own bookings.
router.post("/order/:bookingId", protect, createOrder);
router.post("/verify", protect, verifyPayment);

module.exports = router;
