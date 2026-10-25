
const express = require("express");
const router = express.Router();

const {
  createMenu,
  getTodayMenus,
  getMenuById,
  updateMenu,
  deleteMenu
} = require("../controllers/menuController");


const { protect, authorizeRoles } =
  require("../middleware/authMiddleware");

router.get("/today", protect, getTodayMenus);

router.get("/:id", protect, getMenuById);

router.post(
  "/",
  protect,
  authorizeRoles("staff"),
  createMenu
);

router.put(
  "/:id",
  protect,
  authorizeRoles("staff"),
  updateMenu
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("staff"),
  deleteMenu
);

module.exports = router;
