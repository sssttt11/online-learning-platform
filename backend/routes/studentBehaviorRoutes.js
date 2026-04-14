const express = require('express');
const router = express.Router();
const studentBehaviorController = require('../controllers/studentBehaviorController');
const { authMiddleware } = require('../middleware/auth');

// 应用认证中间件到所有路由
router.use(authMiddleware);

// 获取学生行为分析概览
router.get('/overview', studentBehaviorController.getBehaviorOverview);

// 获取用户已报名课程列表
router.get('/courses', studentBehaviorController.getEnrolledCourses);

// 获取课程详细分析
router.get('/course/:courseId', studentBehaviorController.getCourseAnalysis);

// 获取学习趋势数据
router.get('/trend', studentBehaviorController.getLearningTrend);

// 获取学习建议
router.get('/suggestions', studentBehaviorController.getLearningSuggestions);

// 更新学习目标进度
router.put('/goal/:goalId', studentBehaviorController.updateGoalProgress);

// ==================== 倍速播放相关路由 ====================

// 获取倍速播放使用情况
router.get('/speed-usage', studentBehaviorController.getPlaybackSpeedUsage);

// 获取课程倍速偏好
router.get('/course/:courseId/speed-preference', studentBehaviorController.getCourseSpeedPreference);

// 获取用户个人倍速习惯统计
router.get('/speed-habits', studentBehaviorController.getUserSpeedHabits);

// 获取倍速与学习效果关联分析
router.get('/speed-learning-correlation', studentBehaviorController.getSpeedLearningCorrelation);

// 批量获取多个课程倍速数据
router.post('/batch-speed-analysis', studentBehaviorController.getBatchSpeedAnalysis);

module.exports = router;