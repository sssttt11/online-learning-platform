// src/routes/community/postRoutes.js
const express = require('express');
const router = express.Router();
const postController = require('../../controllers/community/postController');

// 帖子路由
router.post('/', postController.createPost);
router.get('/', postController.getPosts);
router.get('/:postId', postController.getPostDetail);
router.put('/:postId', postController.updatePost);
router.delete('/:postId', postController.deletePost);

router.post('/:postId/like', postController.likePost);
router.delete('/:postId/like', postController.unlikePost); 
router.get('/:postId/like/status', postController.checkPostLike);

module.exports = router;