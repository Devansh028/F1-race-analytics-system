const mongoose = require("mongoose");
const Driver = require("../models/Driver");

mongoose.connect("mongodb://127.0.0.1:27017/f1");

const seedDrivers = async () => {
  try {
    await Driver.deleteMany(); // optional (clean old data)

    await Driver.insertMany([
      { name: "Hamilton", team: "Mercedes", skillRating: 95 },
      { name: "Verstappen", team: "Red Bull", skillRating: 98 },
      { name: "Leclerc", team: "Ferrari", skillRating: 92 },
      { name: "Norris", team: "McLaren", skillRating: 90 },
      { name: "Alonso", team: "Aston Martin", skillRating: 91 },
    ]);

    console.log("Drivers inserted ✅");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedDrivers();