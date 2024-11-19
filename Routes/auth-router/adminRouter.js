// routes/adminRoutes.js
const express = require("express");
const {
  adminRegister,
  adminLogin,
} = require("../../Controllers/auth-controller/adminController");

const router = express.Router();

// Admin Registration
router.post("/register", adminRegister);

// Admin Login
router.post("/login", adminLogin);

module.exports = router;
