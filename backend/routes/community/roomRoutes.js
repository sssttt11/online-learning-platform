// src/routes/community/roomRoutes.js
const express = require('express');
const router = express.Router();
const roomController = require('../../controllers/community/roomController');
const messageController = require('../../controllers/community/messageController');
const upload = require('../../middleware/upload');

// 移除 authMiddleware 导入

// 移除认证中间件
// router.use(authMiddleware);

// 自习室路由
router.post('/', roomController.createRoom);
router.get('/', roomController.getRooms);
router.get('/:roomId', roomController.getRoomDetail);
router.get('/:roomId/members', roomController.getRoomMembers);
router.get('/:roomId/stats', roomController.getRoomStats);
router.get('/:roomId/leaderboard', roomController.getRoomLeaderboard);
router.get('/:roomId/tasks', roomController.getRoomTasks);
router.get('/:roomId/tasks/user', roomController.getUserStudyTasks);
router.get('/:roomId/task-history', roomController.getTaskHistory);
router.post('/:roomId/tasks', roomController.createStudyTask);
router.patch('/tasks/:taskId/status', roomController.updateStudyTaskStatus);
// 自习室任务统计和完成时间相关
router.get('/:roomId/task-statistics', roomController.getRoomTaskStatistics);
router.patch('/tasks/:taskId/completion-time', roomController.updateTaskCompletionTime);
router.post('/tasks/:taskId/quick-complete', roomController.quickCompleteTask);
router.patch('/tasks/:taskId/completion-status', roomController.updateTaskCompletionStatus);

// 管理员相关
router.post('/:roomId/admins', roomController.setRoomAdmin);
router.put('/:roomId/rules', roomController.updateRoomRules);
router.post('/:roomId/avatar', upload.uploadRoomAvatar, roomController.updateRoomAvatar);
router.post('/:roomId/join', roomController.joinRoom);
router.delete('/:roomId/leave', roomController.leaveRoom);
router.put('/:roomId', roomController.updateRoom);
router.delete('/:roomId', roomController.deleteRoom);

// 自习室留言
router.get('/:roomId/messages', messageController.getRoomMessages);
router.post('/:roomId/messages', messageController.createMessage);
router.delete('/:roomId/messages/:messageId', messageController.deleteMessage);

module.exports = router;