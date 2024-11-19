const express = require("express");
const router = express.Router();
const MainBank = require("../../models/bank-Model");

const getBank = async (req, res) => {
  try {
    const donations = await MainBank.find().sort({ date: -1 });
    res.status(200).json(donations);
  } catch (error) {
    console.error("Error fetching donations:", error);
    res.status(500).json({ Error: "Server Error" });
  }
};

module.exports = { getBank };
