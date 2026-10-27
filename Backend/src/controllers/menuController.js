
const mongoose = require("mongoose");
const Menu = require("../models/menu");

// POST: Create a menu (staff only)
exports.createMenu = async (req, res) => {
  try {
    const { mealType, date, items, price, capacity } = req.body;

    if (!mealType || !date || !Array.isArray(items) ||
        items.length === 0 || !items.every(
          item => typeof item === "string" && item.trim()
        ) ||
        price === undefined || capacity === undefined) {
      return res.status(400).json({
        message: "Provide mealType, date, items, price and capacity"
      });
    }

    if (
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(capacity) ||
      capacity < 1
    ) {
      return res.status(400).json({
        message: "Invalid price or capacity"
      });
    }

    const parsedDate = new Date(date); //parsed converts into object

    if (Number.isNaN(parsedDate.getTime())) { //date must be in number that means not a NAN then it creates the date
      return res.status(400).json({
        message: "Invalid menu date"
      });
    }

    //Save the menu in MongoDB
    const menu = await Menu.create({
      mealType,
      date: parsedDate, //it must  not be a NAN (not a number)
      items: items.map(item => item.trim()),
      price,
      capacity,
      createdBy: req.user.id
    });

    res.status(201).json({
      message: "Menu created successfully",
      menu
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A menu already exists for this meal and date"
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message
      });
    }

    res.status(500).json({
      message: "Server error while creating menu"
    });
  }
};

// GET: Today's menus
exports.getTodayMenus = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const menus = await Menu.find({
      date: { $gte: start, $lt: end },
      isAvailable: true
    }).sort({ mealType: 1 });

    res.status(200).json({ menus });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET: One menu
exports.getMenuById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid menu ID" });
    }

    const menu = await Menu.findById(req.params.id);

    if (!menu)
      return res.status(404).json({ message: "Menu not found" });

    res.status(200).json({ menu });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// PUT: Update menu
exports.updateMenu = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);

    if (!menu)
      return res.status(404).json({ message: "Menu not found" });

    if (req.body.capacity !== undefined &&
        (!Number.isInteger(req.body.capacity) ||
         req.body.capacity < menu.bookedCount)) {
      return res.status(400).json({ message: "Invalid capacity" });
    }

    const fields = ["mealType", "date", "items", "price", "capacity", "isAvailable"];

    fields.forEach(key => {
      if (req.body[key] !== undefined) menu.set(key, req.body[key]);
    });

    await menu.save();
    res.status(200).json({ message: "Menu updated", menu });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE: Menu
exports.deleteMenu = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);

    if (!menu)
      return res.status(404).json({ message: "Menu not found" });

    if (menu.bookedCount > 0)
      return res.status(400).json({ message: "Menu has reservations" });

    await menu.deleteOne();
    res.status(200).json({ message: "Menu deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};