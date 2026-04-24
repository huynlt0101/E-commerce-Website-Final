const https = require("https");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const {
  buildCreateSignature,
  verifyMomoIpnSignature,
} = require("../utils/momo");

function postJson(urlString, bodyObject) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(bodyObject);
    const url = new URL(urlString);

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + (url.search || ""),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
      timeout: 30000,
    };

    const req = https.request(options, (res) => {
      let raw = "";

      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        raw += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = raw ? JSON.parse(raw) : {};
          resolve({
            statusCode: res.statusCode,
            data: parsed,
          });
        } catch (err) {
          reject(new Error("Phản hồi từ MoMo không phải JSON hợp lệ"));
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy(new Error("Kết nối MoMo bị timeout"));
    });

    req.write(body);
    req.end();
  });
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
      throw new Error(`Sản phẩm "${item.name}" không đủ tồn kho để trừ`);
    }
  }

  order.inventoryDeducted = true;
}

exports.createMomoPayment = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    const { orderId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "orderId không hợp lệ" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    if (String(order.user) !== String(userId)) {
      return res.status(403).json({ message: "Bạn không có quyền với đơn này" });
    }

    if (order.paymentMethod !== "MOMO") {
      return res.status(400).json({ message: "Đơn này không dùng thanh toán MoMo" });
    }

    if (order.isPaid || order.paymentStatus === "paid") {
      return res.status(400).json({ message: "Đơn hàng đã thanh toán" });
    }

    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const endpoint = process.env.MOMO_ENDPOINT;
    const redirectUrl = process.env.MOMO_REDIRECT_URL;
    const ipnUrl = process.env.MOMO_IPN_URL;

    if (!partnerCode || !accessKey || !endpoint || !redirectUrl || !ipnUrl) {
      return res.status(500).json({ message: "Thiếu cấu hình MoMo trong .env" });
    }

    const requestId = `${partnerCode}_${Date.now()}`;
    const momoOrderId = `ORDER_${order._id}_${Date.now()}`;
    const orderInfo = `Thanh toan don hang ${order._id}`;
    const amount = String(Math.round(order.total));
    const requestType = "payWithCC";
    const extraData = "";

    const { signature } = buildCreateSignature({
      accessKey,
      amount,
      extraData,
      ipnUrl,
      orderId: momoOrderId,
      orderInfo,
      partnerCode,
      redirectUrl,
      requestId,
      requestType,
    });

    const requestBody = {
      partnerCode,
      accessKey,
      requestId,
      amount,
      orderId: momoOrderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: "vi",
    };

    const momoRes = await postJson(endpoint, requestBody);
    const data = momoRes.data || {};

    order.paymentStatus = "pending";
    order.momo = {
      requestId,
      orderId: momoOrderId,
      transId: data.transId ? String(data.transId) : "",
      resultCode: typeof data.resultCode === "number" ? data.resultCode : null,
      message: data.message || "",
      payUrl: data.payUrl || "",
      deeplink: data.deeplink || "",
      qrCodeUrl: data.qrCodeUrl || "",
      rawResponse: data,
      ipnConfirmedAt: null,
    };

    await order.save();

    if (data.resultCode !== 0) {
      return res.status(400).json({
        message: data.message || "Không tạo được link thanh toán MoMo",
        data,
      });
    }

    return res.json({
      message: "Tạo link thanh toán MoMo thành công",
      payUrl: data.payUrl || "",
      deeplink: data.deeplink || "",
      qrCodeUrl: data.qrCodeUrl || "",
      data: order,
    });
  } catch (err) {
    console.error("createMomoPayment error:", err);
    return res.status(500).json({
      message: err.message || "Lỗi server khi tạo thanh toán MoMo",
    });
  }
};

exports.momoIpn = async (req, res) => {
  try {
    const payload = req.body || {};

    const isValid = verifyMomoIpnSignature(payload);
    if (!isValid) {
      return res.status(400).json({
        message: "Sai chữ ký IPN",
      });
    }

    const order = await Order.findOne({ "momo.orderId": payload.orderId });
    if (!order) {
      return res.status(404).json({
        message: "Không tìm thấy đơn hàng theo momo.orderId",
      });
    }

    order.momo = {
      ...order.momo,
      transId: payload.transId ? String(payload.transId) : order.momo.transId,
      resultCode:
        typeof payload.resultCode !== "undefined"
          ? Number(payload.resultCode)
          : order.momo.resultCode,
      message: payload.message || order.momo.message,
      rawResponse: payload,
      ipnConfirmedAt: new Date(),
    };

    const resultCode = Number(payload.resultCode || -1);

    if (resultCode === 0) {
      if (!order.isPaid) {
        await deductInventoryForOrder(order);
        order.isPaid = true;
        order.paidAt = new Date();
        order.paymentStatus = "paid";
        order.status = 1;
      }
    } else {
      if (!order.isPaid) {
        order.paymentStatus = "failed";
      }
    }

    await order.save();

    return res.status(200).json({
      message: "IPN processed",
    });
  } catch (err) {
    console.error("momoIpn error:", err);
    return res.status(500).json({
      message: err.message || "Lỗi xử lý IPN",
    });
  }
};
exports.momoReturn = async (req, res) => {
  try {
    const { orderId, resultCode, message, transId } = req.query;

    const frontendReturnUrl =
      process.env.MOMO_FRONTEND_RETURN_URL || "http://localhost:5173/gio-hang";

    if (!orderId) {
      const redirectUrl = `${frontendReturnUrl}?momoStatus=failed&message=${encodeURIComponent(
        "Thiếu orderId"
      )}`;
      return res.redirect(redirectUrl);
    }

    const order = await Order.findOne({ "momo.orderId": orderId });

    if (!order) {
      const redirectUrl = `${frontendReturnUrl}?momoStatus=failed&message=${encodeURIComponent(
        "Không tìm thấy đơn hàng"
      )}`;
      return res.redirect(redirectUrl);
    }

    const numericResultCode = Number(resultCode || -1);

    if (numericResultCode === 0 && !order.isPaid) {
      try {
        await deductInventoryForOrder(order);
        order.isPaid = true;
        order.paidAt = new Date();
        order.paymentStatus = "paid";
        order.status = 1;
      } catch (err) {
        order.paymentStatus = "failed";
      }
    } else if (numericResultCode !== 0 && !order.isPaid) {
      order.paymentStatus = "failed";
    }

    order.momo = {
      ...order.momo,
      transId: transId ? String(transId) : order.momo?.transId || "",
      resultCode: numericResultCode,
      message: message || order.momo?.message || "",
      rawResponse: req.query,
    };

    await order.save();

    const finalStatus =
      numericResultCode === 0 && order.paymentStatus === "paid"
        ? "success"
        : "failed";

    const redirectUrl =
      `${frontendReturnUrl}` +
      `?momoStatus=${finalStatus}` +
      `&orderDbId=${order._id}` +
      `&momoOrderId=${encodeURIComponent(orderId)}` +
      `&resultCode=${numericResultCode}` +
      `&transId=${encodeURIComponent(transId || "")}` +
      `&message=${encodeURIComponent(message || "")}`;

    return res.redirect(redirectUrl);
  } catch (err) {
    console.error("momoReturn error:", err);

    const frontendReturnUrl =
      process.env.MOMO_FRONTEND_RETURN_URL || "http://localhost:5173/gio-hang";

    const redirectUrl = `${frontendReturnUrl}?momoStatus=failed&message=${encodeURIComponent(
      err.message || "Lỗi xử lý return MoMo"
    )}`;

    return res.redirect(redirectUrl);
  }
};