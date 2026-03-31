// src/controllers/community/commentController.js
const PostComment = require('../../models/community/PostComment');
const { execute, pool } = require('../../config/database');

const commentController = {
    // 创建评论
    createComment: async (req, res) => {
        try {
            const { post_id, content, parent_comment_id, user_id, comment_type = 'discussion' } = req.body;

            console.log('创建评论请求:', { post_id, user_id, parent_comment_id, comment_type });

            // 1. 基础字段验证
            if (!post_id || !content || !user_id) {
                return res.status(400).json({
                    success: false,
                    message: '帖子ID、评论内容和用户ID为必填项',
                    required_fields: ['post_id', 'content', 'user_id']
                });
            }

            // 2. 验证内容长度
            if (content.length < 1) {
                return res.status(400).json({
                    success: false,
                    message: '评论内容不能为空'
                });
            }

            if (content.length > 1000) {
                return res.status(400).json({
                    success: false,
                    message: '评论内容过长，请控制在1000个字符以内'
                });
            }

            // 3. 验证用户是否存在
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

            // 4. 验证帖子是否存在且状态正常
            const [postExists] = await execute(
                'SELECT post_id, title, status, category FROM community_post WHERE post_id = ?',
                [post_id]
            );

            if (postExists.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '帖子不存在'
                });
            }

            if (postExists[0].status !== 'published') {
                return res.status(400).json({
                    success: false,
                    message: '帖子已被关闭或删除，无法评论'
                });
            }

            // 5. 根据帖子类型确定评论类型
            const post = postExists[0];
            let finalCommentType = comment_type;

            // 如果是QA类型的帖子，评论自动成为回答
            if (post.category === 'question' || post.category === 'sharing') {
                finalCommentType = 'qa_answer';
            } else {
                finalCommentType = 'discussion';
            }

            console.log('最终评论类型:', { 
                category: post.category, 
                comment_type: comment_type, 
                finalCommentType 
            });

            // 6. 如果提供了父评论ID，验证父评论是否存在
            if (parent_comment_id) {
                const [parentCommentExists] = await execute(
                    'SELECT comment_id FROM post_comment WHERE comment_id = ?',
                    [parent_comment_id]
                );

                if (parentCommentExists.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: '父评论不存在'
                    });
                }

                // 验证父评论是否属于同一个帖子
                const [parentCommentPost] = await execute(
                    'SELECT post_id FROM post_comment WHERE comment_id = ?',
                    [parent_comment_id]
                );

                if (parentCommentPost[0].post_id !== parseInt(post_id)) {
                    return res.status(400).json({
                        success: false,
                        message: '父评论不属于当前帖子'
                    });
                }
            }

            // 7. 验证是否重复评论（同一用户在同一帖子下内容完全相同的评论）
            const [duplicateComment] = await execute(
                'SELECT comment_id FROM post_comment WHERE post_id = ? AND author_id = ? AND content = ?',
                [post_id, user_id, content]
            );

            if (duplicateComment.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '您已发表过相同内容的评论'
                });
            }

            // 8. 所有验证通过，创建评论
            const commentId = await PostComment.create({
                post_id,
                user_id,
                parent_comment_id,
                content,
                comment_type: finalCommentType
            });

            // 9. 更新帖子的评论数
            await execute(
                'UPDATE community_post SET comments_count = comments_count + 1 WHERE post_id = ?',
                [post_id]
            );

            console.log('评论创建成功:', { commentId, post_id, user_id, comment_type: finalCommentType });

            // 获取刚创建的评论详情（包含用户信息）
            const [newComments] = await execute(`
                SELECT pc.*, u.user_name
                FROM post_comment pc
                LEFT JOIN user u ON pc.author_id = u.user_id
                WHERE pc.comment_id = ?
            `, [commentId]);

            if (newComments.length === 0) {
                throw new Error('无法获取新创建的评论详情');
            }

            const newComment = newComments[0];

            console.log('返回的评论数据:', newComment);

            res.status(201).json({
                success: true,
                message: finalCommentType === 'qa_answer' ? '回答提交成功' : '评论创建成功',
                data: newComment
            });

        } catch (error) {
            console.error('创建评论错误:', error);
            
            // 处理数据库约束错误
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({
                    success: false,
                    message: '关联数据不存在，请检查帖子ID或用户ID'
                });
            }
            
            res.status(500).json({
                success: false,
                message: '创建评论失败: ' + error.message,
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    },

    // 获取帖子评论
    getPostComments: async (req, res) => {
        try {
            const { postId } = req.params;
            const { current_user_id, comment_type } = req.query;
            
            console.log('获取帖子评论请求参数:', { 
                params: req.params, 
                query: req.query,
                postId: postId 
            });
            
            // 验证 postId 是否存在
            if (!postId) {
                return res.status(400).json({
                    success: false,
                    message: '帖子ID为必填项'
                });
            }

            let query = `
                SELECT pc.*, u.user_name
                FROM post_comment pc
                LEFT JOIN user u ON pc.author_id = u.user_id
                WHERE pc.post_id = ?
            `;
            const params = [postId];

            // 如果有评论类型筛选
            if (comment_type) {
                query += ' AND pc.comment_type = ?';
                params.push(comment_type);
            }

            query += ' ORDER BY pc.create_time ASC';

            console.log('执行查询SQL:', query, '参数:', params);
            
            const [comments] = await execute(query, params);

            console.log(`获取到 ${comments.length} 条评论`, comments);

            // 为每个评论添加是否是当前用户创建的标志
            const commentsWithOwnership = comments.map(comment => ({
                ...comment,
                is_owner: current_user_id && comment.author_id === parseInt(current_user_id)
            }));

            res.json({
                success: true,
                data: commentsWithOwnership,
                meta: {
                    total: comments.length,
                    post_id: postId,
                    comment_type: comment_type || 'all'
                }
            });
        } catch (error) {
            console.error('获取评论错误:', error);
            res.status(500).json({
                success: false,
                message: '获取评论失败: ' + error.message,
                error_details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    },

    // 更新评论
    updateComment: async (req, res) => {
        try {
            const { commentId } = req.params;
            const { content, user_id } = req.body;

            console.log('更新评论请求:', { commentId, content, user_id });

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID为必填项'
                });
            }

            // 检查权限
            const [comment] = await execute(
                'SELECT author_id FROM post_comment WHERE comment_id = ?',
                [commentId]
            );

            if (comment.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '评论不存在'
                });
            }

            if (comment[0].author_id !== parseInt(user_id)) {
                return res.status(403).json({
                    success: false,
                    message: '只有作者才能编辑评论'
                });
            }

            const [result] = await execute(
                'UPDATE post_comment SET content = ? WHERE comment_id = ?',
                [content, commentId]
            );

            if (result.affectedRows > 0) {
                res.json({
                    success: true,
                    message: '评论更新成功'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: '评论不存在'
                });
            }
        } catch (error) {
            console.error('更新评论错误:', error);
            res.status(500).json({
                success: false,
                message: '更新评论失败: ' + error.message
            });
        }
    },

    // 删除评论
    deleteComment: async (req, res) => {
        try {
            const { commentId } = req.params;
            const { user_id } = req.body;

            console.log('删除评论请求:', { commentId, user_id });

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID为必填项'
                });
            }

            // 1. 检查评论是否存在并获取帖子ID
            const [commentExists] = await execute(
                'SELECT comment_id, author_id, post_id FROM post_comment WHERE comment_id = ?',
                [commentId]
            );

            if (commentExists.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '评论不存在'
                });
            }

            const comment = commentExists[0];
            const postId = comment.post_id;

            // 2. 检查当前用户是否为评论作者
            if (comment.author_id !== parseInt(user_id)) {
                return res.status(403).json({
                    success: false,
                    message: '只有作者才能删除评论'
                });
            }

            // 3. 开始事务处理
            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                // 先删除相关的点赞记录
                await connection.execute(
                    'DELETE FROM comment_like WHERE comment_id = ?',
                    [commentId]
                );

                // 删除评论
                const [deleteResult] = await connection.execute(
                    'DELETE FROM post_comment WHERE comment_id = ?',
                    [commentId]
                );

                if (deleteResult.affectedRows === 0) {
                    await connection.rollback();
                    return res.status(404).json({
                        success: false,
                        message: '评论不存在'
                    });
                }

                // 更新帖子评论数
                await connection.execute(
                    'UPDATE community_post SET comments_count = GREATEST(comments_count - 1, 0) WHERE post_id = ?',
                    [postId]
                );

                // 获取更新后的评论数
                const [post] = await connection.execute(
                    'SELECT comments_count FROM community_post WHERE post_id = ?',
                    [postId]
                );

                await connection.commit();

                console.log('评论删除成功，已更新帖子评论数:', { 
                    commentId, 
                    postId, 
                    newCommentCount: post[0].comments_count 
                });

                res.json({
                    success: true,
                    message: '评论删除成功',
                    data: {
                        post_id: postId,
                        comment_count: post[0].comments_count
                    }
                });

            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('删除评论错误:', error);
            res.status(500).json({
                success: false,
                message: '删除评论失败: ' + error.message
            });
        }
    },

    // 点赞评论
    likeComment: async (req, res) => {
        try {
            const { commentId } = req.params;
            const { user_id } = req.body;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID为必填项'
                });
            }

            // 检查是否已经点赞
            const [existingLike] = await execute(
                'SELECT like_id FROM comment_like WHERE comment_id = ? AND user_id = ?',
                [commentId, user_id]
            );

            if (existingLike.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '您已经点赞过该评论'
                });
            }

            // 开始事务处理
            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                // 插入点赞记录
                await connection.execute(
                    'INSERT INTO comment_like (comment_id, user_id) VALUES (?, ?)',
                    [commentId, user_id]
                );

                // 更新评论点赞数
                await connection.execute(
                    'UPDATE post_comment SET likes_count = likes_count + 1 WHERE comment_id = ?',
                    [commentId]
                );

                // 获取更新后的点赞数
                const [updatedComment] = await connection.execute(
                    'SELECT likes_count FROM post_comment WHERE comment_id = ?',
                    [commentId]
                );

                await connection.commit();

                res.json({
                    success: true,
                    message: '点赞成功',
                    data: {
                        comment_id: parseInt(commentId),
                        like_count: updatedComment[0].likes_count,
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
            console.error('点赞评论错误:', error);
            res.status(500).json({
                success: false,
                message: '点赞失败: ' + error.message
            });
        }
    },

    // 取消点赞评论
    unlikeComment: async (req, res) => {
        try {
            const { commentId } = req.params;
            const { user_id } = req.body;

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
                    'DELETE FROM comment_like WHERE comment_id = ? AND user_id = ?',
                    [commentId, user_id]
                );

                if (deleteResult.affectedRows === 0) {
                    await connection.rollback();
                    return res.status(400).json({
                        success: false,
                        message: '您尚未点赞该评论'
                    });
                }

                // 更新评论点赞数
                await connection.execute(
                    'UPDATE post_comment SET likes_count = GREATEST(likes_count - 1, 0) WHERE comment_id = ?',
                    [commentId]
                );

                // 获取更新后的点赞数
                const [updatedComment] = await connection.execute(
                    'SELECT likes_count FROM post_comment WHERE comment_id = ?',
                    [commentId]
                );

                await connection.commit();

                res.json({
                    success: true,
                    message: '取消点赞成功',
                    data: {
                        comment_id: parseInt(commentId),
                        like_count: updatedComment[0].likes_count,
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
            console.error('取消点赞评论错误:', error);
            res.status(500).json({
                success: false,
                message: '取消点赞失败: ' + error.message
            });
        }
    },

    // 检查评论点赞状态
    checkCommentLike: async (req, res) => {
        try {
            const { commentId } = req.params;
            const { user_id } = req.query;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID为必填项'
                });
            }

            // 检查点赞状态
            const [likeStatus] = await execute(
                'SELECT like_id FROM comment_like WHERE comment_id = ? AND user_id = ?',
                [commentId, user_id]
            );

            // 获取评论点赞总数
            const [commentInfo] = await execute(
                'SELECT likes_count FROM post_comment WHERE comment_id = ?',
                [commentId]
            );

            const hasLiked = likeStatus.length > 0;

            res.json({
                success: true,
                data: {
                    comment_id: parseInt(commentId),
                    user_id: parseInt(user_id),
                    has_liked: hasLiked,
                    like_count: commentInfo[0] ? commentInfo[0].likes_count : 0
                }
            });

        } catch (error) {
            console.error('检查评论点赞状态错误:', error);
            res.status(500).json({
                success: false,
                message: '检查点赞状态失败: ' + error.message
            });
        }
    }
};

module.exports = commentController;
