const { mongoose } = require("mongoose");

const paymentRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: { type: Number, required: true },
  door: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "paid", "waiting for approval"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

const PaymentRequest = mongoose.model("PaymentRequest", paymentRequestSchema);

module.exports = PaymentRequest;
