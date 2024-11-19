const express = require("express");
const router = express.Router();
const {
  getUserById,
  deleteUser,
  updateUser,
  getUserByEmail,
} = require("../../Controllers/User-controller/userController");

// Define the route to get user data by ID
router.post("/get", getUserByEmail);
router.get("/:id", getUserById);

router.delete("/:id", deleteUser);
router.patch("/:id", updateUser);

module.exports = router;
