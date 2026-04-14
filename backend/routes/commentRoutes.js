const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authMiddleware } = require('../middleware/auth');

router.get('/videos/:videoId', commentController.getComments);
router.post('/', authMiddleware, commentController.postComment);
router.post('/:commentId/like', authMiddleware, commentController.likeComment);

module.exports = router;