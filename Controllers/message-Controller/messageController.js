const PaymentRequest = require("../../models/message-model");
const User = require("../../models/user-model");

// Create a payment request
const paymentRequest = async (req, res) => {
  const { requesterId, recipientId, amount } = req.body;

  try {
    // Find the requester and recipient
    const requester = await User.findById(requesterId);
    const recipient = await User.findById(recipientId);

    if (!requester || !recipient) {
      return res
        .status(404)
        .json({ message: "Requester or recipient not found" });
    }

    // Add the payment request to the requester's schema
    requester.paymentRequests.push({
      recipient: recipientId,
      amount,
      status: "pending",
    });

    const response = await requester.save();

    // Respond with success
    res.status(201).json({
      res: response,
      message: "Payment request created successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

const getPayment = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).populate(
      "paymentRequests.recipient",
      "username email"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.paymentRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

const markAsPaid = async (req, res) => {
  const { requesterId, recipientId } = req.body;

  try {
    // Find the requester
    const requester = await User.findById(requesterId);

    if (!requester) {
      return res.status(404).json({ message: "Requester not found" });
    }

    // Find the specific payment request
    const request = requester.paymentRequests.find(
      (r) => r.recipient.toString() === recipientId && r.status === "pending"
    );

    if (!request) {
      return res
        .status(404)
        .json({ message: "Pending payment request not found" });
    }

    // Mark the payment as paid
    request.status = "paid";

    // Save the updated user
    await requester.save();

    // Check the total number of paid payments
    const paidCount = requester.paymentRequests.filter(
      (payment) => payment.status === "paid"
    ).length;

    // Unlock doors in increments of 8 paid payments
    for (let i = 1; i <= 14; i++) {
      if (paidCount >= i * 8 && !requester.doorStatus[i]) {
        requester.doorStatus[i] = true; // Unlock the i-th door
      }
    }

    // Save the updated door status
    await requester.save();

    res.status(200).json({
      message: "Payment marked as paid.",
      doorStatus: requester.doorStatus,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

const deletePaymentRequest = async (req, res) => {
  const { requesterId, requestId } = req.body; // requesterId: user ID, requestId: payment request ID

  try {
    const requester = await User.findById(requesterId);

    if (!requester) {
      return res.status(404).json({ message: "Requester not found" });
    }

    const updatedRequests = requester.paymentRequests.filter(
      (request) => request._id.toString() !== requestId
    );

    if (updatedRequests.length === requester.paymentRequests.length) {
      return res.status(404).json({ message: "Payment request not found" });
    }

    // Update the requester's paymentRequests
    requester.paymentRequests = updatedRequests;

    await requester.save();

    res.status(200).json({ message: "Payment request deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

module.exports = {
  paymentRequest,
  getPayment,
  markAsPaid,
  deletePaymentRequest,
};
