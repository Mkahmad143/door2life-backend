const User = require("../../models/user-model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ Error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ Error: "Server Error" });
  }
};
const getUserByEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user by email:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, password } = req.body;

  try {
    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update fields if provided
    if (username) user.username = username;
    if (email) user.email = email;
    if (password) user.password = password; // Just assign, let pre('save') handle hashing

    // Save user (called only once)
    const updatedUser = await user.save();

    res.status(200).json({
      message: "User updated successfully",
      user: {
        username: updatedUser.username,
        email: updatedUser.email,
        password: updatedUser.password,
        referralCode: updatedUser.referralCode, // Keep referralCode intact
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if the user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    console.log(id);
    // Delete the user
    await User.findByIdAndDelete(id);

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getUserById, deleteUser, updateUser, getUserByEmail };
