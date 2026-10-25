const mongoose = require("mongoose");
const Booking = require("../models/Booking");//Booking — stores booking details in MongoDB.
const Menu = require("../models/menu");

// POST: Create booking A student books a meal.
exports.createBooking = async (req, res) => {
  let menuId, quantity;

  try {
    ({ menuId, quantity } = req.body);

    if (!mongoose.isValidObjectId(menuId) ||
        !Number.isInteger(quantity) || quantity < 1)
      return res.status(400).json({ message: "Invalid menuId or quantity" });

    const menu = await Menu.findById(menuId);

    if (!menu || !menu.isAvailable)
      return res.status(404).json({ message: "Menu unavailable" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (new Date(menu.date) < today)
      return res.status(400).json({ message: "Past meals cannot be booked" });

    //Check capacity and reserve seats
    const updated = await Menu.findOneAndUpdate(
      {
        _id: menuId,
        isAvailable: true,
        $expr: { $lte: [{ $add: ["$bookedCount", quantity] }, "$capacity"] }
      },
      { $inc: { bookedCount: quantity } },
      { new: true }
    );

    if (!updated)
      return res.status(409).json({ message: "Insufficient capacity" });

    try { //save the booking
      const booking = await Booking.create({
        student: req.user._id,
        menu: menuId,
        quantity,
        amount: updated.price * quantity
      });

      return res.status(201).json({ booking });
    } catch (error) {
      await Menu.updateOne(
        { _id: menuId },
        { $inc: { bookedCount: -quantity } }
      );
      throw error;
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Booking failed" });
  }
};

// GET: My bookings
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ student: req.user._id })
      .populate("menu", "mealType date items price")
      .sort({ createdAt: -1 });

    res.status(200).json({ count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

// GET: One booking
exports.getBookingById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Invalid booking ID" });

    const booking = await Booking.findOne({
      _id: req.params.id,
      student: req.user._id
    }).populate("menu", "mealType date items price");

    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    res.status(200).json({ booking });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch booking" });
  }
};

// GET: Booking status
exports.getBookingStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Invalid booking ID" });

    const booking = await Booking.findOne({
      _id: req.params.id,
      student: req.user._id
    }).select("paymentStatus bookingStatus");

    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch status" });
  }
};

// POST: Cancel pending booking
exports.cancelBooking = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Invalid booking ID" });

    const booking = await Booking.findOneAndUpdate(
      {
        _id: req.params.id,
        student: req.user._id,
        bookingStatus: "pending_payment",
        paymentStatus: "pending"
      },
      { $set: { bookingStatus: "cancelled" } },
      { new: true }
    );

    if (!booking)
      return res.status(409).json({ message: "Booking cannot be cancelled" });

    const result = await Menu.updateOne(
      { _id: booking.menu, bookedCount: { $gte: booking.quantity } },
      { $inc: { bookedCount: -booking.quantity } }
    );

    if (result.modifiedCount !== 1) {
      await Booking.updateOne(
        { _id: booking._id, bookingStatus: "cancelled" },
        { $set: { bookingStatus: "pending_payment" } }
      );
      return res.status(409).json({ message: "Please retry cancellation" });
    }

    res.status(200).json({ message: "Booking cancelled", booking });
  } catch (error) {
    res.status(500).json({ message: "Cancellation failed" });
  }
};