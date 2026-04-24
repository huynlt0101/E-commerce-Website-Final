const express = require("express");
const router = express.Router();
const {
  createMomoPayment,
  momoIpn,
  momoReturn,
} = require("../controllers/momoController");
const { protect } = require("../middleware/auth");

router.post("/create", protect, createMomoPayment);
router.post("/ipn", momoIpn);
router.get("/return", momoReturn);

module.exports = router;