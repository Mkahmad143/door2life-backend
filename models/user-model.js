const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: String,
  phone: String,
  email: { type: String, unique: true },
  referralCode: { type: String, unique: true, required: true },
  referredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  amount: { type: Number, default: 0 },
  doorStatus: {
    1: { type: Boolean, default: true },
    2: { type: Boolean, default: false },
    3: { type: Boolean, default: false },
    4: { type: Boolean, default: false },
    5: { type: Boolean, default: false },
    6: { type: Boolean, default: false },
    7: { type: Boolean, default: false },
    8: { type: Boolean, default: false },
    9: { type: Boolean, default: false },
    10: { type: Boolean, default: false },
    11: { type: Boolean, default: false },
    12: { type: Boolean, default: false },
    13: { type: Boolean, default: false },
    14: { type: Boolean, default: false },
  },
  paymentRequests: [
    {
      recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      amount: { type: Number, required: true },
      door: { type: Number, required: true },
      status: {
        type: String,
        enum: ["pending", "paid", "waiting for approval"],
        default: "pending",
      },
    },
  ],
  pendingPayments: [
    {
      requester: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      amount: { type: Number, required: true },
    },
  ],
});

userSchema.pre("save", async function (next) {
  const user = this;

  // Skip if the password is not modified
  if (!user.isModified("password")) {
    return next();
  }

  try {
    // Hash the new password
    const saltRound = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, saltRound);
    next(); // Continue to save the user
  } catch (error) {
    next(error); // Handle any errors
  }
});

userSchema.methods.generateToken = async function () {
  try {
    return jwt.sign(
      {
        userId: this._id.toString(),
        email: this.email,
        password: this.password,
      },
      process.env.JWT_TOKEN,
      {
        expiresIn: "30d",
      }
    );
  } catch (error) {
    console.log(error);
  }
};

const User = new mongoose.model("User", userSchema);

module.exports = User;
