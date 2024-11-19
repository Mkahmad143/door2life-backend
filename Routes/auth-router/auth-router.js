const express = require("express");
const controller = require("../../Controllers/auth-controller/auth-controller");

const router = express.Router();

router.route("/").get(controller.home);
router.route("/register").post(controller.register);
router.route("/login").post(controller.login);

module.exports = router;
