const router = require("express").Router();
const { getAllUsers, getTotalUsers } = require("../controllers/userController");

router.get("/", getAllUsers);


router.get("/total", getTotalUsers);

module.exports = router;