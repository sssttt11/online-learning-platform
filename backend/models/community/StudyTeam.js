const { execute } = require('../../config/database');

class StudyTeam {
    // 创建学习小组
    static async create(teamData) {
        const [result] = await execute(
            'INSERT INTO study_team (team_name, description, course_id, creator_id, max_members, tags) VALUES (?, ?, ?, ?, ?, ?)',
            [teamData.team_name, teamData.description, teamData.course_id, teamData.creator_id, teamData.max_members, JSON.stringify(teamData.tags)]
        );
        return result.insertId;
    }

    // 获取学习小组列表
    static async findAll(filters = {}) {
        let query = `
            SELECT st.*, u.user_name as creator_name, 
                   COUNT(tm.member_id) as member_count
            FROM study_team st
            LEFT JOIN user u ON st.creator_id = u.user_id
            LEFT JOIN team_member tm ON st.team_id = tm.team_id
            WHERE st.status = 'active'
        `;
        const params = [];

        if (filters.course_id) {
            query += ' AND st.course_id = ?';
            params.push(filters.course_id);
        }

        query += ' GROUP BY st.team_id ORDER BY st.create_time DESC';

        const [rows] = await execute(query, params);
        return rows;
    }

    // 根据ID获取小组详情
    static async findById(teamId) {
        const [rows] = await execute(`
            SELECT st.*, u.user_name as creator_name
            FROM study_team st
            LEFT JOIN user u ON st.creator_id = u.user_id
            WHERE st.team_id = ?
        `, [teamId]);
        return rows[0];
    }

    // 更新小组信息
    static async update(teamId, updateData) {
        const [result] = await execute(
            'UPDATE study_team SET team_name = ?, description = ?, max_members = ?, tags = ? WHERE team_id = ?',
            [updateData.team_name, updateData.description, updateData.max_members, JSON.stringify(updateData.tags), teamId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = StudyTeam;