// src/models/community/TeamMember.js
const { execute } = require('../../config/database');

class TeamMember {
    // 添加小组成员
    static async addMember(teamId, userId, role = 'member') {
        const [result] = await execute(
            'INSERT INTO team_member (team_id, user_id, role) VALUES (?, ?, ?)',
            [teamId, userId, role]
        );
        return result.insertId;
    }

    // 获取小组成员列表
    static async getTeamMembers(teamId) {
        const [rows] = await execute(`
            SELECT tm.*, u.user_name, u.avatar_url
            FROM team_member tm
            LEFT JOIN user u ON tm.user_id = u.user_id
            WHERE tm.team_id = ?
            ORDER BY 
                CASE tm.role 
                    WHEN 'leader' THEN 1 
                    ELSE 2 
                END,
                tm.join_time
        `, [teamId]);
        return rows;
    }

    // 检查用户是否已在小组中
    static async isUserInTeam(teamId, userId) {
        const [rows] = await execute(
            'SELECT * FROM team_member WHERE team_id = ? AND user_id = ?',
            [teamId, userId]
        );
        return rows.length > 0;
    }

    // 更新成员角色
    static async updateMemberRole(teamId, userId, role) {
        const [result] = await execute(
            'UPDATE team_member SET role = ? WHERE team_id = ? AND user_id = ?',
            [role, teamId, userId]
        );
        return result.affectedRows > 0;
    }

    // 移除成员
    static async removeMember(teamId, userId) {
        const [result] = await execute(
            'DELETE FROM team_member WHERE team_id = ? AND user_id = ?',
            [teamId, userId]
        );
        return result.affectedRows > 0;
    }

    // 获取用户加入的小组
    static async getUserTeams(userId) {
        const [rows] = await execute(`
            SELECT st.*, tm.role, tm.join_time
            FROM team_member tm
            LEFT JOIN study_team st ON tm.team_id = st.team_id
            WHERE tm.user_id = ? AND st.status = 'active'
            ORDER BY tm.join_time DESC
        `, [userId]);
        return rows;
    }
}

module.exports = TeamMember;