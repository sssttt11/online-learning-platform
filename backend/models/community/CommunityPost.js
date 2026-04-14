const { execute } = require('../../config/database');

class CommunityPost {
    // 创建帖子
    static async create(postData) {
        const [result] = await execute(
            'INSERT INTO community_post (author_id, category, title, content, course_id, tags) VALUES (?, ?, ?, ?, ?, ?)',
            [postData.user_id, postData.post_type, postData.title, postData.content, postData.course_id, JSON.stringify(postData.tags)]
        );
        return result.insertId;
    }

    // 获取帖子列表
    static async findAll(filters = {}) {
        let query = `
            SELECT cp.*, u.user_name, u.avatar_url, c.course_name
            FROM community_post cp
            LEFT JOIN user u ON cp.author_id = u.user_id
            LEFT JOIN course c ON cp.course_id = c.course_id
            WHERE cp.status = 'published'
        `;
        const params = [];

        if (filters.post_type) {
            query += ' AND cp.category = ?';
            params.push(filters.post_type);
        }

        if (filters.course_id) {
            query += ' AND cp.course_id = ?';
            params.push(filters.course_id);
        }

        query += ' ORDER BY cp.create_time DESC';

        const [rows] = await execute(query, params);
        return rows;
    }

    // 根据ID获取帖子
    static async findById(postId) {
        const [rows] = await execute(`
            SELECT cp.*, u.user_name, u.avatar_url, c.course_name
            FROM community_post cp
            LEFT JOIN user u ON cp.author_id = u.user_id
            LEFT JOIN course c ON cp.course_id = c.course_id
            WHERE cp.post_id = ?
        `, [postId]);
        return rows[0];
    }
}

module.exports = CommunityPost;