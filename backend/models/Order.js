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

      // không bắt buộc nữa
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