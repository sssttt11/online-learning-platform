// src/controllers/community/messageController.js
const mysql = require('mysql2');
const { execute } = require('../../config/database');

const messageController = {
    // 创建自习室留言
    createMessage: async (req, res) => {
        try {
            const { roomId } = req.params;
            const { user_id, content } = req.body; // 移除 message_type = 'text'

            console.log('创建留言请求:', { roomId, user_id });

            if (!user_id || !content) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID和留言内容为必填项'
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

            // 验证自习室是否存在
            const [roomExists] = await execute(
                'SELECT room_id FROM study_room WHERE room_id = ? AND status IN ("open", "active")',
                [roomId]
            );

            if (roomExists.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '自习室不存在或已关闭'
                });
            }

            // 关键修复：使用数据库允许的 message_type = 'room'
            const [result] = await execute(
                'INSERT INTO community_message (room_id, sender_id, content, message_type) VALUES (?, ?, ?, "room")',
                [roomId, user_id, content] // 注意这里去掉了 message_type 参数
            );

            // 获取刚创建的留言详情
            const [messages] = await execute(`
                SELECT cm.*, u.user_name, u.avatar_url
                FROM community_message cm
                LEFT JOIN user u ON cm.sender_id = u.user_id
                WHERE cm.message_id = ?
            `, [result.insertId]);

            console.log('留言创建成功:', { messageId: result.insertId, roomId, user_id });

            res.status(201).json({
                success: true,
                message: '留言发送成功',
                data: messages[0]
            });
        } catch (error) {
            console.error('创建留言错误:', error);
            
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({
                    success: false,
                    message: '关联数据不存在，请检查自习室ID或用户ID'
                });
            }
            
            res.status(500).json({
                success: false,
                message: '留言发送失败: ' + error.message,
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    },

    // 获取自习室留言（也修复查询条件）
    getRoomMessages: async (req, res) => {
        try {
            const { roomId } = req.params;
            const { page = 1, limit = 50 } = req.query;

            console.log('获取留言请求:', { roomId, page, limit });

            // 确保参数是数字类型
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const offset = (pageNum - 1) * limitNum;

            // 验证参数有效性
            if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
                return res.status(400).json({
                    success: false,
                    message: '分页参数无效'
                });
            }

            // 关键修复：添加 message_type = 'room' 查询条件
            const sql = `
                SELECT cm.*, u.user_name, u.avatar_url
                FROM community_message cm
                LEFT JOIN user u ON cm.sender_id = u.user_id
                WHERE cm.room_id = ${mysql.escape(roomId)} AND cm.message_type = 'room'
                ORDER BY cm.create_time DESC
                LIMIT ${limitNum} OFFSET ${offset}
            `;

            console.log('执行的SQL:', sql);

            const [messages] = await execute(sql);

            // 获取总条数
            const [countResult] = await execute(
                'SELECT COUNT(*) as total FROM community_message WHERE room_id = ? AND message_type = "room"',
                [roomId]
            );

            const total = countResult[0].total;

            console.log('获取留言成功:', { roomId, count: messages.length, total });

            res.json({
                success: true,
                data: messages,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: total
                }
            });
        } catch (error) {
            console.error('获取留言错误:', error);
            console.error('错误详情:', {
                code: error.code,
                errno: error.errno,
                sqlState: error.sqlState,
                sqlMessage: error.sqlMessage
            });
            
            res.status(500).json({
                success: false,
                message: '获取留言失败: ' + error.message,
                error: process.env.NODE_ENV === 'development' ? {
                    code: error.code,
                    sqlMessage: error.sqlMessage
                } : undefined
            });
        }
    },

    // ===================== 组队学习：小组留言 =====================

    // 创建小组留言（按 team_id）
    createTeamComment: async (req, res) => {
        try {
            const { teamId } = req.params;
            const { user_id, content } = req.body; // 移除 message_type = 'team'

            if (!user_id || !content) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID和留言内容为必填项'
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

            // 关键修复：使用 message_type = 'team'
            const [result] = await execute(
                'INSERT INTO community_message (team_id, sender_id, content, message_type) VALUES (?, ?, ?, "team")',
                [teamId, user_id, content]
            );

            const [rows] = await execute(`
                SELECT cm.*, u.user_name, u.avatar_url
                FROM community_message cm
                LEFT JOIN user u ON cm.sender_id = u.user_id
                WHERE cm.message_id = ?
            `, [result.insertId]);

            res.status(201).json({
                success: true,
                message: '留言发送成功',
                data: rows[0]
            });
        } catch (error) {
            console.error('创建小组留言错误:', error);
            res.status(500).json({
                success: false,
                message: '创建小组留言失败: ' + error.message
            });
        }
    },

    // 获取小组留言（按 team_id）
    getTeamComments: async (req, res) => {
        try {
            const { teamId } = req.params;

            const [rows] = await execute(`
                SELECT cm.*, u.user_name, u.avatar_url
                FROM community_message cm
                LEFT JOIN user u ON cm.sender_id = u.user_id
                WHERE cm.team_id = ? AND cm.message_type = 'team'
                ORDER BY cm.create_time DESC
            `, [teamId]);

            res.json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('获取小组留言错误:', error);
            res.status(500).json({
                success: false,
                message: '获取小组留言失败: ' + error.message
            });
        }
    },

    // 删除留言
    deleteMessage: async (req, res) => {
        try {
            const { messageId } = req.params;
            const { user_id } = req.body; // 添加用户ID验证

            console.log('删除留言请求:', { messageId, user_id });

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID为必填项'
                });
            }

            // 验证用户是否有权限删除（只能删除自己的留言）
            const [message] = await execute(
                'SELECT message_id FROM community_message WHERE message_id = ? AND sender_id = ?',
                [messageId, user_id]
            );

            if (message.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: '无权删除该留言'
                });
            }

            const [result] = await execute(
                'DELETE FROM community_message WHERE message_id = ?',
                [messageId]
            );

            if (result.affectedRows > 0) {
                console.log('留言删除成功:', { messageId });
                res.json({
                    success: true,
                    message: '留言删除成功'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: '留言不存在'
                });
            }
        } catch (error) {
            console.error('删除留言错误:', error);
            res.status(500).json({
                success: false,
                message: '删除留言失败: ' + error.message
            });
        }
    }
};

module.exports = messageController;