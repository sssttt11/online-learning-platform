const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');

// 公开路由 - 获取明星讲师列表
router.get('/top', teacherController.getTopTeachers);

module.exports = router;
