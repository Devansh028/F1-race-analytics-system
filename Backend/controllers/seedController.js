const Driver = require("../models/Driver");
const Circuit = require("../models/Circuit");
const { TRACK_PRESETS } = require("../data/trackPresets");
const {
  fetchDrivers,
  fetchCircuits,
  fetchDriverStandings,
} = require("../services/ergastService");

function clampSkill(value) {
  return Math.max(70, Math.min(100, Math.round(value)));
}

exports.seedDrivers = async (req, res, next) => {
  try {
    const [drivers, standings] = await Promise.all([fetchDrivers(), fetchDriverStandings()]);
    const standingsByDriverId = new Map(
      standings.map((entry) => [entry?.Driver?.driverId, entry])
    );

    const transformed = drivers.map((driver) => {
      const standing = standingsByDriverId.get(driver.driverId);
      const position = Number(standing?.position || 15);
      const skillFromStanding = clampSkill(100 - position * 2);
      const fallbackSkill = 70 + Math.floor(Math.random() * 31);

      return {
        name: `${driver.givenName} ${driver.familyName}`,
        code: driver.code || driver.familyName?.slice(0, 3)?.toUpperCase() || "DRV",
        nationality: driver.nationality || "Unknown",
        team:
          standing?.Constructors?.[0]?.name ||
          standing?.Constructors?.[0]?.constructorId ||
          "Unknown",
        skillRating: standing ? skillFromStanding : fallbackSkill,
      };
    });

    await Driver.deleteMany({});
    await Driver.insertMany(transformed);

    res.status(200).json({
      message: "Drivers seeded successfully",
      count: transformed.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.seedCircuits = async (req, res, next) => {
  try {
    const circuits = await fetchCircuits();
    const presetByName = new Map(TRACK_PRESETS.map((track) => [track.circuit, track]));

    const transformed = circuits.map((circuit) => {
      const preset = presetByName.get(circuit.circuitName);
      return {
        circuitId: circuit.circuitId,
        name: circuit.circuitName,
        location: circuit.Location?.locality || "Unknown",
        country: circuit.Location?.country || "Unknown",
        laps: preset?.defaultLaps || 40 + Math.floor(Math.random() * 41),
        length: preset?.circuitLengthKm,
        mapImageUrl: preset?.mapImageUrl,
        localMapImageUrl: preset?.localMapImageUrl,
      };
    });

    await Circuit.deleteMany({});
    await Circuit.insertMany(transformed);

    res.status(200).json({
      message: "Circuits seeded successfully",
      count: transformed.length,
    });
  } catch (error) {
    next(error);
  }
};
