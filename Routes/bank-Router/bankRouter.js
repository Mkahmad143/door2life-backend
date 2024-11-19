const express = require("express");
const router = express.Router();
const { getBank } = require("../../Controllers/bank-Controller/bankController");

// Define the route to get user data by ID
router.get("/main-bank", getBank);

module.exports = router;
