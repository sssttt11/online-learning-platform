// models/Course.js
const { pool } = require('../config/database');

class Course {
  // 获取课程详情（包含讲师完整信息和课程扩展信息）
  static async getById(courseId) {
    const [courses] = await pool.execute(
      `SELECT 
        c.course_id,
        c.course_name,
        c.course_desc,
        c.cover_img,
        c.difficulty_level,
        c.course_duration,
        c.is_online,
        c.created_time,
        c.student_count,
        c.rating,
        c.rating_count,
        c.category_id,
        c.learning_objectives,
        c.course_features,
        c.course_overview,
        u.user_id as teacher_user_id,
        u.user_name as teacher_name,
        ud.user_intro as teacher_intro,
        ud.occupation as teacher_occupation,
        u.avatar_url as teacher_avatar,
        cc.category_name
       FROM course c
       LEFT JOIN user u ON c.teacher_user_id = u.user_id
       LEFT JOIN user_detail ud ON u.user_id = ud.user_id
       LEFT JOIN course_category cc ON c.category_id = cc.category_id
       WHERE c.course_id = ?`,
      [courseId]
    );
    
    const course = courses[0];
    if (course) {
      // 解析JSON字段
      try {
        course.learning_objectives = course.learning_objectives ? JSON.parse(course.learning_objectives) : [];
      } catch (e) {
        course.learning_objectives = [];
      }
      
      try {
        course.course_features = course.course_features ? JSON.parse(course.course_features) : [];
      } catch (e) {
        course.course_features = [];
      }
    }
    
    return course;
  }

  // 获取所有课程
  static async getAll() {
    const [courses] = await pool.execute(
      `SELECT 
        c.course_id,
        c.course_name,
        c.course_desc,
        c.cover_img,
        c.difficulty_level,
        c.rating,
        c.student_count,
        c.created_time,
        u.user_name AS teacher_name,
        COALESCE(COUNT(DISTINCT cv.video_id), 0) AS video_count
       FROM course c
       LEFT JOIN user u ON c.teacher_user_id = u.user_id
       LEFT JOIN course_chapter cc ON cc.course_id = c.course_id
       LEFT JOIN course_video cv ON cv.chapter_id = cc.chapter_id
       WHERE c.is_online = 1
       GROUP BY c.course_id
       ORDER BY (c.cover_img IS NOT NULL AND c.cover_img <> '') DESC,
                (video_count > 0) DESC,
                c.student_count DESC,
                c.created_time DESC`
    );
    return courses;
  }

  // 搜索课程
  static async search(keyword) {
    const [courses] = await pool.execute(
      `SELECT 
        c.course_id,
        c.course_name,
        c.course_desc,
        c.cover_img,
        c.difficulty_level,
        c.rating,
        c.student_count,
        c.created_time,
        u.user_name AS teacher_name,
        COALESCE(COUNT(DISTINCT cv.video_id), 0) AS video_count
       FROM course c
       LEFT JOIN user u ON c.teacher_user_id = u.user_id
       LEFT JOIN course_chapter cc ON cc.course_id = c.course_id
       LEFT JOIN course_video cv ON cv.chapter_id = cc.chapter_id
       WHERE (c.course_name LIKE ? OR c.course_desc LIKE ?) AND c.is_online = 1
       GROUP BY c.course_id
       ORDER BY (c.cover_img IS NOT NULL AND c.cover_img <> '') DESC,
                (video_count > 0) DESC,
                c.student_count DESC,
                c.created_time DESC`,
      [`%${keyword}%`, `%${keyword}%`]
    );
    return courses;
  }

  static async getStats(courseId) {
    const [[participantRow]] = await pool.execute(
      `SELECT COUNT(DISTINCT user_id) AS participatingUsers
       FROM learning_detail
       WHERE course_id = ?`,
      [courseId]
    );

    const [[commentRow]] = await pool.execute(
      `SELECT COUNT(*) AS totalComments
       FROM video_comment vc
       LEFT JOIN course_video cv ON vc.video_id = cv.video_id
       LEFT JOIN course_chapter cc ON cv.chapter_id = cc.chapter_id
       WHERE cc.course_id = ?`,
      [courseId]
    );

    const participatingUsers = participantRow?.participatingUsers ?? 0;
    const totalComments = commentRow?.totalComments ?? 0;

    return {
      participatingUsers,
      totalComments,
    };
  }

  // 查询用户是否收藏某课程
  static async getFavoriteStatus(userId, courseId) {
    const [rows] = await pool.execute(
      `SELECT is_favorite
       FROM user_course
       WHERE user_id = ? AND course_id = ?`,
      [userId, courseId]
    );

    if (!rows.length) return false;
    return rows[0].is_favorite === 1;
  }

  // 设置用户课程收藏状态
  static async setFavoriteStatus(userId, courseId, isFavorite) {
    // 先尝试更新，如果没有记录再插入
    const [result] = await pool.execute(
      `UPDATE user_course
       SET is_favorite = ?, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND course_id = ?`,
      [isFavorite ? 1 : 0, userId, courseId]
    );

    if (result.affectedRows === 0) {
      await pool.execute(
        `INSERT INTO user_course (user_id, course_id, is_favorite, enroll_time, created_at, updated_at)
         VALUES (?, ?, ?, NOW(), NOW(), NOW())`,
        [userId, courseId, isFavorite ? 1 : 0]
      );
    }

    return isFavorite;
  }

  // 获取课程评价（优先从课程评价表获取，如果没有则聚合视频评论）
  static async getCourseReviews(courseId, limit = 10) {
    // 先尝试从课程评价表获取
    try {
      const limitInt = Number.isFinite(Number(limit)) ? parseInt(limit, 10) : 10;
      console.log('🔎 getCourseReviews params:', { courseId, limit: limitInt });
      const [courseReviews] = await pool.execute(
        `SELECT 
          cr.review_id as comment_id,
          cr.review_content as comment_content,
          cr.rating,
          cr.created_at,
          u.user_id,
          u.user_name,
          u.avatar_url
         FROM course_review cr
         INNER JOIN user u ON cr.user_id = u.user_id
         WHERE cr.course_id = ?
         ORDER BY cr.created_at DESC
         LIMIT ${limitInt}`,
        [courseId]
      );

      if (courseReviews.length > 0) {
        return courseReviews;
      }
    } catch (err) {
      console.log('课程评价表不存在，尝试从视频评论聚合', err.message);
    }
    
    // 如果课程评价表没有数据，从视频评论聚合
    const limitInt2 = Number.isFinite(Number(limit)) ? parseInt(limit, 10) : 10;
    console.log('🔎 getCourseReviews (video fallback) params:', { courseId, limit: limitInt2 });
    const [reviews] = await pool.execute(
      `SELECT 
        vc.comment_id,
        vc.comment_content,
        vc.created_time,
        u.user_id,
        u.user_name,
        u.avatar_url
       FROM video_comment vc
       INNER JOIN course_video cv ON vc.video_id = cv.video_id
       INNER JOIN course_chapter cc ON cv.chapter_id = cc.chapter_id
       INNER JOIN user u ON vc.user_id = u.user_id
       WHERE cc.course_id = ?
       ORDER BY vc.created_time DESC
       LIMIT ${limitInt2}`,
      [courseId]
    );
    return reviews;
  }

  // 提交课程评价
  static async submitCourseReview(userId, courseId, rating, reviewContent) {
    const [result] = await pool.execute(
      `INSERT INTO course_review (user_id, course_id, rating, review_content, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [userId, courseId, rating, reviewContent]
    );
    return result.insertId;
  }

  // 获取相关课程推荐（智能推荐逻辑）
  static async getRelatedCourses(courseId, categoryId, limit = 4) {
    let courses = [];
    
    // 1. 优先推荐同分类的其他课程
      const limitInt = Number.isFinite(Number(limit)) ? parseInt(limit, 10) : 4;
      if (categoryId) {
        console.log('🔎 getRelatedCourses (same category) params:', { categoryId, courseId, limit: limitInt });
        const [sameCategoryCourses] = await pool.execute(
          `SELECT 
            c.course_id,
            c.course_name,
            c.course_desc,
            c.cover_img,
            c.difficulty_level,
            c.rating,
            u.user_name as teacher_name,
            c.student_count
           FROM course c
           LEFT JOIN user u ON c.teacher_user_id = u.user_id
           WHERE c.category_id = ? AND c.course_id != ? AND c.is_online = 1
           ORDER BY c.rating DESC, c.student_count DESC
           LIMIT ${limitInt}`,
          [categoryId, courseId]
        );
        courses = sameCategoryCourses;
      }
    
    // 2. 如果同分类课程不够，补充热门课程
    if (courses.length < limit) {
      const remainingLimit = limit - courses.length;
      const existingIds = courses.map(c => c.course_id);
      const excludeIds = [courseId, ...existingIds];
      
      const placeholders = excludeIds.map(() => '?').join(',');
      console.log('🔎 getRelatedCourses (popular) params:', { excludeIds, remainingLimit });
      const [popularCourses] = await pool.execute(
        `SELECT 
          c.course_id,
          c.course_name,
          c.course_desc,
          c.cover_img,
          c.difficulty_level,
          c.rating,
          u.user_name as teacher_name,
          c.student_count
         FROM course c
         LEFT JOIN user u ON c.teacher_user_id = u.user_id
         WHERE c.course_id NOT IN (${placeholders}) AND c.is_online = 1
         ORDER BY c.rating DESC, c.student_count DESC
         LIMIT ${remainingLimit}`,
        [...excludeIds]
      );
      
      courses = [...courses, ...popularCourses];
    }
    
    // 3. 如果还是不够，获取最新课程
    if (courses.length < limit) {
      const remainingLimit = limit - courses.length;
      const existingIds = courses.map(c => c.course_id);
      const excludeIds = [courseId, ...existingIds];
      
      const placeholders = excludeIds.map(() => '?').join(',');
      console.log('🔎 getRelatedCourses (latest) params:', { excludeIds, remainingLimit });
      const [latestCourses] = await pool.execute(
        `SELECT 
          c.course_id,
          c.course_name,
          c.course_desc,
          c.cover_img,
          c.difficulty_level,
          c.rating,
          u.user_name as teacher_name,
          c.student_count
         FROM course c
         LEFT JOIN user u ON c.teacher_user_id = u.user_id
         WHERE c.course_id NOT IN (${placeholders}) AND c.is_online = 1
         ORDER BY c.created_time DESC
         LIMIT ${remainingLimit}`,
        [...excludeIds]
      );
      
      courses = [...courses, ...latestCourses];
    }
    
    return courses.slice(0, limit);
  }
}

module.exports = Course;
