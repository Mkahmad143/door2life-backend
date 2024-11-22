const User = require("../../models/user-model");

const paymentRequest = async (req, res) => {
  const { requesterId, recipientId, amount, door } = req.body;
  console.log(req.body);

  try {
    // Fetch users from the database
    const requester = await User.findById(requesterId);
    const recipient = await User.findById(recipientId);

    // Validate users
    if (!requester || !recipient) {
      return res
        .status(404)
        .json({ message: "Requester or recipient not found." });
    }

    // Check if a request already exists for the same door
    const existingRequest = requester.paymentRequests.find(
      (request) =>
        (request.recipient.toString() === recipientId &&
          request.door === door) ||
        request.status === ("pending" || "waiting for approval")
    );

    // Prevent multiple requests for the same door
    if (existingRequest) {
      return res.status(400).json({
        message:
          "A payment request for this door already exists, regardless of its status.",
      });
    }

    // Create new payment request
    const newRequest = {
      recipient: recipientId,
      amount,
      door: door,
      status: "pending", // Set initial status to "pending"
    };

    // Update requester and recipient records
    requester.paymentRequests.push(newRequest);
    recipient.pendingPayments.push({
      requester: requesterId,
      amount,
      door,
    });

    // Save updates
    await requester.save();
    await recipient.save();

    // Respond with success
    res.status(201).json({ message: "Payment request created successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

module.exports = paymentRequest;

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
    const requester = await User.findById(requesterId);
    const recipient = await User.findById(recipientId);

    if (!requester || !recipient) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the payment request in the requester's paymentRequests
    const paymentRequest = requester.paymentRequests.find(
      (r) =>
        r.recipient.toString() === recipientId &&
        r.status === "waiting for approval"
    );

    if (!paymentRequest) {
      return res.status(404).json({
        message: "Payment request not found or not ready for payment",
      });
    }

    // Update status to "paid"
    paymentRequest.status = "paid";

    // Remove the payment request from the recipient's paymentRequests
    recipient.paymentRequests = recipient.paymentRequests.filter(
      (r) =>
        !(
          r.sender.toString() === requesterId &&
          r.status === "waiting for approval"
        )
    );

    // Save changes to both users
    await requester.save();
    await recipient.save();

    res.status(200).json({
      message: "Payment marked as paid and removed from recipient.",
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
    // Extract the IDs as strings
    const paymentIds = user.pendingPayments.map((payment) =>
      payment._id.toString()
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};
const markAsWaitingForApproval = async (req, res) => {
  const { requesterId, recipientId } = req.body;

  try {
    const recipient = await User.findById(recipientId);
    const requester = await User.findById(requesterId);

    if (!recipient || !requester) {
      return res.status(404).json({ message: "User not found" });
    }

    const request = recipient.pendingPayments.find(
      (payment) => payment.requester.toString() === requesterId
    );

    if (!request) {
      return res
        .status(404)
        .json({ message: "Payment request not found in pendingPayments" });
    }

    // Update the status to "waiting for approval" in the requester's paymentRequests
    const paymentRequest = requester.paymentRequests.find(
      (r) => r.recipient.toString() === recipientId && r.status === "pending"
    );

    if (!paymentRequest) {
      return res
        .status(404)
        .json({ message: "Payment request not found for requester" });
    }

    paymentRequest.status = "waiting for approval";

    await recipient.save();
    await requester.save();

    res.status(200).json({
      message: "Payment marked as waiting for approval.",
    });
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
  markAsWaitingForApproval,
};
