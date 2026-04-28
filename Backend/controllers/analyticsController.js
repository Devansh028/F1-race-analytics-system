const mongoose = require("mongoose");
const { getDriverStats, compareDrivers, getLeaderboard } = require("../services/analyticsService");

// Driver Performance
exports.driverPerformance = async (req, res, next) => {
  try {
    const { driverId } = req.params;

    if (!driverId) {
      return res.status(400).json({ message: "Driver ID is required" });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(driverId)) {
      return res.status(400).json({ message: "Invalid Driver ID" });
    }

    const stats = await getDriverStats(driverId);

    if (!stats) {
      return res.status(404).json({ message: "No data found for this driver" });
    }

    res.status(200).json(stats);
  } catch (error) {
    next(error); // use middleware
  }
};

// Compare Drivers
exports.compare = async (req, res, next) => {
  try {
    const { d1, d2 } = req.query;

    if (!d1 || !d2) {
      return res
        .status(400)
        .json({ message: "Both driver IDs are required" });
    }

    if (
      !mongoose.Types.ObjectId.isValid(d1) ||
      !mongoose.Types.ObjectId.isValid(d2)
    ) {
      return res.status(400).json({ message: "Invalid Driver IDs" });
    }

    const result = await compareDrivers(d1, d2);

    if (!result) {
      return res.status(404).json({ message: "Comparison data not found" });
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Leaderboard
exports.leaderboard = async (req, res, next) => {
  try {
    const { raceId } = req.params;

    if (!raceId) {
      return res.status(400).json({ message: "Race ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(raceId)) {
      return res.status(400).json({ message: "Invalid Race ID" });
    }

    const data = await getLeaderboard(raceId);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};