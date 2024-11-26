const User = require("../../models/user-model");
const bcrypt = require("bcryptjs");
const MainBank = require("../../models/bank-Model");

//!Home -Router

const home = async (req, res) => {
  try {
    res.status(200).send("hello from the server using control");
  } catch (error) {
    res.status(404).json("not found");
  }
};

//!Register -Router

const register = async (req, res) => {
  try {
    const { username, password, email, phone, referralCode, amount } = req.body;

    if (
      !username ||
      !password ||
      !email ||
      !phone ||
      !referralCode ||
      !amount
    ) {
      return res.status(400).json({ Error: "Please Provide All Data" });
    }

    // Check if email is already used
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ Error: "Email Already Exists" });
    }

    // Generate a unique referral code (e.g., a short random string)
    const generatedReferralCode = Math.random().toString(36).substring(2, 8);

    // Create a new user
    const newUser = new User({
      username,
      password,
      email,
      phone,
      amount, // Save the initial donation amount
      referralCode: generatedReferralCode,
    });

    // If a referral code was provided, link the accounts
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });

      if (referrer) {
        if (referrer.referredBy.length >= 2) {
          return res.status(400).json({
            Error:
              "Referral code limit reached. Cannot use this referral code.",
          });
        }

        referrer.referredBy.push(newUser._id);
        await referrer.save();
      } else {
        return res.status(400).json({ Error: "Invalid Referral Code" });
      }
    }

    // Save the new user
    await newUser.save();

    // Save the donation to the Main Bank
    const mainBankEntry = new MainBank({
      name: username,
      email: email,
      amount: amount,
    });

    await mainBankEntry.save();

    res.status(201).json({
      successMessage: "Successfully registered and created account",
      userId: newUser._id,
      referralCode: generatedReferralCode,
      amount: newUser.amount,
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ Error: "Server Error" });
  }
};

//!Login -Router

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Compare provided password with hashed password in the database
    console.log("password: " + password);
    console.log("Hashpassword: " + user.password);

    const isMatch = await bcrypt.compare(password, user.password);
    console.log(isMatch);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { home, register, login };
