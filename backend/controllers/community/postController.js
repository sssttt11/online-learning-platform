// src/controllers/community/postController.js
const CommunityPost = require('../../models/community/CommunityPost');
const { execute, pool } = require('../../config/database');

const postController = {
    // 创建帖子
    createPost: async (req, res) => {
        try {
            const { user_id, post_type, title, content, course_id, tags } = req.body;

            console.log('创建帖子请求:', { user_id, post_type, title });

            // 1. 基础字段验证
            if (!user_id || !post_type || !title || !content) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID、帖子类型、标题和内容为必填项',
                    required_fields: ['user_id', 'post_type', 'title', 'content']
                });
            }

            // 2. 验证字段长度和格式
            if (title.length < 5 || title.length > 200) {
                return res.status(400).json({
                    success: false,
                    message: '帖子标题长度应在5-200个字符之间'
                });
            }

            if (content.length < 10) {
                return res.status(400).json({
                    success: false,
                    message: '帖子内容应至少10个字符'
                });
            }

            // 3. 验证帖子类型是否有效
            const validPostTypes = ['discussion', 'question', 'sharing', 'announcement'];
            if (!validPostTypes.includes(post_type)) {
                return res.status(400).json({
                    success: false,
                    message: '帖子类型无效，可选值: discussion, question, sharing, announcement',
                    valid_types: validPostTypes
                });
            }

            // 4. 验证用户是否存在
            const [userExists] = await execute(
                'SELECT user_id, user_name FROM user WHERE user_id = ?',
                [user_id]
            );

            if (userExists.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '用户不存在或已被禁用'
                });
            }

            // 5. 如果提供了课程ID，验证课程是否存在
            if (course_id) {
                const [courseExists] = await execute(
                    'SELECT course_id, course_name FROM course WHERE course_id = ?',
                    [course_id]
                );

                if (courseExists.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: '指定的课程不存在'
                    });
                }
            }

            // 6. 验证帖子标题是否重复（同一用户）
            const [postExists] = await execute(
                'SELECT post_id FROM community_post WHERE title = ? AND author_id = ? AND status = "published"',
                [title, user_id]
            );

            if (postExists.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '您已发布过相同标题的帖子'
                });
            }

            // 7. 验证标签格式
            if (tags && !Array.isArray(tags)) {
                return res.status(400).json({
                    success: false,
                    message: '标签格式错误，应为数组格式'
                });
            }

            // 8. 所有验证通过，创建帖子
            const postId = await CommunityPost.create({
                user_id,
                post_type,
                title,
                content,
                course_id,
                tags: tags || []
            });

            console.log('帖子创建成功:', { postId, title, user_id });

            res.status(201).json({
                success: true,
                message: '帖子创建成功',
                data: { 
                    post_id: postId,
                    title,
                    post_type
                }
            });
        } catch (error) {
            console.error('创建帖子错误:', error);
            
            // 处理数据库约束错误
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({
                    success: false,
                    message: '关联数据不存在，请检查用户ID或课程ID'
                });
            }
            
            res.status(500).json({
                success: false,
                message: '创建帖子失败: ' + error.message,
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    },

    // 获取帖子列表
    getPosts: async (req, res) => {
        try {
            const { post_type, course_id, page = 1, limit = 10, current_user_id } = req.query;
            const filters = {};

            if (post_type) {
                filters.post_type = post_type;
            }

            if (course_id) {
                filters.course_id = course_id;
            }

            const posts = await CommunityPost.findAll(filters);

            // 为每个帖子添加是否是当前用户创建的标志
            const postsWithOwnership = posts.map(post => ({
                ...post,
                is_owner: post.author_id === parseInt(current_user_id)
            }));

            res.json({
                success: true,
                data: postsWithOwnership,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: posts.length
                }
            });
        } catch (error) {
            console.error('获取帖子列表错误:', error);
            res.status(500).json({
                success: false,
                message: '获取帖子列表失败: ' + error.message
            });
        }
    },

    // 获取帖子详情
    getPostDetail: async (req, res) => {
        try {
            const { postId } = req.params;
            const { current_user_id } = req.query;
            
            const post = await CommunityPost.findById(postId);

            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: '帖子不存在'
                });
            }

            // 添加是否是当前用户创建的标志
            post.is_owner = post.author_id === parseInt(current_user_id);

            res.json({
                success: true,
                data: post
            });
        } catch (error) {
            console.error('获取帖子详情错误:', error);
            res.status(500).json({
                success: false,
                message: '获取帖子详情失败: ' + error.message
            });
        }
    },

    // 更新帖子
    updatePost: async (req, res) => {
        try {
            const { postId } = req.params;
            const { title, content, tags, user_id } = req.body;

            console.log('更新帖子请求:', { postId, title, user_id });

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID为必填项'
                });
            }

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
                    message: '只有作者才能编辑帖子'
                });
            }

            const [result] = await execute(
                'UPDATE community_post SET title = ?, content = ?, tags = ? WHERE post_id = ?',
                [title, content, JSON.stringify(tags), postId]
            );

            if (result.affectedRows > 0) {
                res.json({
                    success: true,
                    message: '帖子更新成功'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: '帖子不存在'
                });
            }
        } catch (error) {
            console.error('更新帖子错误:', error);
            res.status(500).json({
                success: false,
                message: '更新帖子失败: ' + error.message
            });
        }
    },

    // 删除帖子
    deletePost: async (req, res) => {
        try {
            const { postId } = req.params;
            const { user_id } = req.body;

            console.log('删除帖子请求:', { postId, user_id });

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID为必填项'
                });
            }

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
                    message: '只有作者才能删除帖子'
                });
            }

            const [result] = await execute(
                'UPDATE community_post SET status = "deleted" WHERE post_id = ?',
                [postId]
            );

            if (result.affectedRows > 0) {
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
            console.error('删除帖子错误:', error);
            res.status(500).json({
                success: false,
                message: '删除帖子失败: ' + error.message
            });
        }
    },

    // 点赞帖子
    likePost: async (req, res) => {
        try {
            const { postId } = req.params;
            const { user_id } = req.body;

            console.log('点赞帖子请求:', { postId, user_id });

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID为必填项'
                });
            }

            // 验证帖子是否存在
            const [postExists] = await execute(
                'SELECT post_id, title FROM community_post WHERE post_id = ? AND status = "published"',
                [postId]
            );

            if (postExists.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '帖子不存在或已被删除'
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

            // 检查是否已经点赞
            const [existingLike] = await execute(
                'SELECT like_id FROM post_like WHERE post_id = ? AND user_id = ?',
                [postId, user_id]
            );

            if (existingLike.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '您已经点赞过该帖子'
                });
            }

            // 开始事务处理
            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                // 插入点赞记录
                await connection.execute(
                    'INSERT INTO post_like (post_id, user_id) VALUES (?, ?)',
                    [postId, user_id]
                );

                // 更新帖子点赞数
                await connection.execute(
                    'UPDATE community_post SET likes_count = likes_count + 1 WHERE post_id = ?',
                    [postId]
                );

                // 获取更新后的点赞数
                const [updatedPost] = await connection.execute(
                    'SELECT likes_count FROM community_post WHERE post_id = ?',
                    [postId]
                );

                await connection.commit();

                console.log('帖子点赞成功:', { 
                    postId, 
                    user_id, 
                    newLikeCount: updatedPost[0].likes_count 
                });

                res.json({
                    success: true,
                    message: '点赞成功',
                    data: {
                        post_id: parseInt(postId),
                        like_count: updatedPost[0].likes_count,
                        user_has_liked: true
                    }
                });

            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }

        } catch (error) {
            console.error('点赞帖子错误:', error);
            
            // 处理重复点赞的错误
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    success: false,
                    message: '您已经点赞过该帖子'
                });
            }
            
            res.status(500).json({
                success: false,
                message: '点赞失败: ' + error.message,
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    },

    // 取消点赞帖子
    unlikePost: async (req, res) => {
        try {
            const { postId } = req.params;
            const { user_id } = req.body;

            console.log('取消点赞帖子请求:', { postId, user_id });

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID为必填项'
                });
            }

            // 开始事务处理
            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                // 删除点赞记录
                const [deleteResult] = await connection.execute(
                    'DELETE FROM post_like WHERE post_id = ? AND user_id = ?',
                    [postId, user_id]
                );

                if (deleteResult.affectedRows === 0) {
                    await connection.rollback();
                    return res.status(400).json({
                        success: false,
                        message: '您尚未点赞该帖子'
                    });
                }

                // 更新帖子点赞数
                await connection.execute(
                    'UPDATE community_post SET likes_count = GREATEST(likes_count - 1, 0) WHERE post_id = ?',
                    [postId]
                );

                // 获取更新后的点赞数
                const [updatedPost] = await connection.execute(
                    'SELECT likes_count FROM community_post WHERE post_id = ?',
                    [postId]
                );

                await connection.commit();

                console.log('取消帖子点赞成功:', { 
                    postId, 
                    user_id, 
                    newLikeCount: updatedPost[0].likes_count 
                });

                res.json({
                    success: true,
                    message: '取消点赞成功',
                    data: {
                        post_id: parseInt(postId),
                        like_count: updatedPost[0].likes_count,
                        user_has_liked: false
                    }
                });

            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }

        } catch (error) {
            console.error('取消点赞帖子错误:', error);
            res.status(500).json({
                success: false,
                message: '取消点赞失败: ' + error.message
            });
        }
    },

    // 检查帖子点赞状态
    checkPostLike: async (req, res) => {
        try {
            const { postId } = req.params;
            const { user_id } = req.query;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID为必填项'
                });
            }

            // 检查点赞状态
            const [likeStatus] = await execute(
                'SELECT like_id FROM post_like WHERE post_id = ? AND user_id = ?',
                [postId, user_id]
            );

            // 获取帖子点赞总数
            const [postInfo] = await execute(
                'SELECT likes_count FROM community_post WHERE post_id = ?',
                [postId]
            );

            const hasLiked = likeStatus.length > 0;

            res.json({
                success: true,
                data: {
                    post_id: parseInt(postId),
                    user_id: parseInt(user_id),
                    has_liked: hasLiked,
                    like_count: postInfo[0] ? postInfo[0].likes_count : 0
                }
            });

        } catch (error) {
            console.error('检查帖子点赞状态错误:', error);
            res.status(500).json({
                success: false,
                message: '检查点赞状态失败: ' + error.message
            });
        }
    }
};

module.exports = postController;
