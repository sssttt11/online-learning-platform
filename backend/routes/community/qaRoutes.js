// src/routes/community/qaRoutes.js
const express = require('express');
const router = express.Router();
const qaController = require('../../controllers/community/qaController');

// 名师答疑和互助学习路由
router.get('/teachers', qaController.getTeacherQA);
router.get('/help', qaController.getHelpPosts);
router.patch('/:postId/solve', qaController.markAsSolved);

module.exports = router;