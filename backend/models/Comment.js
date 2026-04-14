const { pool } = require('../config/database');

class CommentModel {
  // 根据视频ID获取所有评论和回复
  async getCommentsByVideoId(videoId) {

    const sql = `
      SELECT 
        c.comment_id,
        c.video_id,
        c.user_id,
        c.parent_comment_id,
        c.comment_content,
        c.like_count,
        c.created_time,
        c.updated_time,
        u.user_name,
        LEFT(u.user_name, 1) as avatar
      FROM video_comment c
      LEFT JOIN user u ON c.user_id = u.user_id
      WHERE c.video_id = ?
      ORDER BY c.created_time DESC
    `;

    const [rows] = await pool.execute(sql, [videoId]);

    return rows;
  }
  
  // 添加评论
  async addComment({ videoId, userId, content, parentId }) {

    const sql = `
      INSERT INTO video_comment 
        (video_id, user_id, parent_comment_id, comment_content, like_count) 
      VALUES (?, ?, ?, ?, 0)
    `;
    
    const [result] = await pool.execute(sql, [videoId, userId, parentId, content]);

    return result.insertId;
  }
  
  // 根据评论ID获取评论详情
  async getCommentById(commentId) {

    const sql = `
      SELECT 
        c.*,
        u.user_name,
        LEFT(u.user_name, 1) as avatar
      FROM video_comment c
      LEFT JOIN user u ON c.user_id = u.user_id
      WHERE c.comment_id = ?
    `;
    
    const [rows] = await pool.execute(sql, [commentId]);

    return rows[0] || null;
  }
  
  // 点赞评论
  async likeComment(commentId) {

    const sql = `
      UPDATE video_comment 
      SET like_count = like_count + 1 
      WHERE comment_id = ?
    `;
    
    await pool.execute(sql, [commentId]);

  }
}

module.exports = new CommentModel();