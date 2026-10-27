
const router = require("express").Router();
const { protect, allowRoles } = require("../middleware/authMiddleware");
const analytics = require("../controllers/analyticsController");

router.use(protect, allowRoles("admin"));

router.get("/revenue", analytics.revenue);
router.get("/bookings", analytics.bookings);
router.get("/capacity", analytics.capacity);
router.post("/wastage", analytics.addWastage);
router.get("/wastage", analytics.wastage);

module.exports = router;
