const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Thiếu sản phẩm'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Thiếu người dùng'],
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, 'Vui lòng chọn số sao'],
      min: [1, 'Số sao tối thiểu là 1'],
      max: [5, 'Số sao tối đa là 5'],
    },
    comment: {
      type: String,
      required: [true, 'Vui lòng nhập bình luận'],
      trim: true,
      maxlength: [1000, 'Bình luận tối đa 1000 ký tự'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Mỗi user chỉ được review 1 lần trên 1 sản phẩm
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);