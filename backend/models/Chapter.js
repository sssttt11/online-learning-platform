// models/Chapter.js
const { pool } = require('../config/database');

class Chapter {
  // 获取课程的所有章节
  static async getByCourseId(courseId) {
    const [chapters] = await pool.execute(
      `SELECT 
        chapter_id,
        chapter_title,
        order_index,
        created_time
       FROM course_chapter 
       WHERE course_id = ?
       ORDER BY order_index ASC`,
      [courseId]
    );
    return chapters;
  }

  // 获取章节的视频列表
  static async getVideos(chapterId) {
    const [videos] = await pool.execute(
      `SELECT 
        video_id,
        video_title,
        video_url,
        video_desc,
        duration_seconds,
        order_index,
        created_time
       FROM course_video 
       WHERE chapter_id = ?
       ORDER BY order_index ASC`,
      [chapterId]
    );
    return videos;
  }
}

module.exports = Chapter;