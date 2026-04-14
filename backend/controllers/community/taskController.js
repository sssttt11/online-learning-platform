// src/controllers/community/taskController.js
//小组任务
const { execute } = require('../../config/database');

const taskController = {
    // 创建小组任务
    createTask: async (req, res) => {
        try {
            const { teamId } = req.params;
            const { creator_id, title, description, deadline, assignee_id, priority } = req.body;

            console.log('创建任务请求:', { teamId, creator_id, title, deadline, assignee_id, priority });

            // 1. 基础字段验证
            if (!creator_id || !title) {
                return res.status(400).json({
                    success: false,
                    message: '创建者ID和任务标题为必填项'
                });
            }

            // 2. 验证团队是否存在且活跃
            const [teamExists] = await execute(
                'SELECT team_id, team_name, status FROM study_team WHERE team_id = ?',
                [teamId]
            );

            if (teamExists.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '学习小组不存在'
                });
            }

            if (teamExists[0].status !== 'active') {
                return res.status(400).json({
                    success: false,
                    message: '学习小组已关闭，无法创建任务'
                });
            }

            // 3. 验证创建者是否在团队中
            const [creatorInTeam] = await execute(
                'SELECT member_id FROM team_member WHERE team_id = ? AND user_id = ?',
                [teamId, creator_id]
            );

            if (creatorInTeam.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: '您不在该学习小组中，无法创建任务'
                });
            }

            // 4. 验证任务标题长度
            if (title.length < 2 || title.length > 200) {
                return res.status(400).json({
                    success: false,
                    message: '任务标题长度应在2-200个字符之间'
                });
            }

            // 5. 处理日期格式（转换为 team_task.due_date 使用的 datetime）
            let mysqlDeadline = null;
            if (deadline) {
                try {
                    // 将 ISO 格式转换为 MySQL 兼容的格式
                    const date = new Date(deadline);

                    if (isNaN(date.getTime())) {
                        return res.status(400).json({
                            success: false,
                            message: '截止时间格式无效'
                        });
                    }
                    // 转换为 MySQL 兼容的格式: YYYY-MM-DD HH:MM:SS
                    mysqlDeadline = date.toISOString().slice(0, 19).replace('T', ' ');
                    console.log('转换后的截止时间:', mysqlDeadline);
                } catch (error) {
                    return res.status(400).json({
                        success: false,
                        message: '截止时间格式错误: ' + error.message
                    });
                }
            }

            // 6. 处理优先级，默认 medium
            const taskPriority = ['low', 'medium', 'high'].includes(priority) ? priority : 'medium';

            // 7. 所有验证通过，创建任务
            const [result] = await execute(
                'INSERT INTO team_task (team_id, creator_id, assignee_id, title, description, due_date, priority) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [teamId, creator_id, assignee_id || creator_id, title, description, mysqlDeadline, taskPriority]
            );

            console.log('任务创建成功:', { taskId: result.insertId, teamId, creator_id });

            res.status(201).json({
                success: true,
                message: '任务创建成功',
                data: { task_id: result.insertId }
            });
        } catch (error) {
            console.error('创建任务错误:', error);

            // 处理数据库约束错误
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({
                    success: false,
                    message: '关联数据不存在，请检查团队ID或用户ID'
                });
            }

            res.status(500).json({
                success: false,
                message: '创建任务失败: ' + error.message,
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    },

    // 获取小组任务列表
    getTeamTasks: async (req, res) => {
        try {
            const { teamId } = req.params;
            const { status } = req.query;

            let query = `
                SELECT 
                    tt.task_id,
                    tt.team_id,
                    tt.title,
                    tt.description,
                    tt.creator_id,
                    tt.assignee_id,
                    tt.due_date,
                    tt.priority,
                    tt.status,
                    tt.create_time,
                    tt.update_time,
                    u.user_name as creator_name
                FROM team_task tt
                LEFT JOIN user u ON tt.creator_id = u.user_id
                WHERE tt.team_id = ?
            `;
            const params = [teamId];

            if (status) {
                query += ' AND tt.status = ?';
                params.push(status);
            }

            query += ' ORDER BY tt.create_time DESC';

            const [tasks] = await execute(query, params);

            res.json({
                success: true,
                data: tasks
            });
        } catch (error) {
            console.error('获取任务列表错误:', error);
            res.status(500).json({
                success: false,
                message: '获取任务列表失败: ' + error.message
            });
        }
    },

    // 更新任务状态
    updateTaskStatus: async (req, res) => {
        try {
            const { taskId } = req.params;
            const { status } = req.body;

            const validStatuses = ['pending', 'in_progress', 'completed'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: '状态值无效'
                });
            }

            const [result] = await execute(
                'UPDATE team_task SET status = ?, update_time = NOW() WHERE task_id = ?',
                [status, taskId]
            );

            if (result.affectedRows > 0) {
                const [updatedTask] = await execute(
                    'SELECT status, update_time FROM team_task WHERE task_id = ?',
                    [taskId]
                );

                res.json({
                    success: true,
                    message: '任务状态更新成功',
                    data: updatedTask[0] || null
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: '任务不存在'
                });
            }
        } catch (error) {
            console.error('更新任务状态错误:', error);
            res.status(500).json({
                success: false,
                message: '更新任务状态失败: ' + error.message
            });
        }
    },

    // 更新任务
    updateTask: async (req, res) => {
        try {
            const { taskId } = req.params;
            const { title, description, deadline } = req.body;

            const [result] = await execute(
                'UPDATE team_task SET title = ?, description = ?, due_date = ? WHERE task_id = ?',
                [title, description, deadline, taskId]
            );

            if (result.affectedRows > 0) {
                res.json({
                    success: true,
                    message: '任务更新成功'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: '任务不存在'
                });
            }
        } catch (error) {
            console.error('更新任务错误:', error);
            res.status(500).json({
                success: false,
                message: '更新任务失败: ' + error.message
            });
        }
    },

    // 删除任务
    deleteTask: async (req, res) => {
        try {
            const { taskId } = req.params;

            const [result] = await execute(
                'DELETE FROM team_task WHERE task_id = ?',
                [taskId]
            );

            if (result.affectedRows > 0) {
                res.json({
                    success: true,
                    message: '任务删除成功'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: '任务不存在'
                });
            }
        } catch (error) {
            console.error('删除任务错误:', error);
            res.status(500).json({
                success: false,
                message: '删除任务失败: ' + error.message
            });
        }
    }
};

module.exports = taskController;