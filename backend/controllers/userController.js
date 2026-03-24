const User = require("../models/User");

// GET /api/users?search=&page=1&limit=10&role=user&isActive=true
exports.getAllUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, role, isActive } = req.query;

    const query = {};

    if (role) query.role = role; // user/admin
    if (isActive !== undefined) query.isActive = isActive === "true";

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/users/stats
exports.getUserStats = async (req, res) => {
  try {
    const [totalUsers, activeUsers, bannedUsers, admins] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ role: "admin" })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        bannedUsers,
        admins
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getTotalUsers = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    return res.status(200).json({
      success: true,
      totalUsers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};