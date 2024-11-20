const PaymentRequest = require("../../models/message-model");
const User = require("../../models/user-model");

// Create a payment request
const paymentRequest = async (req, res) => {
  const { requesterId, recipientId, amount } = req.body;

  try {
    const requester = await User.findById(requesterId);
    const recipient = await User.findById(recipientId);

    if (!requester || !recipient) {
      return res
        .status(404)
        .json({ message: "Requester or recipient not found" });
    }

    // Add payment request to requester's schema
    requester.paymentRequests.push({
      recipient: recipientId,
      amount,
      status: "pending",
    });

    // Add to recipient's pendingPayments
    recipient.pendingPayments.push({
      requester: requesterId,
      amount,
    });

    await requester.save();
    await recipient.save();

    res.status(201).json({ message: "Payment request created successfully." });
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
      "username email doorStatus"
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
    // Find the requester and recipient
    const requester = await User.findById(requesterId);
    const recipient = await User.findById(recipientId);

    if (!requester || !recipient) {
      return res.status(404).json({ message: "User not found" });
    }

    const request = requester.paymentRequests.find(
      (r) => r.recipient.toString() === recipientId && r.status === "pending"
    );

    if (!request) {
      return res
        .status(404)
        .json({ message: "Pending payment request not found" });
    }

    // Mark the payment as paid in the requester's schema
    request.status = "paid";

    // Remove the payment request from the recipient's pendingPayments
    recipient.pendingPayments = recipient.pendingPayments.filter(
      (payment) => payment.requester.toString() !== requesterId
    );

    await requester.save();
    await recipient.save();

    const paidCount = requester.paymentRequests.filter(
      (payment) => payment.status === "paid"
    ).length;

    const totalDoors = 14;
    const paymentsPerDoor = 8;

    const doorIndex = Math.floor(paidCount / paymentsPerDoor);
    console.log(doorIndex);

    if (doorIndex < totalDoors) {
      requester.doorStatus[doorIndex + 1] = true;
      console.log(`Door ${doorIndex} unlocked!`);
    }

    await requester.save();

    res.status(200).json({
      message: "Payment marked as paid and doors updated.",
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
const getPendingPayments = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).populate(
      "pendingPayments.requester",
      "username email phone doorStatus"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.pendingPayments);
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
  getPendingPayments,
};
