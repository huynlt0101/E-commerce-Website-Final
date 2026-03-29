const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser,  updateProfile   } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { forgotPassword } = require("../controllers/authController");

router.post("/forgot-password", forgotPassword);
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getCurrentUser);
router.put('/profile', protect, updateProfile);  // ← Thêm route mớ

module.exports = router;