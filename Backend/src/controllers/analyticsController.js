
const Booking = require("../models/Booking");
const Menu = require("../models/menu");
const Wastage = require("../models/Wastage");

// Common date filter: ?days=7 or ?days=30
const getRange = (req) => {
  const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 365);
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  return { $gte: start, $lt: end };
};

// 1. REVENUE: total, today, daily trend, meal-wise revenue
exports.revenue = async (req, res) => {
  try {
    const range = getRange(req);
    const paid = { paymentStatus: "paid", createdAt: range };

    const [total, today, daily, meals] = await Promise.all([
      Booking.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Booking.aggregate([
        { $match: { paymentStatus: "paid", createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Booking.aggregate([
        { $match: paid },
        { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$amount" }
        } },
        { $sort: { _id: 1 } }
      ]),
      Booking.aggregate([
        { $match: paid },
        { $lookup: {
          from: Menu.collection.name, localField: "menu",
          foreignField: "_id", as: "menu"
        } },
        { $unwind: "$menu" },
        { $group: { _id: "$menu.mealType", revenue: { $sum: "$amount" } } }
      ])
    ]);

    res.json({
      totalRevenue: total[0]?.total || 0,
      todayRevenue: today[0]?.total || 0,
      dailyRevenue: daily,
      revenueByMeal: meals
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. BOOKINGS: statuses, meal type, booked quantity, redeemed quantity
exports.bookings = async (req, res) => {
  try {
    const range = getRange(req);
    const match = { createdAt: range };

    const [statuses, meals] = await Promise.all([
      Booking.aggregate([
        { $match: match },
        { $group: { _id: "$bookingStatus", count: { $sum: 1 } } }
      ]),
      Booking.aggregate([
        { $match: match },
        { $lookup: {
          from: Menu.collection.name, localField: "menu",
          foreignField: "_id", as: "menu"
        } },
        { $unwind: "$menu" },
        { $group: {
          _id: "$menu.mealType",
          bookings: { $sum: 1 },
          bookedQuantity: { $sum: "$quantity" },
          redeemedQuantity: {
            $sum: { $cond: [
              { $eq: ["$bookingStatus", "redeemed"] },
              "$quantity", 0
            ] }
          }
        } },
        { $sort: { bookedQuantity: -1 } }
      ])
    ]);

    res.json({
      totalBookings: statuses.reduce((s, x) => s + x.count, 0),
      statusCounts: statuses,
      mealDemand: meals
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 3. CAPACITY: compare menu capacity against booked quantities
exports.capacity = async (req, res) => {
  try {
    const result = await Menu.aggregate([
      { $lookup: {
        from: Booking.collection.name,
        let: { menuId: "$_id" },
        pipeline: [
          { $match: { $expr: { $and: [
            { $eq: ["$menu", "$$menuId"] },
            { $in: ["$bookingStatus", ["confirmed", "redeemed"]] }
          ] } } },
          { $group: { _id: null, booked: { $sum: "$quantity" } } }
        ],
        as: "bookingStats"
      } },
      { $project: {
        _id: 0,
        menu: "$_id",
        mealType: 1,
        capacity: 1,
        booked: { $ifNull: [{ $arrayElemAt: ["$bookingStats.booked", 0] }, 0] },
        available: {
          $subtract: [
            "$capacity",
            { $ifNull: [{ $arrayElemAt: ["$bookingStats.booked", 0] }, 0] }
          ]
        }
      } }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 4. WASTAGE: record and summarize food measurements
exports.addWastage = async (req, res) => {
  try {
    const { date, mealType, preparedKg, servedKg, wastedKg } = req.body;

    if (![preparedKg, servedKg, wastedKg].every(
      n => typeof n === "number" && Number.isFinite(n) && n >= 0
    ) || servedKg + wastedKg > preparedKg) {
      return res.status(400).json({ message: "Invalid food quantities" });
    }

    const record = await Wastage.create({
      date, mealType, preparedKg, servedKg, wastedKg,
      recordedBy: req.user.id
    });

    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.wastage = async (req, res) => {
  try {
    const result = await Wastage.aggregate([
      { $match: { date: getRange(req) } },
      { $group: {
        _id: "$mealType",
        preparedKg: { $sum: "$preparedKg" },
        servedKg: { $sum: "$servedKg" },
        wastedKg: { $sum: "$wastedKg" }
      } },
      { $project: {
        preparedKg: 1, servedKg: 1, wastedKg: 1,
        wastagePercent: {
          $cond: [
            { $gt: ["$preparedKg", 0] },
            { $multiply: [
              { $divide: ["$wastedKg", "$preparedKg"] }, 100
            ] },
            0
          ]
        }
      } }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/*
WORKFLOW DIAGRAM

Admin Dashboard
      |
      v
Admin-only Routes ---> Authentication + Role Check
      |
      v
Analytics Controller
      |
      +---- Booking + Payment data ---> Revenue / Bookings
      |
      +---- Menu + Booking data ------> Demand / Capacity
      |
      +---- Wastage collection -------> Prepared / Served / Wasted
      |
      v
JSON API Responses ---> Dashboard Cards + Charts
*/
