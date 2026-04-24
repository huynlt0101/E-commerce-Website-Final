const express = require('express');
const router = express.Router();

const {
  createReview,
  getReviewsByProduct,
  getMyReviewByProduct,
  updateReview,
  deleteReview,
  getReviewStats,
} = require('../controllers/reviewController');

// middleware auth của bạn
const { protect } = require('../middleware/auth');

// Public
router.get('/product/:productId', getReviewsByProduct);
router.get('/product/:productId/stats', getReviewStats);

// Private
router.get('/my-review/:productId', protect, getMyReviewByProduct);
router.post('/', protect, createReview);
router.put('/:reviewId', protect, updateReview);
router.delete('/:reviewId', protect, deleteReview);

module.exports = router;