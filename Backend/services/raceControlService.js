const RACE_PHASES = {
  GRID: "GRID",
  GREEN: "GREEN",
  FINAL: "FINAL",
  FINISHED: "FINISHED",
};

const WEATHER_CONDITIONS = {
  DRY: "DRY",
  CLOUDY: "CLOUDY",
  RAIN: "RAIN",
};

function randomWeather() {
  const roll = Math.random();
  if (roll < 0.15) return WEATHER_CONDITIONS.RAIN;
  if (roll < 0.5) return WEATHER_CONDITIONS.CLOUDY;
  return WEATHER_CONDITIONS.DRY;
}

function weatherLapDelta(weather) {
  switch (weather) {
    case WEATHER_CONDITIONS.RAIN:
      return 4.5 + Math.random() * 2.5;
    case WEATHER_CONDITIONS.CLOUDY:
      return 1 + Math.random() * 1.5;
    case WEATHER_CONDITIONS.DRY:
    default:
      return 0;
  }
}

function shouldChangeWeather(currentLap) {
  return currentLap > 1 && currentLap % 3 === 0 && Math.random() > 0.55;
}

function shouldDNF(weather) {
  const baseChance = 0.008;
  const weatherRisk = weather === WEATHER_CONDITIONS.RAIN ? 0.02 : 0;
  return Math.random() < baseChance + weatherRisk;
}

function drsBoost({ lapNumber, intervalToFront, safetyCarActive, weather }) {
  if (lapNumber <= 2 || safetyCarActive || weather === WEATHER_CONDITIONS.RAIN) {
    return 0;
  }

  if (intervalToFront <= 1.2) {
    return 0.7 + Math.random() * 0.8;
  }

  return 0;
}

function nextRacePhase({ currentLap, totalLaps }) {
  if (currentLap >= totalLaps) return RACE_PHASES.FINISHED;
  if (currentLap >= totalLaps - 1) return RACE_PHASES.FINAL;
  if (currentLap === 0) return RACE_PHASES.GRID;
  return RACE_PHASES.GREEN;
}

module.exports = {
  RACE_PHASES,
  WEATHER_CONDITIONS,
  randomWeather,
  weatherLapDelta,
  shouldChangeWeather,
  shouldDNF,
  drsBoost,
  nextRacePhase,
};
