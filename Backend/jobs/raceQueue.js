const { Queue } = require("bullmq");
const connection = { host: "127.0.0.1", port: 6379 };

const raceQueue = new Queue("raceQueue", { connection });

module.exports = raceQueue;