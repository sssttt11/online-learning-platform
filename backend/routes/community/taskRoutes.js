// src/routes/community/taskRoutes.js
const express = require('express');
const router = express.Router();
const taskController = require('../../controllers/community/taskController');
const teamAnalysisController = require('../../controllers/community/teamAnalysisController');

// 学习小组任务管理路由
router.post('/teams/:teamId/tasks', taskController.createTask);
router.get('/teams/:teamId/tasks', taskController.getTeamTasks);
router.put('/tasks/:taskId', taskController.updateTask);
router.delete('/tasks/:taskId', taskController.deleteTask);
router.patch('/tasks/:taskId/status', taskController.updateTaskStatus);

// 任务完成状态管理（打勾功能）
router.patch('/tasks/:taskId/completion-status', teamAnalysisController.updateTaskCompletionStatus);
router.post('/tasks/:taskId/quick-complete', teamAnalysisController.quickCompleteTask);

// 新增路由：获取团队任务统计信息
router.get('/teams/:teamId/tasks-statistics', teamAnalysisController.getTeamTasksStatistics);

module.exports = router;