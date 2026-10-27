const router = require("express").Router();
const { protect, allowRoles } = require("../middleware/authMiddleware");
const { getQR, redeemQR } = require("../controllers/qrController");

router.get("/:bookingId", protect, getQR);
router.post(
  "/redeem",
  protect,
  allowRoles("staff", "admin"),
  redeemQR
);

module.exports = router;