const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");

const {
  startRace,
  getRaceEvents,
  getLeaderboard,
  getRaceStatus,
  getRaceReplay,
  getPerformanceMetrics,
  getLatestRace,
  getRecentRaces,
  getTrackPresets,
} = require("../controllers/raceController");

router.post("/start", protect, authorize("ADMIN"), startRace);
router.get("/tracks", protect, getTrackPresets);
router.get("/latest", protect, getLatestRace);
router.get("/recent", protect, getRecentRaces);
router.get("/events/:raceId", protect, getRaceEvents);
router.get("/leaderboard/:raceId", protect, getLeaderboard);
router.get("/status/:raceId", protect, getRaceStatus);
router.get("/replay/:raceId", protect, getRaceReplay);
router.get("/metrics/:raceId", protect, getPerformanceMetrics);

module.exports = router;