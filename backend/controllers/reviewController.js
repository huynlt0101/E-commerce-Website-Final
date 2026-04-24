const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');

const recalculateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
        isActive: true,
      },
    },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        countReviews: { $sum: 1 },
      },
    },
  ]);

  let averageRating = 0;
  let numReviews = 0;

  if (stats.length > 0) {
    averageRating = Number(stats[0].avgRating.toFixed(1));
    numReviews = stats[0].countReviews;
  }

  await Product.findByIdAndUpdate(productId, {
    averageRating,
    numReviews,
  });
};

// @desc    Tạo review / bình luận sản phẩm
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'productId không hợp lệ' });
    }

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ message: 'Số sao phải từ 1 đến 5' });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập bình luận' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    const existingReview = await Review.findOne({
      product: productId,
      user: req.user._id,
    });

    if (existingReview) {
      return res.status(400).json({
        message: 'Bạn đã đánh giá sản phẩm này rồi, hãy dùng API cập nhật review',
      });
    }

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      username: req.user.username,
      rating: Number(rating),
      comment: comment.trim(),
    });

    await recalculateProductRating(productId);

    const populatedReview = await Review.findById(review._id)
      .populate('user', 'username email')
      .populate('product', 'name');

    return res.status(201).json({
      message: 'Thêm đánh giá thành công',
      review: populatedReview,
    });
  } catch (error) {
    console.error('createReview error:', error);
    return res.status(500).json({
      message: 'Lỗi server khi thêm đánh giá',
      error: error.message,
    });
  }
};

// @desc    Lấy tất cả review của 1 sản phẩm
// @route   GET /api/reviews/product/:productId
// @access  Public
const getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'productId không hợp lệ' });
    }

    const product = await Product.findById(productId).select(
      'name averageRating numReviews'
    );

    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    const total = await Review.countDocuments({
      product: productId,
      isActive: true,
    });

    const reviews = await Review.find({
      product: productId,
      isActive: true,
    })
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      product,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      reviews,
    });
  } catch (error) {
    console.error('getReviewsByProduct error:', error);
    return res.status(500).json({
      message: 'Lỗi server khi lấy danh sách đánh giá',
      error: error.message,
    });
  }
};

// @desc    Lấy review của chính user trên 1 sản phẩm
// @route   GET /api/reviews/my-review/:productId
// @access  Private
const getMyReviewByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'productId không hợp lệ' });
    }

    const review = await Review.findOne({
      product: productId,
      user: req.user._id,
      isActive: true,
    });

    if (!review) {
      return res.status(404).json({ message: 'Bạn chưa đánh giá sản phẩm này' });
    }

    return res.status(200).json(review);
  } catch (error) {
    console.error('getMyReviewByProduct error:', error);
    return res.status(500).json({
      message: 'Lỗi server khi lấy review của bạn',
      error: error.message,
    });
  }
};

// @desc    Cập nhật review
// @route   PUT /api/reviews/:reviewId
// @access  Private
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: 'reviewId không hợp lệ' });
    }

    const review = await Review.findById(reviewId);
    if (!review || !review.isActive) {
      return res.status(404).json({ message: 'Không tìm thấy review' });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Bạn không có quyền sửa review này',
      });
    }

    if (rating !== undefined) {
      if (Number(rating) < 1 || Number(rating) > 5) {
        return res.status(400).json({ message: 'Số sao phải từ 1 đến 5' });
      }
      review.rating = Number(rating);
    }

    if (comment !== undefined) {
      if (!comment.trim()) {
        return res.status(400).json({ message: 'Bình luận không được để trống' });
      }
      review.comment = comment.trim();
    }

    await review.save();
    await recalculateProductRating(review.product);

    const updatedReview = await Review.findById(review._id)
      .populate('user', 'username email')
      .populate('product', 'name');

    return res.status(200).json({
      message: 'Cập nhật review thành công',
      review: updatedReview,
    });
  } catch (error) {
    console.error('updateReview error:', error);
    return res.status(500).json({
      message: 'Lỗi server khi cập nhật review',
      error: error.message,
    });
  }
};

// @desc    Xóa review
// @route   DELETE /api/reviews/:reviewId
// @access  Private
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: 'reviewId không hợp lệ' });
    }

    const review = await Review.findById(reviewId);
    if (!review || !review.isActive) {
      return res.status(404).json({ message: 'Không tìm thấy review' });
    }

    const isOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: 'Bạn không có quyền xóa review này',
      });
    }

    const productId = review.product;

    await Review.findByIdAndDelete(reviewId);
    await recalculateProductRating(productId);

    return res.status(200).json({
      message: 'Xóa review thành công',
    });
  } catch (error) {
    console.error('deleteReview error:', error);
    return res.status(500).json({
      message: 'Lỗi server khi xóa review',
      error: error.message,
    });
  }
};

// @desc    Lấy thống kê rating sản phẩm
// @route   GET /api/reviews/product/:productId/stats
// @access  Public
const getReviewStats = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'productId không hợp lệ' });
    }

    const product = await Product.findById(productId).select(
      'name averageRating numReviews'
    );

    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    const breakdown = await Review.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(productId),
          isActive: true,
        },
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: -1 },
      },
    ]);

    const stars = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    breakdown.forEach((item) => {
      stars[item._id] = item.count;
    });

    return res.status(200).json({
      product,
      stars,
    });
  } catch (error) {
    console.error('getReviewStats error:', error);
    return res.status(500).json({
      message: 'Lỗi server khi lấy thống kê đánh giá',
      error: error.message,
    });no
    
  }
};

module.exports = {
  createReview,
  getReviewsByProduct,
  getMyReviewByProduct,
  updateReview,
  deleteReview,
  getReviewStats,
};