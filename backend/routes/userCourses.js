// routes/userCourses.js
const express = require('express');
const router = express.Router();
const UserCourseController = require('../controllers/userCourseController');
const { authMiddleware } = require('../middleware/auth');

// 学习库相关路由
router.get('/library', authMiddleware, UserCourseController.getUserCourses);
router.get('/stats', authMiddleware, UserCourseController.getLearningStats);
router.get('/recent', authMiddleware, UserCourseController.getRecentCourses);

// 单个课程操作
router.post('/:courseId/enroll', authMiddleware, UserCourseController.enrollCourse);
router.delete('/:courseId/enroll', authMiddleware, UserCourseController.unenrollCourse);
router.get('/:courseId/progress', authMiddleware, UserCourseController.getCourseWithProgress);
router.put('/:courseId/progress', authMiddleware, UserCourseController.updateProgress);
router.get('/:courseId/check', authMiddleware, UserCourseController.checkEnrollment);

// 收藏相关
router.post('/:courseId/favorite', authMiddleware, UserCourseController.toggleFavorite);
router.get('/favorites', authMiddleware, UserCourseController.getFavorites);

// 批量操作
router.post('/progress/batch', authMiddleware, UserCourseController.batchUpdateProgress);

module.exports = router;