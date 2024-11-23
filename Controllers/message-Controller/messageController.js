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

    // Check if any request exists for the same door (regardless of status)
    const existingRequest = requester.paymentRequests.find(
      (request) =>
        request.recipient.toString() === recipientId &&
        request.door === door &&
        ["pending", "waiting for approval", "paid"].includes(request.status)
    );
    console.log("existingRequest", existingRequest);

    // Prevent any request if one already exists in any of these statuses
    if (existingRequest) {
      return res.status(400).json({
        message: `Cannot create new request. A payment request for door ${door} already exists with status: ${existingRequest.status}`,
      });
    }

    // Create new payment request
    const newRequest = {
      recipient: recipientId,
      amount,
      door: door,
      status: "pending",
      createdAt: new Date(), // Adding timestamp for better tracking
    };

    // Update requester and recipient records
    requester.paymentRequests.push(newRequest);
    recipient.pendingPayments.push({
      requester: requesterId,
      amount,
      door,
      createdAt: new Date(),
    });

    // Save updates
    await requester.save();
    await recipient.save();

    // Respond with success
    res.status(201).json({
      message: "Payment request created successfully.",
      request: newRequest,
    });
  } catch (error) {
    console.error("Payment request error:", error);
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

    // Update payment status
    paymentRequest.status = "paid";

    // Remove pending payment
    recipient.pendingPayments = recipient.pendingPayments.filter(
      (r) => r.requester.toString() !== requesterId
    );

    // Count paid payments for current door
    const currentDoor = paymentRequest.door;
    const paidPaymentsForDoor = requester.paymentRequests.filter(
      (r) => r.door === currentDoor && r.status === "paid"
    ).length;

    let responseMessage = "Payment marked as paid.";
    let doorUnlocked = false;

    // Handle door 14 completion and reset
    if (currentDoor === 14 && paidPaymentsForDoor >= 8) {
      // Reset doors
      for (let i = 2; i <= 14; i++) {
        requester.doorStatus[i] = false;
      }
      requester.doorStatus[1] = true;

      // Clear payment requests
      requester.paymentRequests = [];

      responseMessage += ` Congratulations! You've completed Door 14! All doors have been reset. Start again from Door 1.`;
    }
    // Normal door progression
    else if (currentDoor < 14 && paidPaymentsForDoor >= 8) {
      const nextDoor = currentDoor + 1;

      if (!requester.doorStatus[nextDoor]) {
        requester.doorStatus[nextDoor] = true;
        doorUnlocked = true;
        responseMessage += ` Congratulations! Door ${nextDoor} has been unlocked. Start making payments for Door ${nextDoor} to progress further.`;
      }
    }

    // Add remaining payments info
    if (!doorUnlocked && currentDoor < 14) {
      const remainingPayments = 8 - paidPaymentsForDoor;
      responseMessage += ` Need ${remainingPayments} more paid payments to unlock next door.`;
    }

    await requester.save();
    await recipient.save();

    res.status(200).json({
      message: responseMessage,
      currentDoor,
      paidPayments: paidPaymentsForDoor,
      remainingPayments: currentDoor === 14 ? 8 : 8 - paidPaymentsForDoor,
      doorUnlocked,
      doorStatus: requester.doorStatus,
    });
  } catch (error) {
    console.error("Mark as paid error:", error);
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
      "username email phone doorStatus paymentRequests"
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
