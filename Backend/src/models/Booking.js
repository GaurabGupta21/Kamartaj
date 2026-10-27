
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  menu: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Menu",
    required: true
  },

  quantity: {
    type: Number,
    required: true,
    min: 1,
    validate: Number.isInteger
  },

  amount: {
    type: Number,
    required: true,
    min: 0
  },

  // Razorpay payment fields
  razorpayOrderId: {
    type: String
  },

  razorpayPaymentId: {
    type: String
  },

  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending"
  },

  webhookEventIds: {
    type: [String],
    default: []
  },

  // QR code redemption fields
  qrToken: {
    type: String,
    unique: true,
    sparse: true
  },

  redeemedAt: {
    type: Date,
    default: null
  },

  redeemedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  // Booking status
  bookingStatus: {
    type: String,
    enum: ["pending_payment", "confirmed", "cancelled", "redeemed"],
    default: "pending_payment"
  }

}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
