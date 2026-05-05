// src/controllers/community/qaController.js
const { execute } = require('../../config/database');

const qaController = {
    // 获取名师答疑列表
    getTeacherQA: async (req, res) => {
        try {
            console.log('开始获取名师答疑列表...');
            const { teacher_id, page = 1, limit = 10, current_user_id } = req.query;
            
            let query = `
                SELECT cp.*, u.user_name, c.course_name
                FROM community_post cp
                LEFT JOIN user u ON cp.author_id = u.user_id
                LEFT JOIN course c ON cp.course_id = c.course_id
                WHERE cp.status = 'published' AND cp.category = 'question'
            `;
            
            const params = [];
            
            if (teacher_id) {
                query += ' AND cp.author_id = ?';
                params.push(teacher_id);
            }
            
            query += ' ORDER BY cp.create_time DESC';
            
            console.log('执行SQL:', query);
            console.log('参数:', params);
            
            const [rows] = await execute(query, params);
            
            // 为每个帖子添加是否是当前用户创建的标志
            const postsWithOwnership = rows.map(post => ({
                ...post,
                is_owner: post.author_id === parseInt(current_user_id)
            }));
            
            console.log('获取名师答疑成功，数量:', rows.length);
            
            res.json({
                success: true,
                data: postsWithOwnership,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: rows.length
                }
            });
        } catch (error) {
            console.error('获取名师答疑错误:', error);
            console.error('错误堆栈:', error.stack);
            res.status(500).json({
                success: false,
                message: '获取名师答疑失败: ' + error.message,
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    },

    // 获取互助学习列表
    getHelpPosts: async (req, res) => {
        try {
            console.log('开始获取互助学习列表...');
            const { course_id, page = 1, limit = 10, current_user_id } = req.query;
            
            let query = `
                SELECT cp.*, u.user_name, c.course_name
                FROM community_post cp
                LEFT JOIN user u ON cp.author_id = u.user_id
                LEFT JOIN course c ON cp.course_id = c.course_id
                WHERE cp.status = 'published' AND cp.category = 'sharing'
            `;
            
            const params = [];
            
            if (course_id) {
                query += ' AND cp.course_id = ?';
                params.push(course_id);
            }
            
            query += ' ORDER BY cp.create_time DESC';
            
            console.log('执行SQL:', query);
            console.log('参数:', params);
            
            const [rows] = await execute(query, params);
            
            // 为每个帖子添加是否是当前用户创建的标志
            const postsWithOwnership = rows.map(post => ({
                ...post,
                is_owner: post.author_id === parseInt(current_user_id)
            }));
            
            console.log('获取互助学习成功，数量:', rows.length);
            
            res.json({
                success: true,
                data: postsWithOwnership,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: rows.length
                }
            });
        } catch (error) {
            console.error('获取互助学习错误:', error);
            console.error('错误堆栈:', error.stack);
            res.status(500).json({
                success: false,
                message: '获取互助学习失败: ' + error.message,
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    },

    // 标记问题为已解决
    markAsSolved: async (req, res) => {
        try {
            const { postId } = req.params;
            const { user_id } = req.body;
            
            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID为必填项'
                });
            }
            
            console.log('标记问题为已解决:', { postId, user_id });
            
            // 检查权限
            const [post] = await execute(
                'SELECT author_id FROM community_post WHERE post_id = ?',
                [postId]
            );

            if (post.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '帖子不存在'
                });
            }

            if (post[0].author_id !== parseInt(user_id)) {
                return res.status(403).json({
                    success: false,
                    message: '只有作者才能标记问题为已解决'
                });
            }
            
            const [result] = await execute(
                'UPDATE community_post SET status = "deleted" WHERE post_id = ?',
                [postId]
            );

            if (result.affectedRows > 0) {
                res.json({
                    success: true,
                    message: '问题已标记为已解决'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: '帖子不存在'
                });
            }
        } catch (error) {
            console.error('标记问题解决错误:', error);
            res.status(500).json({
                success: false,
                message: '标记问题解决失败: ' + error.message
            });
        }
    }
};

module.exports = qaController;