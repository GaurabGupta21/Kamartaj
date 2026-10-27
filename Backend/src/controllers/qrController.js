const crypto = require("crypto");
const QRCode = require("qrcode");
const Booking = require("../models/Booking");

// 1. Student gets their QR
exports.getQR = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      student: req.user.id
    });

    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    if (booking.paymentStatus !== "paid" ||
        booking.bookingStatus !== "confirmed")
      return res.status(400).json({ message: "Payment not verified" });

    // Create a secure token only if one doesn't exist
    if (!booking.qrToken) {
      const token = crypto.randomBytes(32).toString("hex");

      await Booking.updateOne(
        { _id: booking._id, qrToken: { $exists: false } },
        { $set: { qrToken: token } }
      );

      // Handles concurrent QR requests
      const updated = await Booking.findById(booking._id);
      if (!updated.qrToken) {
        updated.qrToken = token;
        await updated.save();
      }
      booking.qrToken = updated.qrToken;
    }

    const qr = await QRCode.toDataURL(booking.qrToken);
    res.json({ qr, bookingStatus: booking.bookingStatus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. Staff redeems the QR exactly once
exports.redeemQR = async (req, res) => {
  try {
    const { token } = req.body;

    const booking = await Booking.findOne({ qrToken: token });

    if (!booking)
      return res.status(404).json({ message: "Invalid QR code" });

    if (booking.paymentStatus !== "paid")
      return res.status(400).json({ message: "Payment not verified" });

    if (booking.bookingStatus === "redeemed")
      return res.status(409).json({ message: "Already redeemed" });

    // Atomic update: only one simultaneous scan can succeed
    const redeemed = await Booking.findOneAndUpdate(
      {
        _id: booking._id,
        paymentStatus: "paid",
        bookingStatus: "confirmed",
        redeemedAt: null
      },
      {
        $set: {
          bookingStatus: "redeemed",
          redeemedAt: new Date(),
          redeemedBy: req.user.id
        }
      },
      { new: true }
    );

    if (!redeemed)
      return res.status(409).json({ message: "Already redeemed or invalid status" });

    res.json({ message: "Meal redeemed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};