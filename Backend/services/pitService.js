function shouldPit(driver) {
  return driver.tireWear >= 70;
}

function performPitStop(driver) {
  driver.status = "PIT";

  // Change tire randomly
  const tires = ["SOFT", "MEDIUM", "HARD"];
  driver.tireType = tires[Math.floor(Math.random() * tires.length)];

  driver.tireWear = 0;

  // Simulated delay (pit time)
  driver.pitTime = Math.floor(Math.random() * 3) + 2; // 2–5 sec
}

module.exports = { shouldPit, performPitStop };