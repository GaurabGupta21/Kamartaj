const express = require("express");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const {
  createBooking,
  getMyBookings,
  getBookingById,
  getBookingStatus,
  cancelBooking
} = require("../controllers/bookingController");

const router = express.Router();

router.use(protect, allowRoles("student"));

router.post("/", createBooking);
router.get("/", getMyBookings);
router.get("/:id/status", getBookingStatus);
router.post("/:id/cancel", cancelBooking);
router.get("/:id", getBookingById);

module.exports = router;