const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");

function normalizeShippingAddress(shippingAddress = {}) {
  return {
    fullName: String(shippingAddress.fullName || "").trim(),
    phone: String(shippingAddress.phone || "").trim(),

    provinceId: String(
      shippingAddress.provinceId || shippingAddress.provinceCode || ""
    ).trim(),
    provinceName: String(shippingAddress.provinceName || "").trim(),

    districtId: String(shippingAddress.districtId || "").trim(),
    districtName: String(shippingAddress.districtName || "").trim(),

    wardId: String(
      shippingAddress.wardId || shippingAddress.wardCode || ""
    ).trim(),
    wardName: String(shippingAddress.wardName || "").trim(),

    addressLine: String(shippingAddress.addressLine || "").trim(),
    note: String(shippingAddress.note || "").trim(),
  };
}

function validateShippingAddress(normalizedShippingAddress) {
  const requiredFields = [
    "fullName",
    "phone",
    "provinceId",
    "wardId",
    "addressLine",
  ];

  for (const field of requiredFields) {
    if (!normalizedShippingAddress[field]) {
      return `Thiếu trường: ${field}`;
    }
  }

  return null;
}

async function deductInventoryForOrder(order) {
  if (!order || order.inventoryDeducted) return;

  for (const item of order.items) {
    const updated = await Product.findOneAndUpdate(
      {
        _id: item.product,
        quantity: { $gte: item.qty },
      },
      {
        $inc: { quantity: -item.qty },
      },
      { new: true }
    );

    if (!updated) {
      throw new Error(`Sản phẩm "${item.name}" không đủ tồn kho`);
    }
  }

  order.inventoryDeducted = true;
}

exports.createOrder = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    const { shippingAddress, items, paymentMethod } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({ message: "Thiếu thông tin giao hàng" });
    }

    const normalizedShippingAddress = normalizeShippingAddress(shippingAddress);
    const shippingError = validateShippingAddress(normalizedShippingAddress);
    if (shippingError) {
      return res.status(400).json({ message: shippingError });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    const productIds = items.map((it) => it.productId).filter(Boolean);
    if (!productIds.every((id) => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ message: "productId không hợp lệ" });
    }

    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    });

    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const orderItems = [];
    let subtotal = 0;

    for (const it of items) {
      const pid = String(it.productId || "");
      const qty = Number(it.qty || 0);

      if (!pid || !productMap.has(pid)) {
        return res.status(400).json({
          message: "Có sản phẩm không tồn tại / đã ẩn",
        });
      }

      if (!Number.isFinite(qty) || qty < 1) {
        return res.status(400).json({ message: "Số lượng không hợp lệ" });
      }

      const p = productMap.get(pid);

      if (Number(p.quantity || 0) < qty) {
        return res.status(400).json({
          message: `Sản phẩm "${p.name}" không đủ tồn kho`,
        });
      }

      const price = Number(p.price || 0);
      subtotal += price * qty;

      orderItems.push({
        product: p._id,
        name: p.name,
        price,
        image: p.image || "",
        qty,
      });
    }

    const shippingFee = 0;
    const total = subtotal + shippingFee;
    const selectedPaymentMethod =
      String(paymentMethod || "COD").toUpperCase() === "MOMO" ? "MOMO" : "COD";

    const order = await Order.create({
      user: userId,
      shippingAddress: normalizedShippingAddress,
      items: orderItems,
      subtotal,
      shippingFee,
      total,
      paymentMethod: selectedPaymentMethod,
      paymentStatus: selectedPaymentMethod === "MOMO" ? "pending" : "unpaid",
      isPaid: false,
      status: 0,
      inventoryDeducted: false,
    });

    return res.status(201).json({
      message: "Tạo đơn hàng thành công",
      data: order,
    });
  } catch (err) {
    console.error("createOrder error:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    const orders = await Order.find({ user: userId })
      .populate("user", "username email phone fullName")
      .populate("items.product", "name image price quantity")
      .sort({ createdAt: -1 });

    return res.json({ data: orders });
  } catch (err) {
    console.error("getMyOrders error:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Order id không hợp lệ" });
    }

    const order = await Order.findById(id)
      .populate("user", "username email phone fullName")
      .populate("items.product", "name image price quantity");

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    const isOwner = String(order.user?._id || order.user) === String(userId);
    const isAdmin =
      req.user?.role === "admin" ||
      req.user?.isAdmin === true ||
      req.user?.role === 1;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Bạn không có quyền xem đơn này" });
    }

    return res.json({ data: order });
  } catch (err) {
    console.error("getOrderById error:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "username email phone fullName sdt")
      .populate("items.product", "name image price quantity")
      .sort({ createdAt: -1 });

    return res.json({ data: orders });
  } catch (err) {
    console.error("getAllOrders error:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Order id không hợp lệ" });
    }

    const s = Number(status);
    if (![0, 1].includes(s)) {
      return res.status(400).json({ message: "Status chỉ được 0 hoặc 1" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    if (s === 1) {
      if (order.paymentMethod === "COD" && !order.inventoryDeducted) {
        await deductInventoryForOrder(order);
      }

      order.status = 1;

      if (order.paymentMethod === "COD" && !order.isPaid) {
        order.paymentStatus = "unpaid";
      }
    } else {
      order.status = 0;
    }

    await order.save();

    return res.json({
      message: "Cập nhật trạng thái thành công",
      data: order,
    });
  } catch (err) {
    console.error("updateOrderStatus error:", err);
    return res.status(500).json({ message: err.message || "Lỗi server" });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Order id không hợp lệ" });
    }

    const allow = ["unpaid", "pending", "paid", "failed", "refunded"];
    if (!allow.includes(paymentStatus)) {
      return res.status(400).json({ message: "paymentStatus không hợp lệ" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    order.paymentStatus = paymentStatus;

    if (paymentStatus === "paid") {
      if (!order.inventoryDeducted) {
        await deductInventoryForOrder(order);
      }
      order.isPaid = true;
      order.paidAt = order.paidAt || new Date();
    }

    if (paymentStatus === "failed" || paymentStatus === "unpaid") {
      if (!order.isPaid) {
        order.paidAt = null;
      }
    }

    await order.save();

    return res.json({
      message: "Cập nhật trạng thái thanh toán thành công",
      data: order,
    });
  } catch (err) {
    console.error("updatePaymentStatus error:", err);
    return res.status(500).json({ message: err.message || "Lỗi server" });
  }
};

exports.getTotalOrders = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();

    return res.json({
      success: true,
      totalOrders,
    });
  } catch (err) {
    console.error("getTotalOrders error:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

exports.getMonthlyOrderStats = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();

    const startDate = new Date(year, 0, 1, 0, 0, 0, 0);
    const endDate = new Date(year + 1, 0, 1, 0, 0, 0, 0);

    const matchStage = {
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
      status: 1,
    };

    const revenueOrdersStats = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const soldStats = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      {
        $group: {
          _id: { $month: "$createdAt" },
          sold: { $sum: "$items.qty" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const monthlyStats = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      label: `T${i + 1}`,
      revenue: 0,
      orders: 0,
      sold: 0,
    }));

    for (const item of revenueOrdersStats) {
      const monthIndex = item._id - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyStats[monthIndex].revenue = item.revenue || 0;
        monthlyStats[monthIndex].orders = item.orders || 0;
      }
    }

    for (const item of soldStats) {
      const monthIndex = item._id - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyStats[monthIndex].sold = item.sold || 0;
      }
    }

    const totalRevenue = monthlyStats.reduce((sum, m) => sum + m.revenue, 0);
    const totalOrders = monthlyStats.reduce((sum, m) => sum + m.orders, 0);
    const totalSold = monthlyStats.reduce((sum, m) => sum + m.sold, 0);

    return res.json({
      success: true,
      year,
      monthlyStats,
      summary: {
        totalRevenue,
        totalOrders,
        totalSold,
      },
    });
  } catch (error) {
    console.error("getMonthlyOrderStats error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê đơn hàng theo tháng",
    });
  }
};


exports.getOrderPaymentStatus = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Order id không hợp lệ" });
    }

    const order = await Order.findById(id).select(
      "_id paymentMethod paymentStatus isPaid paidAt status total momo createdAt updatedAt user"
    );

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    if (String(order.user) !== String(userId)) {
      return res.status(403).json({ message: "Bạn không có quyền xem đơn này" });
    }

    return res.json({
      message: "Lấy trạng thái thanh toán thành công",
      data: {
        _id: order._id,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        isPaid: order.isPaid,
        paidAt: order.paidAt,
        status: order.status,
        total: order.total,
        momo: {
          orderId: order.momo?.orderId || "",
          transId: order.momo?.transId || "",
          resultCode: order.momo?.resultCode,
          message: order.momo?.message || "",
        },
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (err) {
    console.error("getOrderPaymentStatus error:", err);
    return res.status(500).json({
      message: err.message || "Lỗi server khi lấy trạng thái thanh toán",
    });
  }
};