const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const { seedDrivers, seedCircuits } = require("../controllers/seedController");

const router = express.Router();

router.get("/drivers", protect, authorize("ADMIN"), seedDrivers);
router.get("/circuits", protect, authorize("ADMIN"), seedCircuits);

module.exports = router;
