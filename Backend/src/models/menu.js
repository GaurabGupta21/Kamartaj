
const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
  {
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner"],
      required: true
    },

    date: {
      type: Date,
      required: true
    },

    items: {
      type: [String],
      required: true,
      validate: {
        validator: items => items.length > 0,
        message: "At least one food item is required"
      }
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    capacity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Capacity must be an integer"
      }
    },

    bookedCount: {
      type: Number,
      default: 0,
      min: 0
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

menuSchema.index(
  { mealType: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model("Menu", menuSchema);
