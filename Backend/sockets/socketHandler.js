const mongoose = require("mongoose");

const setupSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join only valid race rooms
    socket.on("joinRace", (raceId) => {
      if (!mongoose.Types.ObjectId.isValid(raceId)) {
        return;
      }
      socket.join(raceId);
      console.log(`User joined race room: ${raceId}`);
    });

    // Leave race room
    socket.on("leaveRace", (raceId) => {
      if (!mongoose.Types.ObjectId.isValid(raceId)) {
        return;
      }
      socket.leave(raceId);
      console.log(`User left race room: ${raceId}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

module.exports = setupSocket;