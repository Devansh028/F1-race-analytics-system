const mongoose = require("mongoose");

const raceSchema = new mongoose.Schema(
  {
    trackId: String,
    track: String,
    circuit: String,
    location: String,
    circuitLengthKm: Number,
    mapImageUrl: String,
    localMapImageUrl: String,
    totalLaps: Number,
    currentLap: { type: Number, default: 0 },
    status: { type: String, default: "NOT_STARTED" },
    phase: {
      type: String,
      enum: ["GRID", "GREEN", "FINAL", "FINISHED"],
      default: "GRID",
    },
    weather: {
      type: String,
      enum: ["DRY", "CLOUDY", "RAIN"],
      default: "DRY",
    },
    safetyCarActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Race", raceSchema);