const { execute } = require('../../config/database');

class PostComment {
    // 创建评论
    static async create(commentData) {
        const [result] = await execute(
            'INSERT INTO post_comment (post_id, author_id, parent_comment_id, content) VALUES (?, ?, ?, ?)',
            [commentData.post_id, commentData.user_id, commentData.parent_comment_id, commentData.content]
        );
        return result.insertId;
    }

    // 获取帖子的评论
    static async findByPostId(postId, commentType = null) {
        let query = `
            SELECT pc.*, u.user_name, u.avatar_url
            FROM post_comment pc
            LEFT JOIN user u ON pc.author_id = u.user_id
            WHERE pc.post_id = ?
        `;
        const params = [postId];

        if (commentType) {
            query += ' AND pc.comment_type = ?';
            params.push(commentType);
        }

        query += ' ORDER BY pc.create_time ASC';

        const [rows] = await execute(query, params);
        return rows;
    }
}

module.exports = PostComment;