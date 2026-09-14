const express = require("express");
const { active } = require("../controllers/taxController");

const router = express.Router();

router.get("/active", active);

module.exports = router;
