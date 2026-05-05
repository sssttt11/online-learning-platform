// src/models/community/TeamTask.js
const { execute } = require('../../config/database');

class TeamTask {
    // 创建任务
    static async create(taskData) {
        const [result] = await execute(
            'INSERT INTO team_task (team_id, creator_id, task_title, task_content, deadline) VALUES (?, ?, ?, ?, ?)',
            [taskData.team_id, taskData.creator_id, taskData.task_title, taskData.task_content, taskData.deadline]
        );
        return result.insertId;
    }

    // 获取小组任务
    static async findByTeamId(teamId, filters = {}) {
        let query = `
            SELECT tt.*, u.user_name as creator_name
            FROM team_task tt
            LEFT JOIN user u ON tt.creator_id = u.user_id
            WHERE tt.team_id = ?
        `;
        const params = [teamId];

        if (filters.status) {
            query += ' AND tt.status = ?';
            params.push(filters.status);
        }

        query += ' ORDER BY tt.create_time DESC';

        const [rows] = await execute(query, params);
        return rows;
    }

    // 更新任务状态
    static async updateStatus(taskId, status) {
        const [result] = await execute(
            'UPDATE team_task SET status = ? WHERE task_id = ?',
            [status, taskId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = TeamTask;