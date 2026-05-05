// src/controllers/community/roomController.js
const StudyRoom = require('../../models/community/StudyRoom');
const RoomMember = require('../../models/community/RoomMember');
const { execute } = require('../../config/database');
const path = require('path');

async function getRoomAdminStatus(roomId, userId) {
    const [rooms] = await execute(
        'SELECT creator_id FROM study_room WHERE room_id = ? LIMIT 1',
        [roomId]
    );

    if (rooms.length === 0) {
        return {
            exists: false,
            creatorId: null,
            isOwner: false,
            isAdmin: false
        };
    }

    const creatorId = rooms[0].creator_id;
    if (!userId) {
        return {
            exists: true,
            creatorId,
            isOwner: false,
            isAdmin: false
        };
    }

    if (creatorId === userId) {
        return {
            exists: true,
            creatorId,
            isOwner: true,
            isAdmin: true
        };
    }

    const [memberRows] = await execute(
        'SELECT role FROM room_member WHERE room_id = ? AND user_id = ? LIMIT 1',
        [roomId, userId]
    );

    const isAdmin = memberRows.length > 0 && memberRows[0].role === 'admin';

    return {
        exists: true,
        creatorId,
        isOwner: false,
        isAdmin
    };
}

const roomController = {
// 获取自习室任务统计（用于任务清单）
getRoomTaskStatistics: async (req, res) => {
    try {
        const { roomId } = req.params;
        const { user_id } = req.query;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: '用户ID为必填项'
            });
        }

        // 1. 获取任务总数和完成数
        const [taskStats] = await execute(`
            SELECT 
                COUNT(*) as total_tasks,
                COUNT(CASE WHEN completed_time IS NOT NULL THEN 1 END) as completed_tasks,
                COUNT(CASE WHEN completed_time IS NULL THEN 1 END) as pending_tasks,
                SUM(CASE WHEN completed_time IS NOT NULL THEN estimated_hours ELSE 0 END) as total_completion_hours,
                ROUND(AVG(CASE WHEN completed_time IS NOT NULL THEN estimated_hours * 60 ELSE NULL END)) as average_completion_minutes
            FROM study_task 
            WHERE room_id = ? AND user_id = ? AND status = 'active'
        `, [roomId, user_id]);

        // 2. 获取按分类的完成时间分布（用于饼状图）
        const [categoryStats] = await execute(`
            SELECT 
                category,
                SUM(CASE WHEN completed_time IS NOT NULL THEN estimated_hours * 60 ELSE 0 END) as total_minutes,
                COUNT(CASE WHEN completed_time IS NOT NULL THEN 1 END) as completed_count
            FROM study_task 
            WHERE room_id = ? AND user_id = ? AND status = 'active'
            GROUP BY category
            HAVING total_minutes > 0
            ORDER BY total_minutes DESC
        `, [roomId, user_id]);

        // 构建饼状图数据
        const pieChartData = {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: []
            }]
        };

        const colors = [
            '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', 
            '#118AB2', '#073B4C', '#EF476F', '#7209B7'
        ];

        categoryStats.forEach((item, index) => {
            pieChartData.labels.push(item.category);
            pieChartData.datasets[0].data.push(item.total_minutes);
            pieChartData.datasets[0].backgroundColor.push(colors[index % colors.length]);
        });

        // 3. 计算完成率
        const totalTasks = taskStats[0].total_tasks || 0;
        const completedTasks = taskStats[0].completed_tasks || 0;
        const completionRate = totalTasks > 0 ? 
            Math.round((completedTasks / totalTasks) * 100) : 0;

        res.json({
            success: true,
            data: {
                user_id: parseInt(user_id),
                total_tasks: totalTasks,
                completed_tasks: completedTasks,
                pending_tasks: taskStats[0].pending_tasks || 0,
                completion_rate: completionRate,
                total_completion_hours: (taskStats[0].total_completion_hours || 0).toFixed(1),
                average_completion_minutes: taskStats[0].average_completion_minutes || 0,
                pie_chart: pieChartData
            }
        });
    } catch (error) {
        console.error('获取自习室任务统计错误:', error);
        res.status(500).json({
            success: false,
            message: '获取任务统计失败: ' + error.message
        });
    }
},

// 更新任务完成时间（用于保存完成时间）
updateTaskCompletionTime: async (req, res) => {
    try {
        const { taskId } = req.params;
        const { user_id, completion_time } = req.body;

        if (!user_id || !completion_time) {
            return res.status(400).json({
                success: false,
                message: '用户ID和完成时间为必填项'
            });
        }

        // 验证完成时间（1-480分钟，即1分钟到8小时）
        const completionMinutes = parseInt(completion_time);
        if (isNaN(completionMinutes) || completionMinutes < 1 || completionMinutes > 480) {
            return res.status(400).json({
                success: false,
                message: '完成时间应在1-480分钟之间'
            });
        }

        // 将分钟转换为小时（保留一位小数）
        const estimatedHours = (completionMinutes / 60).toFixed(1);

        const [result] = await execute(`
            UPDATE study_task 
            SET 
                completed_time = NOW(),
                estimated_hours = ?,
                update_time = NOW()
            WHERE task_id = ? AND user_id = ?
        `, [estimatedHours, taskId, user_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: '任务不存在或无权限更新'
            });
        }

        res.json({
            success: true,
            message: '任务完成时间已保存'
        });
    } catch (error) {
        console.error('更新任务完成时间错误:', error);
        res.status(500).json({
            success: false,
            message: '保存完成时间失败: ' + error.message
        });
    }
},

// 快速完成任务（默认30分钟）
quickCompleteTask: async (req, res) => {
    try {
        const { taskId } = req.params;
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: '用户ID为必填项'
            });
        }

        // 使用默认30分钟（0.5小时）
        const estimatedHours = 0.5;

        const [result] = await execute(`
            UPDATE study_task 
            SET 
                completed_time = NOW(),
                estimated_hours = ?,
                update_time = NOW()
            WHERE task_id = ? AND user_id = ? AND completed_time IS NULL
        `, [estimatedHours, taskId, user_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: '任务不存在、已完成或无权限更新'
            });
        }

        res.json({
            success: true,
            message: '任务已快速完成'
        });
    } catch (error) {
        console.error('快速完成任务错误:', error);
        res.status(500).json({
            success: false,
            message: '快速完成任务失败: ' + error.message
        });
    }
},

// 更新任务完成状态（用于打勾切换）
updateTaskCompletionStatus: async (req, res) => {
    try {
        const { taskId } = req.params;
        const { user_id, is_completed } = req.body;

        if (!user_id || typeof is_completed === 'undefined') {
            return res.status(400).json({
                success: false,
                message: '用户ID和完成状态为必填项'
            });
        }

        const isCompleted = parseInt(is_completed);
        if (![0, 1].includes(isCompleted)) {
            return res.status(400).json({
                success: false,
                message: '完成状态应为0（未完成）或1（已完成）'
            });
        }

        if (isCompleted === 1) {
            // 标记为已完成（使用当前时间）
            const [result] = await execute(`
                UPDATE study_task 
                SET 
                    completed_time = NOW(),
                    update_time = NOW()
                WHERE task_id = ? AND user_id = ? AND completed_time IS NULL
            `, [taskId, user_id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: '任务不存在、已完成或无权限更新'
                });
            }
        } else {
            // 标记为未完成（清除完成时间）
            const [result] = await execute(`
                UPDATE study_task 
                SET 
                    completed_time = NULL,
                    update_time = NOW()
                WHERE task_id = ? AND user_id = ? AND completed_time IS NOT NULL
            `, [taskId, user_id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: '任务不存在、未完成或无权限更新'
                });
            }
        }

        res.json({
            success: true,
            message: isCompleted ? '任务标记为已完成' : '任务标记为未完成'
        });
    } catch (error) {
        console.error('更新任务完成状态错误:', error);
        res.status(500).json({
            success: false,
            message: '更新任务状态失败: ' + error.message
        });
    }
},

    // 创建自习室
    createRoom: async (req, res) => {
        try {
            const { room_name, description, max_participants, schedule_time, tags, rules, creator_id } = req.body;

            console.log('创建自习室请求:', { room_name, creator_id });

            // 1. 基础字段验证
            if (!room_name || !description || !creator_id) {
                return res.status(400).json({
                    success: false,
                    message: '自习室名称、描述和创建者ID为必填项',
                    required_fields: ['room_name', 'description', 'creator_id']
                });
            }

            // 2. 验证字段长度
            if (room_name.length < 2 || room_name.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: '自习室名称长度应在2-100个字符之间'
                });
            }

            if (description.length < 10) {
                return res.status(400).json({
                    success: false,
                    message: '自习室描述应至少10个字符'
                });
            }

            // 3. 验证创建者是否存在
            const [userExists] = await execute(
                'SELECT user_id, user_name FROM user WHERE user_id = ?',
                [creator_id]
            );

            if (userExists.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '创建者用户不存在或已被禁用'
                });
            }

            // 4. 验证自习室名称是否重复
            const [roomExists] = await execute(
                'SELECT room_id FROM study_room WHERE room_name = ? AND status = "active"',
                [room_name]
            );

            if (roomExists.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '自习室名称已存在，请使用其他名称'
                });
            }

            // 5. 验证最大参与人数
            if (max_participants && (max_participants < 1 || max_participants > 200)) {
                return res.status(400).json({
                    success: false,
                    message: '自习室最大参与人数应在1-200人之间'
                });
            }

            // 6. 验证时间格式（简单验证）
            if (schedule_time && schedule_time.length > 50) {
                return res.status(400).json({
                    success: false,
                    message: '时间安排格式过长，请控制在50个字符以内'
                });
            }

            // 7. 验证标签格式
            if (tags && !Array.isArray(tags)) {
                return res.status(400).json({
                    success: false,
                    message: '标签格式错误，应为数组格式'
                });
            }

            // 8. 验证规则长度
            if (rules && rules.length > 1000) {
                return res.status(400).json({
                    success: false,
                    message: '自习室规则过长，请控制在1000个字符以内'
                });
            }

            // 9. 所有验证通过，创建自习室
            const roomId = await StudyRoom.create({
                room_name,
                description,
                creator_id,
                max_participants: max_participants || 50,
                schedule_time: schedule_time || null, 
                tags: tags || [],
                rules: rules || null               
            });

            console.log('自习室创建成功:', { roomId, room_name, creator_id });

            res.status(201).json({
                success: true,
                message: '自习室创建成功',
                data: { 
                    room_id: roomId,
                    room_name,
                    creator_id
                }
            });
        } catch (error) {
            console.error('创建自习室错误:', error);
            
            // 处理数据库约束错误
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({
                    success: false,
                    message: '关联数据不存在，请检查用户ID'
                });
            }
            
            res.status(500).json({
                success: false,
                message: '创建自习室失败: ' + error.message,
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    },

    getRooms: async (req, res) => {
        try {
            const { page = 1, limit = 10, current_user_id } = req.query;
            
            const rooms = await StudyRoom.findAll();
            
            // 为每个自习室添加是否是当前用户创建的标志
            const roomsWithOwnership = rooms.map(room => ({
                ...room,
                is_owner: room.creator_id === parseInt(current_user_id)
            }));
            
            res.json({
                success: true,
                data: roomsWithOwnership,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: rooms.length
                }
            });
        } catch (error) {
            console.error('获取自习室列表错误:', error);
            res.status(500).json({
                success: false,
                message: '获取自习室列表失败: ' + error.message
            });
        }
    },

    // 获取自习室详情
    getRoomDetail: async (req, res) => {
        try {
            const { roomId } = req.params;
            const { current_user_id } = req.query;
            
            // 获取自习室基本信息
            const [rooms] = await execute(`
                SELECT sr.*, u.user_name as creator_name, u.avatar_url as creator_avatar
                FROM study_room sr
                LEFT JOIN user u ON sr.creator_id = u.user_id
                WHERE sr.room_id = ?
            `, [roomId]);

            if (rooms.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '自习室不存在'
                });
            }

            const room = rooms[0];

            // 获取在线成员
            const members = await RoomMember.getRoomMembers(roomId);

            // 获取当前在线人数
            const [onlineCount] = await execute(
                'SELECT COUNT(*) as count FROM room_member WHERE room_id = ? AND leave_time IS NULL',
                [roomId]
            );

            const currentUserId = current_user_id ? parseInt(current_user_id) : null;
            const adminStatus = await getRoomAdminStatus(roomId, currentUserId);

            if (!adminStatus.exists) {
                return res.status(404).json({
                    success: false,
                    message: '自习室不存在'
                });
            }

            room.is_owner = adminStatus.isOwner;
            room.is_admin = adminStatus.isAdmin;

            res.json({
                success: true,
                data: {
                    ...room,
                    members,
                    online_count: onlineCount[0].count
                }
            });
        } catch (error) {
            console.error('获取自习室详情错误:', error);
            res.status(500).json({
                success: false,
                message: '获取自习室详情失败: ' + error.message
            });
        }
    },

    // 获取自习室成员
    getRoomMembers: async (req, res) => {
        try {
            const { roomId } = req.params;

            const members = await RoomMember.getRoomMembers(roomId);

            res.json({
                success: true,
                data: members
            });
        } catch (error) {
            console.error('获取自习室成员错误:', error);
            res.status(500).json({
                success: false,
                message: '获取自习室成员失败: ' + error.message
            });
        }
    },

    // 获取学习统计
    getRoomStats: async (req, res) => {
        try {
            const { roomId } = req.params;
            const { current_user_id } = req.query;

            const [statsRows] = await execute(`
                SELECT 
                    COUNT(CASE WHEN st.completed_time IS NOT NULL THEN 1 END) AS completedTasks,
                    SUM(st.estimated_hours) AS totalEstimatedHours,
                    SUM(CASE WHEN st.user_id = ? AND DATE(st.start_time) = CURDATE() THEN st.estimated_hours ELSE 0 END) AS todayStudyTime,
                    SUM(CASE WHEN st.user_id = ? AND YEARWEEK(st.start_time, 1) = YEARWEEK(CURDATE(), 1) THEN st.estimated_hours ELSE 0 END) AS weekStudyTime
                FROM study_task st
                WHERE st.room_id = ? AND st.status = 'active'
            `, [current_user_id, current_user_id, roomId]);

            const stats = statsRows[0] || {};

            res.json({
                success: true,
                data: {
                    completedTasks: Number(stats.completedTasks || 0),
                    totalStudyTime: Number(stats.totalEstimatedHours || 0),
                    todayStudyTime: Number(stats.todayStudyTime || 0),
                    weekStudyTime: Number(stats.weekStudyTime || 0)
                }
            });
        } catch (error) {
            console.error('获取自习室统计错误:', error);
            res.status(500).json({
                success: false,
                message: '获取自习室统计失败: ' + error.message
            });
        }
    },

    // 获取排行榜
    getRoomLeaderboard: async (req, res) => {
        try {
            const { roomId } = req.params;

            const [rows] = await execute(`
                SELECT 
                    st.user_id AS userId,
                    u.user_name AS name,
                    SUM(st.estimated_hours) AS totalStudyHours
                FROM study_task st
                LEFT JOIN user u ON st.user_id = u.user_id
                WHERE st.room_id = ? AND st.status = 'active'
                GROUP BY st.user_id, u.user_name
                ORDER BY totalStudyHours DESC
                LIMIT 20
            `, [roomId]);

            res.json({
                success: true,
                data: rows || []
            });
        } catch (error) {
            console.error('获取自习室排行榜错误:', error);
            res.status(500).json({
                success: false,
                message: '获取自习室排行榜失败: ' + error.message
            });
        }
    },

    // 获取自习室任务
    getRoomTasks: async (req, res) => {
        try {
            const { roomId } = req.params;
            const { status, user_id, range } = req.query;

            let query = `
                SELECT st.* , u.user_name
                FROM study_task st
                LEFT JOIN user u ON st.user_id = u.user_id
                WHERE st.room_id = ? AND st.status = 'active'
            `;
            const params = [roomId];

            if (user_id) {
                query += ' AND st.user_id = ?';
                params.push(user_id);
            }

            if (status) {
                query += ' AND (CASE WHEN st.completed_time IS NULL THEN "pending" ELSE "completed" END) = ?';
                params.push(status);
            }

            if (range === 'today') {
                query += ' AND DATE(st.start_time) = CURDATE()';
            } else if (range === 'yesterday') {
                query += ' AND DATE(st.start_time) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)';
            } else if (range === 'week') {
                query += ' AND YEARWEEK(st.start_time, 1) = YEARWEEK(CURDATE(), 1)';
            }

            query += ' ORDER BY st.start_time DESC, st.create_time DESC';

            const [tasks] = await execute(query, params);

            res.json({
                success: true,
                data: tasks || []
            });
        } catch (error) {
            console.error('获取自习室任务错误:', error);
            res.status(500).json({
                success: false,
                message: '获取自习室任务失败: ' + error.message
            });
        }
    },

    // 获取用户学习任务
    getUserStudyTasks: async (req, res) => {
        try {
            const { roomId } = req.params;
            const { user_id, range = 'today' } = req.query;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID为必填项'
                });
            }

            let query = `
                SELECT st.*
                FROM study_task st
                WHERE st.room_id = ? AND st.user_id = ? AND st.status = 'active'
            `;
            const params = [roomId, user_id];

            if (range === 'today') {
                query += ' AND DATE(st.start_time) = CURDATE()';
            } else if (range === 'yesterday') {
                query += ' AND DATE(st.start_time) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)';
            } else if (range === 'week') {
                query += ' AND YEARWEEK(st.start_time, 1) = YEARWEEK(CURDATE(), 1)';
            }

            query += ' ORDER BY st.create_time DESC';

            const [tasks] = await execute(query, params);

            res.json({
                success: true,
                data: tasks || []
            });
        } catch (error) {
            console.error('获取用户自习任务错误:', error);
            res.status(500).json({
                success: false,
                message: '获取自习任务失败: ' + error.message
            });
        }
    },

    // 学习任务历史
    getTaskHistory: async (req, res) => {
        try {
            const { roomId } = req.params;
            const { user_id } = req.query;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID为必填项'
                });
            }

            const [rows] = await execute(`
                SELECT 
                    st.*,
                    DATE_FORMAT(st.create_time, '%Y-%m-%d') AS formatted_create_time,
                    DATE_FORMAT(st.completed_time, '%Y-%m-%d') AS formatted_completed_time
                FROM study_task st
                WHERE st.room_id = ? AND st.user_id = ?
                ORDER BY st.create_time DESC
            `, [roomId, user_id]);

            res.json({
                success: true,
                data: rows || []
            });
        } catch (error) {
            console.error('获取任务历史错误:', error);
            res.status(500).json({
                success: false,
                message: '获取任务历史失败: ' + error.message
            });
        }
    },

    // 设置 / 取消管理员（仅房主）
    setRoomAdmin: async (req, res) => {
        try {
            const { roomId } = req.params;
            const { operator_id, target_user_id, is_admin } = req.body;

            if (!operator_id || !target_user_id || typeof is_admin === 'undefined') {
                return res.status(400).json({
                    success: false,
                    message: '操作人ID、目标用户ID和管理员状态为必填项'
                });
            }

            const operatorId = parseInt(operator_id, 10);
            const targetId = parseInt(target_user_id, 10);

            const status = await getRoomAdminStatus(roomId, operatorId);
            if (!status.exists) {
                return res.status(404).json({
                    success: false,
                    message: '自习室不存在'
                });
            }

            if (!status.isOwner) {
                return res.status(403).json({
                    success: false,
                    message: '只有自习室创建者可以设置或取消管理员'
                });
            }

            if (targetId === status.creatorId && is_admin === false) {
                return res.status(400).json({
                    success: false,
                    message: '不能取消房主的管理员身份'
                });
            }

            const [memberRows] = await execute(
                'SELECT member_id FROM room_member WHERE room_id = ? AND user_id = ? LIMIT 1',
                [roomId, targetId]
            );

            if (memberRows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '目标用户不是该自习室成员'
                });
            }

            const newRole = is_admin ? 'admin' : 'member';
            await execute(
                'UPDATE room_member SET role = ? WHERE room_id = ? AND user_id = ?',
                [newRole, roomId, targetId]
            );

            res.json({
                success: true,
                message: is_admin ? '已设为管理员' : '已取消管理员'
            });
        } catch (error) {
            console.error('设置管理员错误:', error);
            res.status(500).json({
                success: false,
                message: '设置管理员失败: ' + error.message
            });
        }
    },

    // 更新自习室规则（管理员）
    updateRoomRules: async (req, res) => {
        try {
            const { roomId } = req.params;
            const { user_id, rules } = req.body;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID为必填项'
                });
            }

            const userId = parseInt(user_id, 10);
            const status = await getRoomAdminStatus(roomId, userId);

            if (!status.exists) {
                return res.status(404).json({
                    success: false,
                    message: '自习室不存在'
                });
            }

            if (!status.isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: '只有管理员可以编辑自习室规则'
                });
            }

            let rulesList = [];
            if (Array.isArray(rules)) {
                rulesList = rules
                    .map(item => (typeof item === 'string' ? item.trim() : ''))
                    .filter(Boolean);
            } else if (typeof rules === 'string') {
                rulesList = rules
                    .split(/\r?\n/)
                    .map(item => item.replace(/^\d+[\.、]\s*/, '').trim())
                    .filter(Boolean);
            }

            const rulesValue = rulesList.length ? JSON.stringify(rulesList) : null;

            await execute(
                'UPDATE study_room SET rules = ? WHERE room_id = ?',
                [rulesValue, roomId]
            );

            res.json({
                success: true,
                message: '自习室规则更新成功'
            });
        } catch (error) {
            console.error('更新自习室规则错误:', error);
            res.status(500).json({
                success: false,
                message: '更新自习室规则失败: ' + error.message
            });
        }
    },

    // 更新自习室头像（管理员）
    updateRoomAvatar: async (req, res) => {
        try {
            const { roomId } = req.params;
            const { user_id } = req.body;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID为必填项'
                });
            }

            const userId = parseInt(user_id, 10);
            const status = await getRoomAdminStatus(roomId, userId);

            if (!status.exists) {
                return res.status(404).json({
                    success: false,
                    message: '自习室不存在'
                });
            }

            if (!status.isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: '只有管理员可以更新自习室头像'
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: '请上传头像文件'
                });
            }

            const filename = req.file.filename || path.basename(req.file.path);
            const avatarUrl = `/uploads/room-avatars/${filename}`;

            await execute(
                'UPDATE study_room SET avatar_url = ? WHERE room_id = ?',
                [avatarUrl, roomId]
            );

            res.json({
                success: true,
                message: '自习室头像更新成功',
                data: {
                    avatar_url: avatarUrl
                }
            });
        } catch (error) {
            console.error('更新自习室头像错误:', error);
            res.status(500).json({
                success: false,
                message: '更新自习室头像失败: ' + error.message
            });
        }
    },

    // 创建学习任务
    createStudyTask: async (req, res) => {
        try {
            const { roomId } = req.params;
            const { user_id, title, category = '学习任务', estimated_hours = 1, description } = req.body;

            if (!user_id || !title) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID和任务标题为必填项'
                });
            }

            const [result] = await execute(`
                INSERT INTO study_task (room_id, user_id, title, category, description, estimated_hours, start_time)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `, [roomId, user_id, title, category, description || null, estimated_hours]);

            res.status(201).json({
                success: true,
                message: '任务创建成功',
                data: {
                    task_id: result.insertId
                }
            });
        } catch (error) {
            console.error('创建学习任务错误:', error);
            res.status(500).json({
                success: false,
                message: '创建学习任务失败: ' + error.message
            });
        }
    },

    // 更新学习任务状态
    updateStudyTaskStatus: async (req, res) => {
        try {
            const { taskId } = req.params;
            const { status, user_id } = req.body;

            if (!status || !user_id) {
                return res.status(400).json({
                    success: false,
                    message: '状态和用户ID为必填项'
                });
            }

            const validStatuses = ['pending', 'completed'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: '任务状态不合法'
                });
            }

            const completedField = status === 'completed' ? 'NOW()' : 'NULL';

            const [result] = await execute(
                `UPDATE study_task 
                 SET completed_time = ${completedField}, update_time = NOW() 
                 WHERE task_id = ? AND user_id = ?`,
                [taskId, user_id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: '任务不存在或无权限更新'
                });
            }

            res.json({
                success: true,
                message: '任务状态更新成功'
            });
        } catch (error) {
            console.error('更新学习任务状态错误:', error);
            res.status(500).json({
                success: false,
                message: '更新任务状态失败: ' + error.message
            });
        }
    },

    // 加入自习室
    joinRoom: async (req, res) => {
        try {
            const { roomId } = req.params;
            const { user_id } = req.body;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID为必填项'
                });
            }

            await StudyRoom.joinRoom(roomId, user_id);

            res.json({
                success: true,
                message: '加入自习室成功'
            });
        } catch (error) {
            console.error('加入自习室错误:', error);
            res.status(500).json({
                success: false,
                message: '加入自习室失败: ' + error.message
            });
        }
    },

    // 离开自习室
    leaveRoom: async (req, res) => {
        try {
            const { roomId } = req.params;
            const { user_id } = req.body;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID为必填项'
                });
            }

            const success = await RoomMember.leaveRoom(roomId, user_id);

            if (success) {
                res.json({
                    success: true,
                    message: '已离开自习室'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: '您不在该自习室中'
                });
            }
        } catch (error) {
            console.error('离开自习室错误:', error);
            res.status(500).json({
                success: false,
                message: '离开自习室失败: ' + error.message
            });
        }
    },

    // 更新自习室
    updateRoom: async (req, res) => {
        try {
            const { roomId } = req.params;
            const { room_name, description, max_participants, schedule_time, tags, rules, user_id } = req.body;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID为必填项'
                });
            }

            // 检查权限
            const [room] = await execute(
                'SELECT creator_id FROM study_room WHERE room_id = ?',
                [roomId]
            );

            if (room.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '自习室不存在'
                });
            }

            const creatorId = room[0].creator_id;
            if (creatorId !== parseInt(user_id)) {
                return res.status(403).json({
                    success: false,
                    message: '只有创建者才能更新自习室'
                });
            }

            // 这里需要实现更新自习室的逻辑
            res.json({
                success: true,
                message: '自习室更新成功'
            });
        } catch (error) {
            console.error('更新自习室错误:', error);
            res.status(500).json({
                success: false,
                message: '更新自习室失败: ' + error.message
            });
        }
    },

    // 删除自习室
    deleteRoom: async (req, res) => {
        try {
            const { roomId } = req.params;
            const { user_id } = req.body;

            console.log('删除自习室请求:', { roomId, user_id });

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID为必填项'
                });
            }

            // 1. 检查自习室是否存在
            const [roomExists] = await execute(
                'SELECT room_id, creator_id FROM study_room WHERE room_id = ?',
                [roomId]
            );

            if (roomExists.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '自习室不存在'
                });
            }

            const room = roomExists[0];

            // 2. 检查当前用户是否为创建者
            if (room.creator_id !== parseInt(user_id)) {
                return res.status(403).json({
                    success: false,
                    message: '只有创建者才能删除自习室'
                });
            }

            // 3. 先删除相关的留言记录（外键约束）
            await execute(
                'DELETE FROM community_message WHERE room_id = ?',
                [roomId]
            );

            // 4. 删除相关的成员记录
            await execute(
                'DELETE FROM room_member WHERE room_id = ?',
                [roomId]
            );

            // 5. 删除自习室
            const [result] = await execute(
                'DELETE FROM study_room WHERE room_id = ?',
                [roomId]
            );

            if (result.affectedRows > 0) {
                console.log('自习室删除成功:', { roomId });
                res.json({
                    success: true,
                    message: '自习室删除成功'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: '自习室不存在'
                });
            }
        } catch (error) {
            console.error('删除自习室错误:', error);
            res.status(500).json({
                success: false,
                message: '删除自习室失败: ' + error.message
            });
        }
    }
};

module.exports = roomController;