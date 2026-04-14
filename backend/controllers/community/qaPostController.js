// src/controllers/community/qaPostController.js
const { execute } = require('../../config/database');

const qaPostController = {
    // 创建名师答疑帖子
    createTeacherQuestion: async (req, res) => {
        try {
            const { user_id, title, content, course_id, tags } = req.body;

            console.log('创建名师答疑请求:', { user_id, title });

            // 基础验证
            if (!user_id || !title || !content) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID、标题和内容为必填项'
                });
            }

            // 验证用户是否存在
            const [userExists] = await execute(
                'SELECT user_id FROM user WHERE user_id = ?',
                [user_id]
            );

            if (userExists.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '用户不存在或已被禁用'
                });
            }

            // 创建帖子
            const [result] = await execute(
                'INSERT INTO community_post (author_id, category, title, content, course_id, tags) VALUES (?, "question", ?, ?, ?, ?)',
                [user_id, title, content, course_id, JSON.stringify(tags || [])]
            );

            console.log('名师答疑帖子创建成功:', { postId: result.insertId, user_id });

            res.status(201).json({
                success: true,
                message: '问题提交成功',
                data: { 
                    post_id: result.insertId,
                    title,
                    post_type: 'qa_teacher'
                }
            });
        } catch (error) {
            console.error('创建名师答疑错误:', error);
            res.status(500).json({
                success: false,
                message: '提交问题失败: ' + error.message
            });
        }
    },

    // 创建互助学习帖子
    createHelpPost: async (req, res) => {
        try {
            const { user_id, title, content, course_id, tags } = req.body;

            console.log('创建互助学习请求:', { user_id, title });

            // 基础验证
            if (!user_id || !title || !content) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID、标题和内容为必填项'
                });
            }

            // 验证用户是否存在
            const [userExists] = await execute(
                'SELECT user_id FROM user WHERE user_id = ?',
                [user_id]
            );

            if (userExists.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '用户不存在或已被禁用'
                });
            }

            // 创建帖子
            const [result] = await execute(
                'INSERT INTO community_post (author_id, category, title, content, course_id, tags) VALUES (?, "sharing", ?, ?, ?, ?)',
                [user_id, title, content, course_id, JSON.stringify(tags || [])]
            );

            console.log('互助学习帖子创建成功:', { postId: result.insertId, user_id });

            res.status(201).json({
                success: true,
                message: '互助请求提交成功',
                data: { 
                    post_id: result.insertId,
                    title,
                    post_type: 'qa_help'
                }
            });
        } catch (error) {
            console.error('创建互助学习错误:', error);
            res.status(500).json({
                success: false,
                message: '提交互助请求失败: ' + error.message
            });
        }
    },

    // 获取QA帖子列表（带所有权信息）
    getQAPosts: async (req, res) => {
        try {
            const { post_type, current_user_id, page = 1, limit = 10 } = req.query;
            
            let query = `
                SELECT cp.*, u.user_name, u.avatar_url, c.course_name
                FROM community_post cp
                LEFT JOIN user u ON cp.author_id = u.user_id
                LEFT JOIN course c ON cp.course_id = c.course_id
                WHERE cp.status = 'published' AND cp.category = ?
            `;
            
            const params = [post_type];
            
            query += ' ORDER BY cp.create_time DESC';
            
            const [rows] = await execute(query, params);
            
            // 为每个帖子添加是否是当前用户创建的标志
            const postsWithOwnership = rows.map(post => ({
                ...post,
                is_owner: post.author_id === parseInt(current_user_id)
            }));
            
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
            console.error('获取QA帖子列表错误:', error);
            res.status(500).json({
                success: false,
                message: '获取帖子列表失败: ' + error.message
            });
        }
    },

    // 删除QA帖子（检查权限）
    deleteQAPost: async (req, res) => {
        try {
            const { postId } = req.params;
            const { user_id } = req.body;

            console.log('删除QA帖子请求:', { postId, user_id });

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID为必填项'
                });
            }

            // 检查帖子是否存在
            const [postExists] = await execute(
                'SELECT post_id, author_id, category FROM community_post WHERE post_id = ?',
                [postId]
            );

            if (postExists.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '帖子不存在'
                });
            }

            const post = postExists[0];

            // 检查当前用户是否为帖子作者
            if (post.author_id !== parseInt(user_id)) {
                return res.status(403).json({
                    success: false,
                    message: '只有作者才能删除帖子'
                });
            }

            // 检查帖子类型是否为QA类型
            if (!['question', 'sharing'].includes(post.category)) {
                return res.status(400).json({
                    success: false,
                    message: '只能删除问答类型的帖子'
                });
            }

            // 删除相关的评论
            await execute(
                'DELETE FROM post_comment WHERE post_id = ?',
                [postId]
            );

            // 删除相关的点赞
            await execute(
                'DELETE FROM post_like WHERE post_id = ?',
                [postId]
            );

            // 删除帖子
            const [result] = await execute(
                'DELETE FROM community_post WHERE post_id = ?',
                [postId]
            );

            if (result.affectedRows > 0) {
                console.log('QA帖子删除成功:', { postId });
                res.json({
                    success: true,
                    message: '帖子删除成功'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: '帖子不存在'
                });
            }
        } catch (error) {
            console.error('删除QA帖子错误:', error);
            res.status(500).json({
                success: false,
                message: '删除帖子失败: ' + error.message
            });
        }
    }
};

module.exports = qaPostController;