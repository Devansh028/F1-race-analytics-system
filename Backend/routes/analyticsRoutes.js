const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  driverPerformance,
  compare,
  leaderboard
} = require("../controllers/analyticsController");

router.get("/driver/:driverId", protect, driverPerformance);
router.get("/compare", protect, compare);
router.get("/leaderboard/:raceId", protect, leaderboard);

module.exports = router;