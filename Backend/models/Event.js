const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      "OVERTAKE",
      "PIT_STOP",
      "RACE_END",
      "DNF",
      "SAFETY_CAR_DEPLOYED",
      "SAFETY_CAR_END",
      "WEATHER_CHANGE",
      "PHASE_CHANGE",
    ],
    required: true,
  },
  driverId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Driver",
  required: function () {
    return ![
      "RACE_END",
      "SAFETY_CAR_DEPLOYED",
      "SAFETY_CAR_END",
      "WEATHER_CHANGE",
      "PHASE_CHANGE",
    ].includes(this.type);
  },
},
  raceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Race",
    required: true,
  },
  lapNumber: {
    type: Number,
    required: true,
  },
  description: String,
  sequence: Number,
  racePhase: {
    type: String,
    enum: ["GRID", "GREEN", "FINAL", "FINISHED"],
  },
  weather: {
    type: String,
    enum: ["DRY", "CLOUDY", "RAIN"],
  },
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Event", eventSchema);