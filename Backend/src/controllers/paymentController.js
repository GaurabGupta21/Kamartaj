
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Booking = require("../models/Booking");

// SECTION 1: Connect backend to Razorpay Test Mode
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// SECTION 2: Create a Razorpay order for an existing booking
exports.createOrder = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      student: req.user.id
    });

    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    if (booking.bookingStatus !== "pending_payment" ||
        booking.paymentStatus !== "pending") {
      return res.status(400).json({
        message: "Booking is not available for payment"
      });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(booking.amount * 100),
      currency: "INR",
      receipt: booking._id.toString()
    });

    booking.razorpayOrderId = order.id;
    await booking.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// SECTION 3: Verify the payment after Razorpay Checkout
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body || {};

    if (![razorpay_order_id, razorpay_payment_id, razorpay_signature]
      .every(value => typeof value === "string" && value.length > 0) ||
      !/^[a-f\d]{64}$/i.test(razorpay_signature)) {
      return res.status(400).json({ message: "Invalid payment verification data" });
    }

    const booking = await Booking.findOne({
      razorpayOrderId: razorpay_order_id,
      student: req.user.id
    });

    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    // Prevent duplicate verification from changing an existing payment
    if (booking.paymentStatus === "paid") {
      return res.json({ message: "Payment already verified" });
    }

    if (booking.bookingStatus !== "pending_payment" ||
        booking.paymentStatus !== "pending") {
      return res.status(400).json({ message: "Booking is not payable" });
    }

    // Verify the signature using the secret stored on the backend
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const validSignature = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(razorpay_signature, "hex")
    );

    if (!validSignature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Ask Razorpay for the payment status; do not trust the browser alone
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (
      payment.order_id !== booking.razorpayOrderId ||
      payment.status !== "captured" ||
      payment.amount !== Math.round(booking.amount * 100) ||
      payment.currency !== "INR"
    ) {
      return res.status(400).json({
        message: "Payment is not successfully captured"
      });
    }

    booking.razorpayPaymentId = payment.id;
    booking.paymentStatus = "paid";
    booking.bookingStatus = "confirmed";
    await booking.save();

    res.json({
      message: "Payment successful",
      bookingId: booking._id,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.webhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.get("x-razorpay-signature");

  if (!webhookSecret) {
    return res.status(503).json({ message: "Payment webhook is not configured" });
  }

  if (!Buffer.isBuffer(req.body) || typeof signature !== "string" ||
      !/^[a-f\d]{64}$/i.test(signature)) {
    return res.status(400).json({ message: "Invalid webhook request" });
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(req.body)
    .digest();
  const receivedSignature = Buffer.from(signature, "hex");

  if (!crypto.timingSafeEqual(expectedSignature, receivedSignature)) {
    return res.status(401).json({ message: "Invalid webhook signature" });
  }

  let event;
  try {
    event = JSON.parse(req.body.toString("utf8"));
  } catch (error) {
    return res.status(400).json({ message: "Invalid webhook payload" });
  }

  if (!event || typeof event !== "object" || Array.isArray(event) ||
      typeof event.event !== "string") {
    return res.status(400).json({ message: "Invalid webhook payload" });
  }

  if (event.event !== "payment.captured") {
    return res.status(200).json({ received: true });
  }

  try {
    const payment = event.payload?.payment?.entity;
    if (!payment?.id || !payment.order_id || payment.status !== "captured") {
      return res.status(400).json({ message: "Invalid captured payment event" });
    }

    const booking = await Booking.findOne({ razorpayOrderId: payment.order_id });
    if (!booking) {
      return res.status(200).json({ received: true });
    }

    if (payment.amount !== Math.round(booking.amount * 100) ||
        payment.currency !== "INR") {
      return res.status(400).json({ message: "Payment does not match booking" });
    }

    if (booking.paymentStatus !== "pending" ||
        booking.bookingStatus !== "pending_payment") {
      return res.status(200).json({ received: true });
    }

    const eventId = req.get("x-razorpay-event-id") || payment.id;
    await Booking.findOneAndUpdate(
      {
        _id: booking._id,
        paymentStatus: "pending",
        bookingStatus: "pending_payment",
        webhookEventIds: { $ne: eventId }
      },
      {
        $set: {
          razorpayPaymentId: payment.id,
          paymentStatus: "paid",
          bookingStatus: "confirmed"
        },
        $addToSet: { webhookEventIds: eventId }
      }
    );

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Payment webhook error:", error.message);
    return res.status(500).json({ message: "Failed to process payment webhook" });
  }
};
