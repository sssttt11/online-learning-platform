const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authMiddleware } = require('../middleware/auth');

// 公开路由
router.get('/course/:id', reviewController.getCourseReviews);

// 需要认证的路由
router.post('/course/:id', authMiddleware, reviewController.addReview);
router.put('/:reviewId', authMiddleware, reviewController.updateReview);
router.delete('/:reviewId', authMiddleware, reviewController.deleteReview);

module.exports = router;
