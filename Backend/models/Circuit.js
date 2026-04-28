const mongoose = require("mongoose");

const circuitSchema = new mongoose.Schema(
  {
    circuitId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    location: String,
    country: String,
    laps: { type: Number, default: 58 },
    length: Number,
    mapImageUrl: String,
    localMapImageUrl: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Circuit", circuitSchema);
