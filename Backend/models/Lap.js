const mongoose = require("mongoose");

const lapSchema = new mongoose.Schema({
  driverId: mongoose.Schema.Types.ObjectId,
  raceId: mongoose.Schema.Types.ObjectId,
  lapNumber: Number,
  lapTime: Number,
  sector1: Number,
  sector2: Number,
  sector3: Number,
  position: Number,
  tireType: {
    type: String,
    enum: ["SOFT", "MEDIUM", "HARD"],
  },
  tireWear: Number,
  totalTime: Number,
  pitStop: {
    type: Boolean,
    default: false,
  },
  driverStatus: {
    type: String,
    enum: ["RUNNING", "PIT", "DNF"],
    default: "RUNNING",
  },
});

module.exports = mongoose.model("Lap", lapSchema);