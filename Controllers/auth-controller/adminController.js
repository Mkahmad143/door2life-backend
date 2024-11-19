// controllers/adminController.js
const Admin = require("../../models/admin-Model");
const bcrypt = require("bcryptjs");

//! Admin Register -Router
const adminRegister = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ Error: "Please Provide All Data" });
    }

    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ Error: "Email Already Exists" });
    }

    // Create a new admin
    const newAdmin = new Admin({ username, email, password });
    await newAdmin.save();

    res.status(201).json({
      successMessage: "Admin account created successfully",
      adminId: newAdmin._id,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ Error: "Server Error" });
  }
};

//! Admin Login -Router
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ Error: "Please Provide Email and Password" });
    }

    const adminExist = await Admin.findOne({ email });
    if (!adminExist) {
      return res.status(400).json({
        Error: "Admin email not found, please contact support",
      });
    }

    const isMatch = await bcrypt.compare(password, adminExist.password);

    if (isMatch) {
      res.status(200).json({
        successMessage: "Admin login successful",
        token: await adminExist.generateToken(),
        adminId: adminExist._id,
        admin: adminExist,
      });
    } else {
      res.status(400).json({ Error: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ Error: "Server Error" });
    console.log(error);
  }
};

module.exports = { adminRegister, adminLogin };
