const router = require("express").Router();
const orderCtrl = require("../controllers/orderController");
const { protect } = require("../middleware/auth");

// ===== USER =====
router.post("/", protect, orderCtrl.createOrder);
router.get("/my", protect, orderCtrl.getMyOrders);

router.get("/:id/payment-status", protect, orderCtrl.getOrderPaymentStatus);

// ===== ADMIN / SYSTEM =====
router.get("/", protect, orderCtrl.getAllOrders);
router.patch("/:id/status", protect, orderCtrl.updateOrderStatus);
router.get("/total", protect, orderCtrl.getTotalOrders);
router.get("/stats/monthly", protect, orderCtrl.getMonthlyOrderStats);

module.exports = router;