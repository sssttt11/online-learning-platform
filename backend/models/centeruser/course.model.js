import { pool } from '../config/database.js';

class CourseModel {
  // 根据ID查找课程
  static async findById(courseId) {
    const [rows] = await pool.query(
      `SELECT 
        c.*,
        cc.category_name,
        u.user_name as teacher_name,
        u.avatar_url as teacher_avatar,
        COUNT(DISTINCT uc.user_id) as student_count,
        AVG(cr.rating) as avg_rating,
        COUNT(cr.review_id) as review_count
      FROM course c
      LEFT JOIN course_category cc ON c.category_id = cc.category_id
      LEFT JOIN user u ON c.teacher_user_id = u.user_id
      LEFT JOIN user_course uc ON c.course_id = uc.course_id
      LEFT JOIN course_review cr ON c.course_id = cr.course_id
      WHERE c.course_id = ?
      GROUP BY c.course_id, cc.category_name, u.user_name, u.avatar_url`,
      [courseId]
    );
    return rows[0];
  }

  // 获取教师的所有课程
  static async findByTeacher(teacherId) {
    const [rows] = await pool.query(
      `SELECT 
        c.*,
        cc.category_name,
        COUNT(DISTINCT uc.user_id) as student_count,
        AVG(cr.rating) as avg_rating
      FROM course c
      LEFT JOIN course_category cc ON c.category_id = cc.category_id
      LEFT JOIN user_course uc ON c.course_id = uc.course_id
      LEFT JOIN course_review cr ON c.course_id = cr.course_id
      WHERE c.teacher_user_id = ?
      GROUP BY c.course_id, cc.category_name
      ORDER BY c.created_time DESC`,
      [teacherId]
    );
    return rows;
  }

  // 获取所有课程（带分页）
  static async findAll(page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params = [];

    // 构建过滤条件
    if (filters.category_id) {
      whereClause += ' AND c.category_id = ?';
      params.push(filters.category_id);
    }

    if (filters.difficulty_level) {
      whereClause += ' AND c.difficulty_level = ?';
      params.push(filters.difficulty_level);
    }

    if (filters.is_online !== undefined) {
      whereClause += ' AND c.is_online = ?';
      params.push(filters.is_online);
    }

    if (filters.search) {
      whereClause += ' AND (c.course_name LIKE ? OR c.course_desc LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    // 获取课程列表
    const [courses] = await pool.query(
      `SELECT 
        c.*,
        cc.category_name,
        u.user_name as teacher_name,
        u.avatar_url as teacher_avatar,
        COUNT(DISTINCT uc.user_id) as student_count,
        AVG(cr.rating) as avg_rating,
        COUNT(cr.review_id) as review_count
      FROM course c
      LEFT JOIN course_category cc ON c.category_id = cc.category_id
      LEFT JOIN user u ON c.teacher_user_id = u.user_id
      LEFT JOIN user_course uc ON c.course_id = uc.course_id
      LEFT JOIN course_review cr ON c.course_id = cr.course_id
      ${whereClause}
      GROUP BY c.course_id, cc.category_name, u.user_name, u.avatar_url
      ORDER BY c.student_count DESC, c.rating DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // 获取总数
    const [totalResult] = await pool.query(
      `SELECT COUNT(DISTINCT c.course_id) as total
      FROM course c
      ${whereClause}`,
      params
    );

    return {
      courses,
      total: totalResult[0].total,
      page,
      limit,
      totalPages: Math.ceil(totalResult[0].total / limit)
    };
  }

  // 创建课程
  static async create(courseData) {
    const {
      course_name,
      course_desc,
      cover_img,
      category_id,
      teacher_user_id,
      difficulty_level = 'beginner',
      course_duration = 0,
      is_online = 0
    } = courseData;

    const [result] = await pool.query(
      `INSERT INTO course 
      (course_name, course_desc, cover_img, category_id, teacher_user_id, difficulty_level, course_duration, is_online)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [course_name, course_desc, cover_img, category_id, teacher_user_id, difficulty_level, course_duration, is_online]
    );

    return result.insertId;
  }

  // 更新课程信息
  static async update(courseId, courseData) {
    const fields = [];
    const values = [];

    const allowedFields = [
      'course_name',
      'course_desc',
      'cover_img',
      'category_id',
      'difficulty_level',
      'course_duration',
      'is_online',
      'student_count',
      'rating',
      'rating_count'
    ];

    allowedFields.forEach(field => {
      if (courseData[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(courseData[field]);
      }
    });

    if (fields.length === 0) return false;

    values.push(courseId);
    const [result] = await pool.query(
      `UPDATE course SET ${fields.join(', ')} WHERE course_id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  // 删除课程
  static async delete(courseId) {
    const [result] = await pool.query(
      'DELETE FROM course WHERE course_id = ?',
      [courseId]
    );
    return result.affectedRows > 0;
  }

  // 检查课程是否属于某个教师
  static async isOwnedByTeacher(courseId, teacherId) {
    const [rows] = await pool.query(
      'SELECT course_id FROM course WHERE course_id = ? AND teacher_user_id = ?',
      [courseId, teacherId]
    );
    return rows.length > 0;
  }

  // 获取课程章节和视频
  static async getCourseContent(courseId) {
    const [chapters] = await pool.query(
      `SELECT 
        cc.chapter_id,
        cc.chapter_title,
        cc.order_index,
        cc.created_time,
        COUNT(cv.video_id) as video_count,
        SUM(cv.duration_seconds) as total_duration
      FROM course_chapter cc
      LEFT JOIN course_video cv ON cc.chapter_id = cv.chapter_id
      WHERE cc.course_id = ?
      GROUP BY cc.chapter_id, cc.chapter_title, cc.order_index, cc.created_time
      ORDER BY cc.order_index`,
      [courseId]
    );

    // 获取每个章节的视频
    for (let chapter of chapters) {
      const [videos] = await pool.query(
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
        ORDER BY order_index`,
        [chapter.chapter_id]
      );
      chapter.videos = videos;
    }

    return chapters;
  }

  // 更新课程评分
  static async updateCourseRating(courseId) {
    const [ratingData] = await pool.query(
      `SELECT 
        AVG(rating) as avg_rating,
        COUNT(*) as rating_count
      FROM course_review
      WHERE course_id = ?`,
      [courseId]
    );

    if (ratingData[0].avg_rating) {
      await pool.query(
        'UPDATE course SET rating = ?, rating_count = ? WHERE course_id = ?',
        [parseFloat(ratingData[0].avg_rating).toFixed(1), ratingData[0].rating_count, courseId]
      );
    }

    return ratingData[0];
  }

  // 获取热门课程
  static async getPopularCourses(limit = 10) {
    const [rows] = await pool.query(
      `SELECT 
        c.*,
        cc.category_name,
        u.user_name as teacher_name,
        u.avatar_url as teacher_avatar,
        COUNT(DISTINCT uc.user_id) as student_count,
        AVG(cr.rating) as avg_rating
      FROM course c
      LEFT JOIN course_category cc ON c.category_id = cc.category_id
      LEFT JOIN user u ON c.teacher_user_id = u.user_id
      LEFT JOIN user_course uc ON c.course_id = uc.course_id
      LEFT JOIN course_review cr ON c.course_id = cr.course_id
      GROUP BY c.course_id, cc.category_name, u.user_name, u.avatar_url
      ORDER BY student_count DESC, avg_rating DESC
      LIMIT ?`,
      [limit]
    );
    return rows;
  }

  // 获取课程统计信息
  static async getCourseStats(courseId) {
    const [stats] = await pool.query(
      `SELECT 
        COUNT(DISTINCT uc.user_id) as total_students,
        AVG(uc.progress) as avg_progress,
        COUNT(DISTINCT cr.review_id) as total_reviews,
        AVG(cr.rating) as avg_rating,
        COUNT(DISTINCT cv.video_id) as total_videos,
        SUM(cv.duration_seconds) as total_duration
      FROM course c
      LEFT JOIN user_course uc ON c.course_id = uc.course_id
      LEFT JOIN course_review cr ON c.course_id = cr.course_id
      LEFT JOIN course_chapter cc ON c.course_id = cc.course_id
      LEFT JOIN course_video cv ON cc.chapter_id = cv.chapter_id
      WHERE c.course_id = ?
      GROUP BY c.course_id`,
      [courseId]
    );
    return stats[0] || {};
  }
}

export default CourseModel;