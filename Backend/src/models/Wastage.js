
const mongoose = require("mongoose");

module.exports = mongoose.model("Wastage", new mongoose.Schema({
  date: { type: Date, required: true },
  mealType: {
    type: String,
    enum: ["breakfast", "lunch", "dinner"],
    required: true
  },
  preparedKg: { type: Number, min: 0, required: true },
  servedKg: { type: Number, min: 0, required: true },
  wastedKg: { type: Number, min: 0, required: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true }));
