const mongoose = require("mongoose");

const telemetrySchema = new mongoose.Schema({
    raceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Race",
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Driver",
    },
    lap: Number,

    sector1: Number,
    sector2: Number,
    sector3: Number,

    speed: Number,     // avg speed
    topSpeed: Number,   // max speed

    tireWear: Number,    // %
    fuelLevel: Number,   // %

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Telemetry", telemetrySchema);