const mongoose = require("mongoose");
const Race = require("../models/Race");
const Driver = require("../models/Driver");
const Circuit = require("../models/Circuit");
const Lap = require("../models/Lap");
const Event = require("../models/Event");
const Telemetry = require("../models/Telemetry");
const redisClient = require("../config/redis");
const { startSimulation } = require("../services/simulationService");
const { RACE_PHASES } = require("../services/raceControlService");
const { TRACK_PRESETS } = require("../data/trackPresets");

const DEFAULT_DRIVERS = [
  { name: "Max Verstappen", team: "Red Bull", skillRating: 98 },
  { name: "Lewis Hamilton", team: "Mercedes", skillRating: 95 },
  { name: "Charles Leclerc", team: "Ferrari", skillRating: 94 },
  { name: "Lando Norris", team: "McLaren", skillRating: 93 },
  { name: "Fernando Alonso", team: "Aston Martin", skillRating: 91 },
  { name: "George Russell", team: "Mercedes", skillRating: 90 },
];

function withGapAndInterval(rows) {
  const sorted = [...rows].sort((a, b) => a.position - b.position);
  if (!sorted.length) return [];

  const leaderTime = Number(sorted[0].totalTime || sorted[0].lapTime || 0);

  return sorted.map((row, index) => {
    const currentTime = Number(row.totalTime || row.lapTime || 0);
    const front = index > 0 ? sorted[index - 1] : null;
    const frontTime = front ? Number(front.totalTime || front.lapTime || 0) : 0;

    return {
      ...(row.toObject ? row.toObject() : row),
      gapToLeader: index === 0 ? 0 : +(currentTime - leaderTime).toFixed(2),
      intervalToFront: index === 0 ? 0 : +(currentTime - frontTime).toFixed(2),
    };
  });
}

function enrichRaceWithTrackMeta(raceDoc) {
  if (!raceDoc) return raceDoc;

  const race = raceDoc.toObject ? raceDoc.toObject() : raceDoc;
  const byId = TRACK_PRESETS.find((track) => track.id === race.trackId);
  const byName = !byId
    ? TRACK_PRESETS.find((track) => track.name === race.track || track.circuit === race.circuit)
    : null;
  const preset = byId || byName;

  if (!preset) return race;

  return {
    ...race,
    trackId: race.trackId || preset.id,
    track: race.track || preset.name,
    circuit: race.circuit || preset.circuit,
    location: race.location || preset.location,
    circuitLengthKm: race.circuitLengthKm || preset.circuitLengthKm,
    mapImageUrl: race.mapImageUrl || preset.mapImageUrl,
    localMapImageUrl: race.localMapImageUrl || preset.localMapImageUrl,
  };
}

// 🏁 Start Race
exports.startRace = async (req, res, next) => {
  try {
    const io = req.app.get("io");
    const { trackId, totalLaps } = req.body || {};
    const circuits = await Circuit.find().lean();
    const randomCircuit = circuits.length
      ? circuits[Math.floor(Math.random() * circuits.length)]
      : null;
    const selectedCircuitFromDb =
      circuits.find((circuit) => circuit.circuitId === trackId) ||
      randomCircuit ||
      null;

    const selectedTrack =
      selectedCircuitFromDb ||
      TRACK_PRESETS.find((track) => track.id === trackId) ||
      TRACK_PRESETS.find((track) => track.id === "monaco") ||
      TRACK_PRESETS[0];

    const lapsInput = Number(totalLaps);
    const laps = Number.isFinite(lapsInput)
      ? Math.max(5, Math.min(120, Math.floor(lapsInput)))
      : selectedTrack.defaultLaps;

    const race = await Race.create({
      trackId: selectedTrack.circuitId || selectedTrack.id,
      track: selectedTrack.name,
      circuit: selectedTrack.circuit || selectedTrack.name,
      location:
        selectedTrack.location && selectedTrack.country
          ? `${selectedTrack.location}, ${selectedTrack.country}`
          : selectedTrack.location,
      circuitLengthKm: selectedTrack.length || selectedTrack.circuitLengthKm,
      mapImageUrl: selectedTrack.mapImageUrl,
      localMapImageUrl: selectedTrack.localMapImageUrl,
      totalLaps: laps,
      status: "ONGOING",
      currentLap: 0,
      phase: RACE_PHASES.GRID,
      weather: "DRY",
      safetyCarActive: false,
    });

    let drivers = await Driver.find();
    if (!drivers.length) {
      await Driver.insertMany(DEFAULT_DRIVERS);
      drivers = await Driver.find();
    }

    // Start the single authoritative simulation loop
    await startSimulation(race, drivers, io);

    // ✅ ONLY ONE RESPONSE (FIXED)
    res.status(200).json({
      message: "Race started",
      race,
    });

  } catch (error) {
    next(error);
  }
};

// 📡 Get Race Events
exports.getRaceEvents = async (req, res, next) => {
  try {
    const { raceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(raceId)) {
      return res.status(400).json({ message: "Invalid Race ID" });
    }

    const events = await Event.find({ raceId }).sort({ createdAt: -1 });

    res.status(200).json(events);
  } catch (error) {
    next(error);
  }
};

// 🏁 Leaderboard (Redis + DB fallback)
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { raceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(raceId)) {
      return res.status(400).json({ message: "Invalid Race ID" });
    }

    const cacheKey = `leaderboard:${raceId}`;

    // ✅ Check cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // DB fallback
    const laps = await Lap.find({ raceId }).sort({ lapNumber: -1 });

    const latestLapMap = {};

    laps.forEach((lap) => {
      if (!latestLapMap[lap.driverId]) {
        latestLapMap[lap.driverId] = lap;
      }
    });

    const leaderboard = withGapAndInterval(Object.values(latestLapMap));

    await redisClient.setEx(cacheKey, 10, JSON.stringify(leaderboard));

    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
};

// 📍 Race status + leaderboard snapshot
exports.getRaceStatus = async (req, res, next) => {
  try {
    const { raceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(raceId)) {
      return res.status(400).json({ message: "Invalid Race ID" });
    }

    const race = await Race.findById(raceId).select(
      "_id trackId track circuit location circuitLengthKm mapImageUrl localMapImageUrl status phase weather safetyCarActive currentLap totalLaps"
    );

    if (!race) {
      return res.status(404).json({ message: "Race not found" });
    }

    const cacheKey = `leaderboard:${raceId}`;
    const cached = await redisClient.get(cacheKey);

    let leaderboard = [];

    if (cached) {
      leaderboard = JSON.parse(cached);
    } else {
      const laps = await Lap.find({ raceId }).sort({ lapNumber: -1 });
      const latestLapMap = {};

      laps.forEach((lap) => {
        if (!latestLapMap[lap.driverId]) {
          latestLapMap[lap.driverId] = lap;
        }
      });

      leaderboard = withGapAndInterval(Object.values(latestLapMap));

      await redisClient.setEx(cacheKey, 10, JSON.stringify(leaderboard));
    }

    res.status(200).json({
      race: enrichRaceWithTrackMeta(race),
      leaderboard,
    });
  } catch (error) {
    next(error);
  }
};

// 🎬 Replay payload (laps + telemetry + events)
exports.getRaceReplay = async (req, res, next) => {
  try {
    const { raceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(raceId)) {
      return res.status(400).json({ message: "Invalid Race ID" });
    }

    const race = await Race.findById(raceId);
    if (!race) {
      return res.status(404).json({ message: "Race not found" });
    }

    const [laps, telemetry, events] = await Promise.all([
      Lap.find({ raceId }).sort({ lapNumber: 1, position: 1 }),
      Telemetry.find({ raceId }).sort({ lap: 1, createdAt: 1 }),
      Event.find({ raceId }).sort({ sequence: 1, createdAt: 1 }),
    ]);

    res.status(200).json({
      race,
      timeline: events,
      laps,
      telemetry,
    });
  } catch (error) {
    next(error);
  }
};

// 📈 Performance metrics
exports.getPerformanceMetrics = async (req, res, next) => {
  try {
    const { raceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(raceId)) {
      return res.status(400).json({ message: "Invalid Race ID" });
    }

    const laps = await Lap.find({ raceId }).sort({ lapNumber: 1 });
    if (!laps.length) {
      return res.status(200).json({ raceId, drivers: [] });
    }

    const byDriver = {};

    laps.forEach((lap) => {
      const key = String(lap.driverId);
      if (!byDriver[key]) byDriver[key] = [];
      byDriver[key].push(lap.lapTime);
    });

    const drivers = Object.entries(byDriver).map(([driverId, lapTimes]) => {
      const total = lapTimes.reduce((sum, t) => sum + t, 0);
      const avgLapTime = +(total / lapTimes.length).toFixed(2);
      const bestLap = +Math.min(...lapTimes).toFixed(2);
      const variance =
        lapTimes.reduce((sum, t) => sum + (t - avgLapTime) ** 2, 0) / lapTimes.length;
      const consistency = +Math.sqrt(variance).toFixed(2);

      return {
        driverId,
        laps: lapTimes.length,
        avgLapTime,
        bestLap,
        consistency,
      };
    });

    res.status(200).json({
      raceId,
      drivers: drivers.sort((a, b) => a.avgLapTime - b.avgLapTime),
    });
  } catch (error) {
    next(error);
  }
};

// 🧭 Latest race for quick connect
exports.getLatestRace = async (req, res, next) => {
  try {
    const race = await Race.findOne()
      .sort({ _id: -1 })
      .select(
        "_id trackId track circuit location circuitLengthKm mapImageUrl localMapImageUrl status phase weather safetyCarActive currentLap totalLaps"
      );

    if (!race) {
      return res.status(404).json({ message: "No races found yet." });
    }

    res.status(200).json({ race: enrichRaceWithTrackMeta(race) });
  } catch (error) {
    next(error);
  }
};

// 📋 Recent races for quick selection
exports.getRecentRaces = async (req, res, next) => {
  try {
    const races = await Race.find()
      .sort({ _id: -1 })
      .limit(30)
      .select(
        "_id trackId track circuit location circuitLengthKm mapImageUrl localMapImageUrl status phase currentLap totalLaps createdAt"
      );

    const statusRank = {
      ONGOING: 0,
      NOT_STARTED: 1,
      FINISHED: 2,
    };

    const ordered = races
      .sort((a, b) => {
        const aRank = statusRank[a.status] ?? 99;
        const bRank = statusRank[b.status] ?? 99;
        if (aRank !== bRank) return aRank - bRank;
        return new Date(b.createdAt || b._id).getTime() - new Date(a.createdAt || a._id).getTime();
      })
      .slice(0, 10);

    res.status(200).json({ races: ordered.map(enrichRaceWithTrackMeta) });
  } catch (error) {
    next(error);
  }
};

// 🗺️ Track presets (DB-first, preset fallback)
exports.getTrackPresets = async (req, res, next) => {
  try {
    const circuits = await Circuit.find().sort({ name: 1 }).lean();
    if (circuits.length) {
      const tracks = circuits.map((circuit) => ({
        id: circuit.circuitId,
        name: circuit.name,
        circuit: circuit.name,
        location:
          circuit.location && circuit.country
            ? `${circuit.location}, ${circuit.country}`
            : circuit.location || circuit.country || "Unknown",
        defaultLaps: circuit.laps,
        circuitLengthKm: circuit.length,
        mapImageUrl: circuit.mapImageUrl,
        localMapImageUrl: circuit.localMapImageUrl,
      }));
      return res.status(200).json({ tracks });
    }

    res.status(200).json({ tracks: TRACK_PRESETS });
  } catch (error) {
    next(error);
  }
};