-- 插入测试数据
-- 首先执行study_pair_tables.sql创建表结构

-- 1. 插入测试用户（如果不存在）
INSERT IGNORE INTO `user` (`user_id`, `user_name`, `email`, `password_hash`, `role`, `avatar_url`, `register_time`) VALUES
(1, '张三', 'zhangsan@test.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'learner', '/uploads/avatars/avatar1.jpg', '2024-11-01 10:00:00'),
(2, '李四', 'lisi@test.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'learner', '/uploads/avatars/avatar2.jpg', '2024-11-02 10:00:00'),
(3, '王五', 'wangwu@test.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'learner', '/uploads/avatars/avatar3.jpg', '2024-11-03 10:00:00'),
(4, '赵六', 'zhaoliu@test.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'learner', '/uploads/avatars/avatar4.jpg', '2024-11-04 10:00:00');

-- 2. 插入用户详细信息
INSERT IGNORE INTO `user_detail` (`user_id`, `user_intro`) VALUES
(1, '热爱学习的程序员'),
(2, '前端开发工程师'),
(3, '后端开发工程师'),
(4, '全栈开发工程师');

-- 3. 插入测试课程（如果不存在）
INSERT IGNORE INTO `course` (`course_id`, `course_name`, `course_desc`, `teacher_user_id`, `difficulty_level`, `is_online`, `student_count`, `rating`, `rating_count`) VALUES
(1, 'JavaScript基础教程', '从零开始学习JavaScript编程', 1, 'beginner', 1, 150, 4.5, 50),
(2, 'Vue.js实战开发', '使用Vue.js构建现代化前端应用', 2, 'intermediate', 1, 200, 4.7, 80),
(3, 'Node.js后端开发', 'Node.js服务端开发完整教程', 3, 'intermediate', 1, 120, 4.6, 60);

-- 4. 插入学习小组
INSERT INTO `study_team` (`team_id`, `team_name`, `description`, `avatar_url`, `course_id`, `creator_id`, `max_members`, `current_members`, `status`, `tags`) VALUES
(4, 'JavaScript学习小组', '一起学习JavaScript基础知识，互相监督，共同进步！', '/uploads/team-avatars/team1.jpg', 1, 1, 2, 2, 'active', '["JavaScript", "前端", "基础"]'),
(5, 'Vue.js实战小组', '通过实际项目学习Vue.js，提升前端开发技能', '/uploads/team-avatars/team2.jpg', 2, 3, 2, 1, 'active', '["Vue.js", "前端", "实战"]'),
(6, 'Node.js后端小组', '专注Node.js后端开发，从基础到进阶', '/uploads/team-avatars/team3.jpg', 3, 2, 2, 1, 'active', '["Node.js", "后端", "服务器"]');

-- 5. 插入小组成员
INSERT INTO `team_member` (`team_id`, `user_id`, `role`, `join_time`, `status`) VALUES
(4, 1, 'leader', '2024-11-20 10:00:00', 'active'),
(4, 2, 'member', '2024-11-20 11:00:00', 'active'),
(5, 3, 'leader', '2024-11-21 10:00:00', 'active'),
(5, 2, 'leader', '2024-11-22 10:00:00', 'active');

-- 6. 插入小组任务
INSERT INTO `team_task` (`team_id`, `title`, `description`, `creator_id`, `assignee_id`, `due_date`, `priority`, `status`) VALUES
(4, '完成JavaScript基础语法学习', '学习变量、函数、对象等基础概念', 1, 1, '2024-12-10 23:59:59', 'high', 'in_progress'),
(4, '练习DOM操作', '完成10个DOM操作练习题', 1, 2, '2024-12-08 23:59:59', 'medium', 'pending'),
(4, '学习ES6新特性', '掌握箭头函数、解构赋值等ES6特性', 1, 1, '2024-12-15 23:59:59', 'medium', 'pending'),
(4, '完成小项目：计算器', '使用JavaScript实现一个简单的计算器', 1, 2, '2024-12-20 23:59:59', 'high', 'pending'),
(5, '学习Vue组件开发', '掌握Vue组件的创建和使用', 3, 3, '2024-12-12 23:59:59', 'high', 'in_progress'),
(5, '学习Express框架', '掌握Express基础用法和路由', 2, 2, '2024-12-14 23:59:59', 'high', 'pending');

-- 7. 插入学习进度记录
INSERT INTO `team_learning_progress` (`team_id`, `user_id`, `course_id`, `study_date`, `study_duration`, `completed_tasks`, `progress_percentage`) VALUES
-- 用户1在小组1的学习记录
(4, 1, 1, '2024-12-01', 120, 1, 25.0),
(4, 1, 1, '2024-12-02', 90, 0, 30.0),
(4, 1, 1, '2024-12-03', 150, 1, 40.0),
(4, 1, 1, '2024-12-04', 180, 0, 50.0),
(4, 1, 1, '2024-12-05', 100, 1, 60.0),
-- 用户2在小组1的学习记录
(4, 2, 1, '2024-12-01', 100, 0, 20.0),
(4, 2, 1, '2024-12-02', 110, 1, 25.0),
(4, 2, 1, '2024-12-03', 130, 0, 35.0),
(4, 2, 1, '2024-12-04', 160, 1, 45.0),
(4, 2, 1, '2024-12-05', 90, 0, 50.0),
-- 用户3在小组2的学习记录
(5, 3, 2, '2024-12-01', 140, 1, 30.0),
(5, 3, 2, '2024-12-02', 120, 0, 40.0),
(5, 3, 2, '2024-12-03', 100, 1, 50.0),
(5, 3, 2, '2024-12-04', 180, 0, 65.0),
(5, 3, 2, '2024-12-05', 150, 1, 75.0),
-- 用户2在小组3的学习记录
(5, 2, 3, '2024-12-01', 90, 0, 15.0),
(5, 2, 3, '2024-12-02', 120, 1, 25.0),
(5, 2, 3, '2024-12-03', 110, 0, 35.0),
(5, 2, 3, '2024-12-04', 140, 0, 45.0),
(5, 2, 3, '2024-12-05', 160, 1, 55.0);

-- 8. 插入加入申请（用户4申请加入小组1）
INSERT INTO `team_join_request` (`team_id`, `user_id`, `message`, `status`, `request_time`) VALUES
(4, 4, '希望能加入这个JavaScript学习小组，一起学习进步！', 'pending', '2024-12-05 14:30:00');

-- 9. 插入通知消息
INSERT INTO `notification` (`user_id`, `type`, `title`, `content`, `related_id`, `is_read`) VALUES
(1, 'team_join_request', '新的小组加入申请', '赵六申请加入您的小组「JavaScript学习小组」', 1, 0),
(2, 'task_assigned', '新任务分配', '张三在小组「JavaScript学习小组」中为您分配了任务：练习DOM操作', 2, 0),
(2, 'task_reminder', '任务提醒', '张三提醒您完成任务：练习DOM操作', 2, 1),
(3, 'system', '系统通知', '欢迎加入学习小组功能！', NULL, 1);

-- 10. 更新study_team表的current_members字段
UPDATE `study_team` SET `current_members` = (
    SELECT COUNT(*) FROM `team_member` 
    WHERE `team_member`.`team_id` = `study_team`.`team_id` 
    AND `team_member`.`status` = 'active'
) WHERE `team_id` IN (1, 2, 3);
