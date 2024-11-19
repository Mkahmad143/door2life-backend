const express = require("express");
const refController = require("../../Controllers/Refferal-Controller/referralController");

const router = express.Router();

router.route("/:userId").get(refController.getReferralTree);
module.exports = router;
