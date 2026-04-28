const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const setupSocket = require("./sockets/socketHandler");
const authRoutes = require("./routes/authRoutes");
const raceRoutes = require("./routes/raceRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const telemetryRoutes = require("./routes/telemetryRoutes");
const seedRoutes = require("./routes/seedRoutes");
const { errorHandler } = require("./middleware/errorMiddleware");

const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT || process.env.port || 5000);

// Middleware FIRST
app.use(cors());
app.use(express.json());
app.get("/api/health", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "f1-race-analytics-backend",
    port: PORT,
    dbState: mongoose.connection.readyState,
    ts: new Date().toISOString(),
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/races", raceRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/telemetry", telemetryRoutes);
app.use("/api/seed", seedRoutes);

// Socket setup
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Setup socket handler
setupSocket(io);

// Make io global
app.set("io", io);

// MongoDB connection with fallback (Atlas -> local)
const connectMongo = async () => {
  const primaryUri = process.env.MONGO_URI;
  const fallbackUri = "mongodb://127.0.0.1:27017/f1";

  if (primaryUri) {
    try {
      await mongoose.connect(primaryUri);
      console.log("MongoDB Connected (primary URI)");
      return;
    } catch (error) {
      console.error(
        "Primary MongoDB connection failed, switching to local MongoDB fallback.",
        error.message
      );
    }
  }

  try {
    await mongoose.connect(fallbackUri);
    console.log("MongoDB Connected (local fallback)");
  } catch (error) {
    console.error("DB Error: could not connect to MongoDB (primary and fallback failed).", error.message);
  }
};

connectMongo();

// Redis Adapter Setup (WRAPPED IN ASYNC FUNCTION)
const setupRedisAdapter = async () => {
  try {
    const pubClient = createClient();
    const subClient = pubClient.duplicate();

    await pubClient.connect();
    await subClient.connect();

    io.adapter(createAdapter(pubClient, subClient));

    console.log("Redis Adapter Connected");
  } catch (error) {
    console.error("Redis Adapter Error:", error);
  }
};

setupRedisAdapter();

// Error handler LAST
app.use(errorHandler);

// Start server
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the running process or set a different PORT in .env.`);
    process.exit(1);
  }
  console.error("Server start error:", error);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});