const Telemetry = require("../models/Telemetry");

exports.getTelemetryByDriver = async (req, res) => {
  const { driverId } = req.params;

  const data = await Telemetry.find({ driverId })
    .sort({ lap: 1 });

  res.json(data);
};