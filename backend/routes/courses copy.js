const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authMiddleware } = require('../middleware/auth');

// 公开路由
router.get('/', courseController.getCourseList);
router.get('/recommended', courseController.getRecommendedCourses);
router.get('/popular', courseController.getPopularCourses);
router.get('/newest', courseController.getNewestCourses);

// 需要认证的路由（必须放在 /:id 之前，避免路由冲突）
router.get('/user/courses', authMiddleware, courseController.getUserCourses);
router.get('/my/enrolled', authMiddleware, courseController.getUserCourses); // 别名路由

// 动态路由（放在最后）
router.get('/:id', courseController.getCourseDetail);
router.get('/:id/chapters', courseController.getCourseChapters); // 课程章节
router.get('/:id/related', courseController.getRelatedCourses);
router.post('/:id/enroll', authMiddleware, courseController.enrollCourse);
router.post('/:id/favorite', authMiddleware, courseController.toggleFavorite);
router.put('/:id/progress', authMiddleware, courseController.updateProgress);

module.exports = router;
