// src/routes/community/messageRoutes.js
const express = require('express');
const router = express.Router();
const messageController = require('../../controllers/community/messageController');

// 修正自习室留言路由 - 移除重复的路径
router.post('/:roomId', messageController.createMessage);  // POST /api/community/messages/:roomId
router.get('/:roomId', messageController.getRoomMessages); // GET /api/community/messages/:roomId
router.delete('/:messageId', messageController.deleteMessage); // DELETE /api/community/messages/:messageId

module.exports = router;