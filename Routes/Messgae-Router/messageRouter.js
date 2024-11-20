const express = require("express");

const router = express.Router();
const messageController = require("../../Controllers/message-Controller/messageController");

router.get("/payment-requests/:id", messageController.getPayment);
router.post("/payment-requests", messageController.paymentRequest);
router.patch("/payment-requests/:id", messageController.markAsPaid);
router.get("/pending-requests/:id", messageController.getPendingPayments);

router.delete(
  "/delete-payment-request",
  messageController.deletePaymentRequest
);

module.exports = router;
