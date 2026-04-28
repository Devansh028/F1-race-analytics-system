const { Worker } = require("bullmq");
const { startSimulation } = require("../services/simulationService");

const connection = { host: "127.0.0.1", port: 6379 };

const worker = new Worker(
  "raceQueue",
  async job => {
    const { race, drivers } = job.data;
    await startSimulation(race, drivers, global.io);
  },
  { connection }
); 