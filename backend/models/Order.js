const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
    }, // snapshot
    price: {
      type: Number,
      required: true,
    }, // snapshot
    image: {
      type: String,
      default: "",
    }, // snapshot
    qty: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    shippingAddress: {
      fullName: {
        type: String,
        required: true,
        trim: true,
      },
      phone: {
        type: String,
        required: true,
        trim: true,
      },
      provinceId: {
        type: String,
        required: true,
        trim: true,
      },
      districtId: {
        type: String,
        default: "",
        trim: true,
      },
      wardId: {
        type: String,
        required: true,
        trim: true,
      },
      provinceName: {
        type: String,
        default: "",
        trim: true,
      },
      districtName: {
        type: String,
        default: "",
        trim: true,
      },
      wardName: {
        type: String,
        default: "",
        trim: true,
      },
      addressLine: {
        type: String,
        required: true,
        trim: true,
      },
      note: {
        type: String,
        default: "",
        trim: true,
      },
    }, 

    items: {
      type: [orderItemSchema],
      required: true,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "MOMO"],
      default: "COD",
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending", "paid", "failed"],
      default: "unpaid",
    },

    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
      default: null,
    },

    momo: {
      requestId: { type: String, default: "" },
      orderId: { type: String, default: "" },
      transId: { type: String, default: "" },
      resultCode: { type: Number, default: null },
      message: { type: String, default: "" },
      payUrl: { type: String, default: "" },
      deeplink: { type: String, default: "" },
      qrCodeUrl: { type: String, default: "" },
      signature: { type: String, default: "" },
      responseTime: { type: Number, default: null },
      rawResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    },

    // 0: chờ xác minh | 1: đã xác minh
    status: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);