const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// 所有分类路由都是公开的
router.get('/', categoryController.getAllCategories);
router.get('/top', categoryController.getTopCategories);
router.get('/:id', categoryController.getCategoryDetail);

module.exports = router;
