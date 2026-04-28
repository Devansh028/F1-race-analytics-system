const redis = require("redis");

const client = redis.createClient();

client.on("connect", () => {
  console.log("Redis Connected");
});

client.connect();

module.exports = client;