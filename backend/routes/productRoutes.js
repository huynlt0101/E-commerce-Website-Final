const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const productCtrl = require("../controllers/productController");

router.get("/category/:categoryId", productCtrl.getProductsByCategory);
// CRUD
router.post("/", upload.single("image"), productCtrl.createProduct);
router.get("/", productCtrl.getAllProducts);

router.get("/total", productCtrl.getTotalProducts);
router.get("/:id", productCtrl.getProductById);
router.put("/:id", upload.single("image"), productCtrl.updateProduct);
router.delete("/:id", productCtrl.deleteProduct);

module.exports = router;
