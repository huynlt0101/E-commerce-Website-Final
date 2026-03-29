const router = require("express").Router();
const controller = require("../controllers/categoryController");

router.get("/", controller.getCategories);
router.get("/:id", controller.getCategoryById);
router.post("/", controller.createCategory);
router.put("/:id", controller.updateCategory);
router.delete("/:id", controller.deleteCategory);
router.patch("/:id/toggle", controller.toggleCategoryStatus);

module.exports = router;
