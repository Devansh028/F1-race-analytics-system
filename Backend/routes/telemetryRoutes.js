const express = require("express");
const router = express.Router();
const telemetryController = require("../controllers/telemetryController");
const { protect } = require("../middleware/authMiddleware");

router.get("/:driverId", protect, telemetryController.getTelemetryByDriver);

module.exports = router;