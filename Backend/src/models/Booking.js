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
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending"
  },
  bookingStatus: {
    type: String,
    enum: ["pending_payment", "confirmed", "cancelled", "redeemed"],
    default: "pending_payment"
  }
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);