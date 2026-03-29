const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const { sendNewPasswordMail } = require("../middleware/mailer");
// Tạo JWT token
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d'
  });
};

// Đăng ký
// Đăng ký
exports.register = async (req, res) => {
  try {
    const { username, email, phone, password, confirmPassword } = req.body;

    //  Validate input
    if (!username || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin'
      });
    }

    //  Check mật khẩu xác nhận
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu xác nhận không khớp'
      });
    }

    // 3️⃣ Kiểm tra trùng user
    const existingUser = await User.findOne({
      $or: [{ email }, { username }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email, tên người dùng hoặc số điện thoại đã tồn tại'
      });
    }

    //  Tạo user mới
    const user = await User.create({
      username,
      email,
      phone,
      password
    });

    // 5️⃣ Tạo JWT
    const token = createToken(user._id);

    // 6️⃣ Response thành công
    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (error) {
    // Bắt lỗi validate mongoose (email trùng, phone trùng…)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Thông tin đăng ký đã tồn tại'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

    // Tìm user (có select password)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Kiểm tra password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Kiểm tra tài khoản có active không
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản đã bị khóa'
      });
    }

    // Tạo token
    const token = createToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Lấy thông tin user hiện tại
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Cập nhật profile
exports.updateProfile = async (req, res) => {
  try {
    const { username, phone, password } = req.body;
    const userId = req.user._id;

    // Tìm user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      });
    }

    // Cập nhật thông tin
    if (username) user.username = username;
    if (phone) user.phone = phone;
    if (password) user.password = password; // Sẽ tự động hash nhờ pre-save hook

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// tạo mật khẩu ngẫu nhiên (8-12 ký tự) dễ dùng
function generatePassword(length = 10) {
 
  return crypto.randomBytes(8).toString("base64").replace(/[+/=]/g, "").slice(0, length);
}

// POST /api/auth/forgot-password
 exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập email" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

    if (!user) {
      return res.status(404).json({ success: false, message: "Email không tồn tại trong hệ thống" });
    }

    const newPassword = generatePassword(10);
    user.password = newPassword;
    await user.save();

    await sendNewPasswordMail(user.email, newPassword);

    return res.json({ success: true, message: "Mật khẩu mới đã được gửi, vui lòng kiểm tra email." });
  } catch (err) {
    console.error("forgotPassword error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
