// backend\routes\community\teamRoutes.js
const express = require('express');
const router = express.Router();
const teamController = require('../../controllers/community/teamController');
const teamAnalysisController = require('../../controllers/community/teamAnalysisController');
const messageController = require('../../controllers/community/messageController');

// 学习小组路由
router.get('/available-data', teamController.getAvailableData); 
router.post('/', teamController.createTeam);
router.get('/', teamController.getTeams);
router.get('/user/:userId', teamController.getUserTeams);
router.get('/:teamId', teamController.getTeamDetail);
router.post('/:teamId/join', teamController.joinTeam);
router.delete('/:teamId/leave', teamController.leaveTeam);
router.put('/:teamId', teamController.updateTeam);
router.delete('/:teamId', teamController.deleteTeam);

// 小组任务分析数据
router.get('/:teamId/task-completion', teamAnalysisController.getTeamTaskCompletionData);
router.get('/:teamId/tasks-statistics', teamAnalysisController.getTeamTasksStatistics); // 新增统计路由

// 移除旧的 completion-time 路由（已移到 taskRoutes.js）
// router.patch('/tasks/:taskId/completion-time', teamAnalysisController.updateTaskCompletionTime);

// 小组留言
router.get('/:teamId/comments', messageController.getTeamComments);
router.post('/:teamId/comments', messageController.createTeamComment);

module.exports = router;