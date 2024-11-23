const express = require("express");
const router = express.Router();
const {
  getUserById,
  deleteUser,
  updateUser,

  doorStatus,
  getAllUsers,
} = require("../../Controllers/User-controller/userController");

// Define the route to get user data by ID
router.get("/get", getAllUsers);
router.get("/:id", getUserById);

router.delete("/:id", deleteUser);
router.patch("/:id", updateUser);
router.get("/door-status/:id", doorStatus), (module.exports = router);
