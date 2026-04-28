const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: String,
    nationality: String,
    team: { type: String, default: "Unknown" },
    skillRating: { type: Number, default: 80 },
    tireType: {
        type: String,
        enum: ["SOFT", "MEDIUM", "HARD"],
        default: "MEDIUM",
    },
    tireWear: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ["RUNNING", "PIT", "DNF"],
        default: "RUNNING",
    },
});

module.exports = mongoose.model('Driver', driverSchema);