// src/routes/community/commentRoutes.js
const express = require('express');
const router = express.Router();
const commentController = require('../../controllers/community/commentController');

// 评论路由
router.post('/', commentController.createComment);
router.get('/post/:postId', commentController.getPostComments);
router.put('/:commentId', commentController.updateComment);
router.delete('/:commentId', commentController.deleteComment);
router.post('/:commentId/like', commentController.likeComment);
router.delete('/:commentId/like', commentController.unlikeComment);
router.get('/:commentId/like/status', commentController.checkCommentLike);

module.exports = router;