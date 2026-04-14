// src/routes/community/index.js
const express = require('express');
const router = express.Router();

const teamRoutes = require('./teamRoutes');
const roomRoutes = require('./roomRoutes');
const postRoutes = require('./postRoutes');
const commentRoutes = require('./commentRoutes');
const qaRoutes = require('./qaRoutes');
const qaPostRoutes = require('./qaPostRoutes'); 
const taskRoutes = require('./taskRoutes');
const messageRoutes = require('./messageRoutes');

router.use('/teams', teamRoutes);
router.use('/rooms', roomRoutes);
router.use('/posts', postRoutes);
router.use('/comments', commentRoutes);
router.use('/qa', qaRoutes);
router.use('/qa-posts', qaPostRoutes); 
router.use('/tasks', taskRoutes);
router.use('/messages', messageRoutes);

module.exports = router;