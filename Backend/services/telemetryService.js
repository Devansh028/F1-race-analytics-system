const { getTirePerformance } = require("./tireService");

function generateTelemetry(driver, lap, raceId, tireWear = 0) {
  const { speedBoost } = getTirePerformance(driver.tireType || "MEDIUM");

  const base = 30;

  const sector1 = +(base + Math.random() * 5 - speedBoost).toFixed(2);
  const sector2 = +(base + Math.random() * 5 - speedBoost).toFixed(2);
  const sector3 = +(base + Math.random() * 5 - speedBoost).toFixed(2);

  const lapTime = +(sector1 + sector2 + sector3).toFixed(2);

  const speed = Math.floor(280 + speedBoost * 2 + Math.random() * 20);
  const topSpeed = speed + Math.floor(Math.random() * 15);

  return {
    raceId,
    driverId: driver._id,
    lap,
    sector1,
    sector2,
    sector3,
    lapTime,
    speed,
    topSpeed,
    tireWear: Math.min(100, tireWear),
    fuelLevel: Math.max(0, 100 - lap * 1.5),
  };
}

module.exports = { generateTelemetry };