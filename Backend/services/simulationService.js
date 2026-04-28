const Lap = require("../models/Lap");
const Event = require("../models/Event");
const Telemetry = require("../models/Telemetry");
const redisClient = require("../config/redis");

const { generateTelemetry } = require("./telemetryService");
const { getTirePerformance } = require("./tireService");
const { shouldPit, performPitStop } = require("./pitService");
const {
  RACE_PHASES,
  randomWeather,
  weatherLapDelta,
  shouldChangeWeather,
  shouldDNF,
  drsBoost,
  nextRacePhase,
} = require("./raceControlService");

let raceInterval = null;

exports.startSimulation = async (race, drivers, io) => {
  let eventSequence = 0;
  let safetyCarLapsRemaining = 0;
  let isTickRunning = false;

  let positions = drivers.map((d, index) => ({
    driver: d,
    position: index + 1,
    totalTime: 0,
    tire: d.tireType || "MEDIUM",
    tireWear: d.tireWear || 0,
    status: "RUNNING",
    dnf: false,
  }));

  race.phase = RACE_PHASES.GRID;
  race.weather = race.weather || randomWeather();
  await race.save();

  raceInterval = setInterval(async () => {
    if (isTickRunning) return;
    isTickRunning = true;

    try {
      if (!positions.some((p) => !p.dnf)) {
        clearInterval(raceInterval);
        race.status = "FINISHED";
        race.phase = RACE_PHASES.FINISHED;
        await race.save();
        return;
      }

      race.currentLap += 1;
      const activeDrivers = positions.filter((p) => !p.dnf);

      let events = [];
      let lapBatch = [];
      let telemetryBatch = [];
      const previousPositions = [...positions]
        .filter((p) => !p.dnf)
        .sort((a, b) => a.position - b.position);

      const currentPhase = nextRacePhase({
        currentLap: race.currentLap,
        totalLaps: race.totalLaps,
      });

      if (currentPhase !== race.phase) {
        race.phase = currentPhase;
        events.push({
          type: "PHASE_CHANGE",
          raceId: race._id,
          lapNumber: race.currentLap,
          description: `Race phase changed to ${race.phase}`,
          sequence: ++eventSequence,
          racePhase: race.phase,
          weather: race.weather,
        });
      }

      if (shouldChangeWeather(race.currentLap)) {
        race.weather = randomWeather();
        events.push({
          type: "WEATHER_CHANGE",
          raceId: race._id,
          lapNumber: race.currentLap,
          description: `Weather changed to ${race.weather}`,
          sequence: ++eventSequence,
          racePhase: race.phase,
          weather: race.weather,
        });
      }

      for (let p of activeDrivers) {
        const baseTime = 65;
        const skillFactor = (100 - p.driver.skillRating) * 0.2;
        const randomness = Math.random() * 0.6;
        const { speedBoost, wearRate } = getTirePerformance(p.tire);
        const frontDriver = previousPositions.find(
          (front) => front.position === p.position - 1
        );
        const intervalToFront = frontDriver
          ? +(p.totalTime - frontDriver.totalTime).toFixed(2)
          : 0;

        // 🛞 Tire degradation depends on compound
        p.tireWear = Math.min(100, p.tireWear + wearRate + Math.random() * 0.8);
        const tirePenalty = p.tireWear * 0.05;
        const weatherPenalty = weatherLapDelta(race.weather);
        const drsTimeGain = drsBoost({
          lapNumber: race.currentLap,
          intervalToFront: Math.max(intervalToFront, 0),
          safetyCarActive: race.safetyCarActive,
          weather: race.weather,
        });

        // ⏱️ Sector timing
        const sector1 = +(
          baseTime * 0.3 +
          skillFactor +
          randomness -
          speedBoost * 0.08 +
          weatherPenalty * 0.3
        ).toFixed(2);
        const sector2 = +(
          baseTime * 0.35 +
          randomness +
          tirePenalty -
          speedBoost * 0.08 +
          weatherPenalty * 0.4
        ).toFixed(2);
        const sector3 = +(
          baseTime * 0.35 +
          Math.random() -
          speedBoost * 0.05 +
          weatherPenalty * 0.3
        ).toFixed(2);

        let lapTime = +(sector1 + sector2 + sector3 - drsTimeGain).toFixed(2);
        let pitStop = false;

        // 🟡 PIT STOP
        if (shouldPit({ tireWear: p.tireWear }) || (p.tireWear > 60 && Math.random() > 0.7)) {
          performPitStop(p);
          pitStop = true;
          lapTime += p.pitTime;
          p.tireWear = 0;
          p.tire = p.tireType;

          events.push({
            type: "PIT_STOP",
            driverId: p.driver._id,
            raceId: race._id,
            lapNumber: race.currentLap,
            description: `${p.driver.name} made a pit stop`,
            sequence: ++eventSequence,
            racePhase: race.phase,
            weather: race.weather,
            metadata: { tireType: p.tire, pitTime: p.pitTime },
          });
        }

        if (race.safetyCarActive) {
          lapTime += 6;
        }

        if (shouldDNF(race.weather) && race.currentLap > 1) {
          p.dnf = true;
          p.status = "DNF";
          events.push({
            type: "DNF",
            driverId: p.driver._id,
            raceId: race._id,
            lapNumber: race.currentLap,
            description: `${p.driver.name} retired from the race`,
            sequence: ++eventSequence,
            racePhase: race.phase,
            weather: race.weather,
          });

          if (!race.safetyCarActive) {
            race.safetyCarActive = true;
            safetyCarLapsRemaining = 2;
            events.push({
              type: "SAFETY_CAR_DEPLOYED",
              raceId: race._id,
              lapNumber: race.currentLap,
              description: "Safety car deployed due to incident",
              sequence: ++eventSequence,
              racePhase: race.phase,
              weather: race.weather,
            });
          }

          continue;
        }

        p.totalTime += lapTime;

        // 📊 Lap batch
        lapBatch.push({
          driverId: p.driver._id,
          raceId: race._id,
          lapNumber: race.currentLap,
          lapTime,
          sector1,
          sector2,
          sector3,
          position: p.position,
          tireType: p.tire,
          tireWear: +p.tireWear.toFixed(2),
          totalTime: +p.totalTime.toFixed(2),
          pitStop,
          driverStatus: p.status,
        });

        // 📡 Telemetry batch
        telemetryBatch.push(
          generateTelemetry(
            { ...p.driver.toObject(), tireType: p.tire },
            race.currentLap,
            race._id,
            p.tireWear
          )
        );
      }

      // 🚀 Batch DB insert (FAST)
      if (lapBatch.length) await Lap.insertMany(lapBatch);
      if (telemetryBatch.length) await Telemetry.insertMany(telemetryBatch);

      if (race.safetyCarActive) {
        safetyCarLapsRemaining -= 1;
        if (safetyCarLapsRemaining <= 0) {
          race.safetyCarActive = false;
          events.push({
            type: "SAFETY_CAR_END",
            raceId: race._id,
            lapNumber: race.currentLap,
            description: "Safety car in this lap",
            sequence: ++eventSequence,
            racePhase: race.phase,
            weather: race.weather,
          });
        }
      }

      // 🏁 Sort leaderboard (overtakes frozen under safety car)
      const running = positions
        .filter((p) => !p.dnf)
        .sort((a, b) =>
          race.safetyCarActive ? a.position - b.position : a.totalTime - b.totalTime
        );
      const retired = positions.filter((p) => p.dnf).sort((a, b) => a.position - b.position);
      positions = [...running, ...retired];

      positions.forEach((p, i) => {
        const newPosition = i + 1;
        if (!p.dnf && !race.safetyCarActive && newPosition < p.position) {
          events.push({
            type: "OVERTAKE",
            driverId: p.driver._id,
            raceId: race._id,
            lapNumber: race.currentLap,
            description: `${p.driver.name} overtook to position ${newPosition}`,
            sequence: ++eventSequence,
            racePhase: race.phase,
            weather: race.weather,
          });
        }

        p.position = newPosition;
      });

      // 📡 Emit optimized data
      const runningForGap = positions.filter((p) => !p.dnf);
      const leaderboardData = positions.map((p, index) => {
        const leader = runningForGap[0];
        const front = index > 0 ? positions[index - 1] : null;
        const gapToLeader = p.dnf || !leader ? null : +(p.totalTime - leader.totalTime).toFixed(2);
        const intervalToFront =
          p.dnf || !front || front.dnf ? null : +(p.totalTime - front.totalTime).toFixed(2);

        return {
        driverId: p.driver._id,
        name: p.driver.name,
        position: p.position,
        totalTime: +p.totalTime.toFixed(2),
        tire: p.tire,
        tireWear: +p.tireWear.toFixed(2),
        status: p.status,
        gapToLeader,
        intervalToFront,
        };
      });

      // 🧾 Events
      if (events.length > 0) {
        await Event.insertMany(events);
        io.to(race._id.toString()).emit("raceEvents", events);
      }

      // 📡 Live updates
      io.to(race._id.toString()).emit("leaderboardUpdate", leaderboardData);
      io.to(race._id.toString()).emit("telemetryUpdate", telemetryBatch);
      io.to(race._id.toString()).emit("raceControlUpdate", {
        phase: race.phase,
        weather: race.weather,
        safetyCarActive: race.safetyCarActive,
        currentLap: race.currentLap,
      });

      // 🗃️ Redis cache (optimized)
      await redisClient.setEx(
        `leaderboard:${race._id}`,
        10,
        JSON.stringify(leaderboardData)
      );

      // 🏁 End race
      if (race.currentLap >= race.totalLaps || positions.filter((p) => !p.dnf).length <= 1) {
        clearInterval(raceInterval);

        await Event.create({
          type: "RACE_END",
          raceId: race._id,
          lapNumber: race.currentLap,
          description: "Race finished",
          sequence: ++eventSequence,
          racePhase: RACE_PHASES.FINISHED,
          weather: race.weather,
        });

        race.status = "FINISHED";
        race.phase = RACE_PHASES.FINISHED;
        await race.save();

        io.to(race._id.toString()).emit("raceFinished", leaderboardData);
      }

      await race.save();

    } catch (error) {
      console.error("Simulation Error:", error);
      clearInterval(raceInterval);
    } finally {
      isTickRunning = false;
    }
  }, 2000);
};