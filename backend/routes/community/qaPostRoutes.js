// src/routes/community/qaPostRoutes.js
const express = require('express');
const router = express.Router();
const qaPostController = require('../../controllers/community/qaPostController');

// QA帖子路由
router.post('/teacher-question', qaPostController.createTeacherQuestion);
router.post('/help-post', qaPostController.createHelpPost);
router.get('/', qaPostController.getQAPosts);
router.delete('/:postId', qaPostController.deleteQAPost);

module.exports = router;