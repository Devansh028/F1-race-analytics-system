const mongoose = require("mongoose");
const Lap = require("../models/Lap");

// 📊 Driver Stats
exports.getDriverStats = async (driverId) => {
  try {
    const laps = await Lap.find({ driverId }).select("lapTime");

    if (!laps.length) return null;

    let totalTime = 0;
    let fastestLap = Infinity;

    laps.forEach((lap) => {
      totalTime += lap.lapTime;
      if (lap.lapTime < fastestLap) fastestLap = lap.lapTime;
    });

    const avgLapTime = totalTime / laps.length;

    return {
      totalLaps: laps.length,
      avgLapTime,
      fastestLap,
    };
  } catch (error) {
    throw new Error("Error calculating driver stats");
  }
};

// ⚔️ Compare Drivers
exports.compareDrivers = async (d1, d2) => {
  try {
    const stats1 = await exports.getDriverStats(d1); 
    const stats2 = await exports.getDriverStats(d2);

    return {
      driver1: stats1,
      driver2: stats2,
    };
  } catch (error) {
    throw new Error("Error comparing drivers");
  }
};

// 🏎️ Fastest Driver in Race
exports.getFastestDriver = async (raceId) => {
  try {
    const laps = await Lap.find({ raceId }).select("driverId lapTime");

    let fastest = {};

    laps.forEach((lap) => {
      if (
        !fastest[lap.driverId] ||
        lap.lapTime < fastest[lap.driverId]
      ) {
        fastest[lap.driverId] = lap.lapTime;
      }
    });

    let bestDriver = null;
    let bestTime = Infinity;

    for (let driver in fastest) {
      if (fastest[driver] < bestTime) {
        bestTime = fastest[driver];
        bestDriver = driver;
      }
    }

    return {
      driverId: bestDriver,
      fastestLap: bestTime,
    };
  } catch (error) {
    throw new Error("Error finding fastest driver");
  }
};

// 🏁 Leaderboard
exports.getLeaderboard = async (raceId) => {
  try {
    const laps = await Lap.find({ raceId })
      .sort({ lapNumber: -1 })
      .select("driverId position lapNumber lapTime");

    const latestLapMap = {};

    laps.forEach((lap) => {
      if (!latestLapMap[lap.driverId]) {
        latestLapMap[lap.driverId] = lap;
      }
    });

    return Object.values(latestLapMap).sort(
      (a, b) => a.position - b.position
    );
  } catch (error) {
    throw new Error("Error fetching leaderboard");
  }
};