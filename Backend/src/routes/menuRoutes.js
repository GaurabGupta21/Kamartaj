
const express = require("express");
const router = express.Router();

const {
  createMenu,
  getTodayMenus,
  getMenuById,
  updateMenu,
  deleteMenu
} = require("../controllers/menuController");


const { protect, allowRoles } =
  require("../middleware/authMiddleware");

router.get("/today", protect, getTodayMenus);

router.get("/:id", protect, getMenuById);

router.post(
  "/",
  protect,
  allowRoles("staff"),
  createMenu
);

router.put(
  "/:id",
  protect,
  allowRoles("staff"),
  updateMenu
);

router.delete(
  "/:id",
  protect,
  allowRoles("staff"),
  deleteMenu
);

module.exports = router;
