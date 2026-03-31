const { execute } = require('../../config/database');

const teamAnalysisController = {
    // 获取小组成员任务完成时长数据（用于饼状图）
    // teamAnalysisController.js 中的 getTeamTaskCompletionData 函数修改部分

getTeamTaskCompletionData: async (req, res) => {
    try {
        const { teamId } = req.params;
        console.log('获取小组任务完成数据，teamId:', teamId);

        // 先获取团队成员
        const [members] = await execute(`
            SELECT tm.user_id, u.user_name, u.avatar_url
            FROM team_member tm
            JOIN user u ON tm.user_id = u.user_id
            WHERE tm.team_id = ? AND tm.status = 'active'
            ORDER BY tm.user_id
        `, [teamId]);

        console.log('团队成员:', members);

        const formattedData = [];
        
        // 为每个成员单独查询其任务（包括已完成和未完成）
        for (const member of members) {
            // 🔥 修改这里：移除 is_completed = 1 的条件，查询所有任务
            const [tasks] = await execute(`
                SELECT 
                    task_id,
                    title as task_title,
                    is_completed,
                    completion_time,
                    completed_at,
                    due_date,
                    priority,
                    description as task_description,
                    create_time as created_at,
                    update_time as updated_at
                FROM team_task 
                WHERE team_id = ? 
                    AND assignee_id = ?
                ORDER BY is_completed ASC, completed_at DESC, create_time DESC
            `, [teamId, member.user_id]);

            console.log(`用户 ${member.user_name} (ID: ${member.user_id}) 的任务数:`, tasks.length);
            
            // 按完成状态分组
            const completedTasks = tasks.filter(task => task.is_completed === 1);
            const pendingTasks = tasks.filter(task => task.is_completed !== 1);
            
            if (tasks.length > 0) {
                console.log(`任务详情:`, tasks.map(t => ({
                    id: t.task_id,
                    title: t.task_title,
                    is_completed: t.is_completed,
                    time: t.completion_time
                })));
            }

            // 🔥 修改：为已完成的任务生成饼状图数据
            const completedForChart = completedTasks.filter(task => task.completion_time && task.completion_time > 0);
            
            const labels = completedForChart.map(task => 
                task.task_title.length > 15 
                    ? task.task_title.substring(0, 15) + '...' 
                    : task.task_title
            );
            
            const data = completedForChart.map(task => task.completion_time);
            
            const totalCompletionMinutes = data.reduce((sum, time) => sum + time, 0);
            const completedTaskCount = completedTasks.length;

            formattedData.push({
                user_id: member.user_id,
                user_name: member.user_name,
                avatar_url: member.avatar_url,
                tasks: tasks, // 🔥 返回所有任务
                completed_tasks: completedTasks, // 已完成的任务
                pending_tasks: pendingTasks, // 未完成的任务
                completed_task_count: completedTaskCount,
                pending_task_count: pendingTasks.length,
                total_completion_hours: completedTaskCount > 0 ? (totalCompletionMinutes / 60).toFixed(1) : '0.0',
                average_completion_minutes: completedTaskCount > 0 
                    ? Math.round(totalCompletionMinutes / completedTaskCount)
                    : 0,
                // 🔥 注意：饼状图只显示已完成且有完成时间的任务
                pie_chart: completedForChart.length > 0 ? {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: completedForChart.map((_, index) => {
                            const colors = [
                                '#1a73e8', '#34a853', '#f9ab00', '#ea4335',
                                '#8e44ad', '#1abc9c', '#e74c3c', '#2ecc71'
                            ];
                            return colors[index % colors.length];
                        }),
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                } : null
            });
        }

        console.log('格式化后的任务数据:', formattedData.map(user => ({
            user_id: user.user_id,
            user_name: user.user_name,
            total_tasks: user.tasks.length,
            completed_task_count: user.completed_task_count,
            pending_task_count: user.pending_task_count,
            task_ids: user.tasks.map(t => ({id: t.task_id, completed: t.is_completed}))
        })));

        res.json({
            success: true,
            data: {
                users: formattedData,
                summary: {
                    total_users: formattedData.length,
                    total_tasks: formattedData.reduce((sum, user) => sum + user.tasks.length, 0),
                    total_completed_tasks: formattedData.reduce((sum, user) => sum + user.completed_task_count, 0),
                    total_pending_tasks: formattedData.reduce((sum, user) => sum + user.pending_task_count, 0),
                    total_completion_hours: formattedData.reduce((sum, user) => sum + parseFloat(user.total_completion_hours), 0).toFixed(1)
                }
            }
        });

    } catch (error) {
        console.error('获取小组任务完成数据错误:', error);
        res.status(500).json({
            success: false,
            message: '获取小组任务完成数据失败: ' + error.message,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
},
    // 更新任务完成状态（打勾/取消打勾）
    updateTaskCompletionStatus: async (req, res) => {
        try {
            const { taskId } = req.params;
            const { is_completed, completion_time, user_id } = req.body;

            console.log('更新任务完成状态，taskId:', taskId, 'is_completed:', is_completed, 'completion_time:', completion_time);

            // 检查任务是否存在且属于该用户
            const [task] = await execute(`
                SELECT task_id, assignee_id, is_completed
                FROM team_task 
                WHERE task_id = ? AND assignee_id = ?
            `, [taskId, user_id]);

            if (!task || task.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '任务不存在或您无权操作'
                });
            }

            // 构建更新SQL
            let updateSql = '';
            let params = [];
            
            if (is_completed === 1) {
                // 标记为已完成
                if (!completion_time || completion_time <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: '完成任务时必须提供有效的完成时间（大于0分钟）'
                    });
                }
                
                updateSql = `
                    UPDATE team_task 
                    SET 
                        is_completed = 1,
                        completion_time = ?,
                        completed_at = CURRENT_TIMESTAMP,
                        update_time = CURRENT_TIMESTAMP
                    WHERE task_id = ? AND assignee_id = ?
                `;
                params = [completion_time, taskId, user_id];
            } else {
                // 标记为未完成（取消打勾）
                updateSql = `
                    UPDATE team_task 
                    SET 
                        is_completed = 0,
                        completion_time = NULL,
                        completed_at = NULL,
                        update_time = CURRENT_TIMESTAMP
                    WHERE task_id = ? AND assignee_id = ?
                `;
                params = [taskId, user_id];
            }

            const [result] = await execute(updateSql, params);

            if (result.affectedRows > 0) {
                res.json({
                    success: true,
                    message: is_completed ? '任务已完成' : '任务已标记为未完成',
                    data: {
                        task_id: taskId,
                        is_completed: is_completed,
                        completion_time: is_completed ? completion_time : null,
                        completed_at: is_completed ? new Date().toISOString() : null,
                        update_time: new Date().toISOString()
                    }
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: '更新失败'
                });
            }

        } catch (error) {
            console.error('更新任务完成状态错误:', error);
            res.status(500).json({
                success: false,
                message: '更新任务完成状态失败: ' + error.message
            });
        }
    },

    // 快速完成（打勾时使用默认时间）
    quickCompleteTask: async (req, res) => {
        try {
            const { taskId } = req.params;
            const { user_id } = req.body;
            const defaultCompletionTime = 30; // 默认30分钟

            console.log('快速完成任务，taskId:', taskId, 'user_id:', user_id);

            // 检查任务是否存在且属于该用户
            const [task] = await execute(`
                SELECT task_id, assignee_id, is_completed
                FROM team_task 
                WHERE task_id = ? AND assignee_id = ?
            `, [taskId, user_id]);

            if (!task || task.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '任务不存在或您无权操作'
                });
            }

            if (task[0].is_completed === 1) {
                return res.status(400).json({
                    success: false,
                    message: '任务已完成'
                });
            }

            // 更新任务为已完成
            const [result] = await execute(`
                UPDATE team_task 
                SET 
                    is_completed = 1,
                    completion_time = ?,
                    completed_at = CURRENT_TIMESTAMP,
                    update_time = CURRENT_TIMESTAMP
                WHERE task_id = ? AND assignee_id = ?
            `, [defaultCompletionTime, taskId, user_id]);

            if (result.affectedRows > 0) {
                res.json({
                    success: true,
                    message: '任务已完成',
                    data: {
                        task_id: taskId,
                        is_completed: 1,
                        completion_time: defaultCompletionTime,
                        completed_at: new Date().toISOString(),
                        update_time: new Date().toISOString()
                    }
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: '更新失败'
                });
            }

        } catch (error) {
            console.error('快速完成任务错误:', error);
            res.status(500).json({
                success: false,
                message: '快速完成任务失败: ' + error.message
            });
        }
    },

    // 获取团队任务统计信息（用于进度条等）
    getTeamTasksStatistics: async (req, res) => {
        try {
            const { teamId } = req.params;
            
            // 获取团队所有任务
            const [allTasks] = await execute(`
                SELECT 
                    task_id,
                    title,
                    assignee_id,
                    is_completed,
                    completion_time
                FROM team_task 
                WHERE team_id = ?
            `, [teamId]);

            // 获取团队成员
            const [members] = await execute(`
                SELECT tm.user_id, u.user_name
                FROM team_member tm
                JOIN user u ON tm.user_id = u.user_id
                WHERE tm.team_id = ? AND tm.status = 'active'
            `, [teamId]);

            // 按成员统计任务完成情况
            const memberStatistics = members.map(member => {
                const memberTasks = allTasks.filter(task => task.assignee_id === member.user_id);
                const completedTasks = memberTasks.filter(task => task.is_completed === 1);
                const totalTasks = memberTasks.length;
                
                return {
                    user_id: member.user_id,
                    user_name: member.user_name,
                    completed_tasks: completedTasks.length,
                    total_tasks: totalTasks,
                    completion_rate: totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0,
                    tasks: memberTasks.map(task => ({
                        task_id: task.task_id,
                        title: task.title,
                        is_completed: task.is_completed,
                        completion_time: task.completion_time
                    }))
                };
            });

            // 总体统计
            const totalCompleted = allTasks.filter(task => task.is_completed === 1).length;
            const totalTasks = allTasks.length;

            res.json({
                success: true,
                data: {
                    team_id: parseInt(teamId),
                    summary: {
                        total_tasks: totalTasks,
                        completed_tasks: totalCompleted,
                        completion_rate: totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0
                    },
                    members: memberStatistics,
                    tasks_by_status: {
                        completed: totalCompleted,
                        pending: totalTasks - totalCompleted
                    }
                }
            });

        } catch (error) {
            console.error('获取团队任务统计错误:', error);
            res.status(500).json({
                success: false,
                message: '获取团队任务统计失败: ' + error.message
            });
        }
    },

    // 兼容旧的 updateTaskCompletionTime 方法（可选）
    updateTaskCompletionTime: async (req, res) => {
        // 直接调用新的 updateTaskCompletionStatus 方法
        // 或者返回一个提示信息
        return res.status(400).json({
            success: false,
            message: '请使用新的 /tasks/:taskId/completion-status 接口'
        });
    }
};

module.exports = teamAnalysisController;