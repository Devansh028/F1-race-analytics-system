function getTirePerformance(tireType) {
  switch (tireType) {
    case "SOFT":
      return { speedBoost: 5, wearRate: 3 };
    case "MEDIUM":
      return { speedBoost: 2, wearRate: 2 };
    case "HARD":
      return { speedBoost: 0, wearRate: 1 };
    default:
      return { speedBoost: 0, wearRate: 2 };
  }
}

function updateTireWear(driver) {
  const { wearRate } = getTirePerformance(driver.tireType);
  driver.tireWear = Math.min(100, driver.tireWear + wearRate);
}

module.exports = { getTirePerformance, updateTireWear };