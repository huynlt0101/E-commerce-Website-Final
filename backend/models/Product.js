const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Vui lòng nhập tên sản phẩm"],
      trim: true
    },

    price: {
      type: Number,
      required: [true, "Vui lòng nhập giá sản phẩm"],
      min: 0
    },

    quantity: {
      type: Number,
      default: 0,
      min: 0
    },

    description: {
      type: String,
      default: ""
    },

    image: {
      type: String, // lưu tên file
      required: true
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
