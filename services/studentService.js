const { execute } = require('../config/database');

class StudentService {
  // 获取学习统计数据
  static async getLearningStats(userId) {
    // 获取课程统计
    const [enrollmentStats] = await execute(
      `SELECT 
        COUNT(DISTINCT e.course_id) as total_courses,
        COUNT(DISTINCT CASE WHEN p.completion_status = 'completed' THEN e.course_id END) as courses_completed
      FROM enrollment e
      LEFT JOIN progress p ON e.enrollment_id = p.enrollment_id
      WHERE e.user_id = ?`,
      [userId]
    );

    // 计算总学习时长（秒转小时）
    const [learningTime] = await execute(
      `SELECT 
        COALESCE(SUM(watch_duration), 0) as total_seconds
      FROM progress p
      JOIN enrollment e ON p.enrollment_id = e.enrollment_id
      WHERE e.user_id = ?`,
      [userId]
    );

    const totalHours = Math.round((learningTime[0].total_seconds / 3600) * 100) / 100;

    // 计算学习天数
    const [learningDays] = await execute(
      `SELECT COUNT(DISTINCT DATE(p.created_at)) as days
      FROM progress p
      JOIN enrollment e ON p.enrollment_id = e.enrollment_id
      WHERE e.user_id = ?
      AND p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [userId]
    );

    return {
      total_learning_hours: totalHours,
      courses_completed: enrollmentStats[0].courses_completed || 0,
      total_courses: enrollmentStats[0].total_courses || 0,
      learning_days: learningDays[0].days || 0
    };
  }

  // 获取正在学习的课程
  static async getEnrolledCourses(userId, status = null) {
    let query = `
      SELECT 
        e.enrollment_id,
        e.enrollment_date,
        c.course_id,
        c.course_name,
        c.description,
        c.cover_image,
        c.difficulty,
        c.duration,
        c.price,
        u.user_name as instructor_name,
        u.avatar_url as instructor_avatar,
        COALESCE(
          (SELECT COUNT(*) FROM progress p WHERE p.enrollment_id = e.enrollment_id) / 
          NULLIF((SELECT COUNT(*) FROM lesson l WHERE l.course_id = c.course_id), 0) * 100, 0
        ) as progress_percentage
      FROM enrollment e
      JOIN course c ON e.course_id = c.course_id
      LEFT JOIN user u ON c.instructor_id = u.user_id
      WHERE e.user_id = ?
    `;

    const params = [userId];

    if (status === 'completed') {
      query += ` AND EXISTS (
        SELECT 1 FROM progress p 
        WHERE p.enrollment_id = e.enrollment_id 
        AND p.completion_status = 'completed'
      )`;
    } else if (status === 'in_progress') {
      query += ` AND EXISTS (
        SELECT 1 FROM progress p 
        WHERE p.enrollment_id = e.enrollment_id
      )`;
    }

    query += ' ORDER BY e.enrollment_date DESC';

    const [courses] = await execute(query, params);
    return courses;
  }

  // 获取收藏的课程（如果有收藏表）
  static async getFavoriteCourses(userId) {
    try {
      const [courses] = await execute(
        `SELECT 
          c.course_id,
          c.course_name,
          c.description,
          c.cover_image,
          c.difficulty,
          c.price,
          u.user_name as instructor_name
        FROM course_favorite cf
        JOIN course c ON cf.course_id = c.course_id
        LEFT JOIN user u ON c.instructor_id = u.user_id
        WHERE cf.user_id = ?
        ORDER BY cf.created_at DESC`,
        [userId]
      );
      return courses;
    } catch (error) {
      // 如果收藏表不存在，返回空数组
      return [];
    }
  }

  // 切换收藏状态
  static async toggleFavorite(userId, courseId) {
    try {
      // 检查是否已收藏
      const [existing] = await execute(
        'SELECT * FROM course_favorite WHERE user_id = ? AND course_id = ?',
        [userId, courseId]
      );

      if (existing.length > 0) {
        // 取消收藏
        await execute(
          'DELETE FROM course_favorite WHERE user_id = ? AND course_id = ?',
          [userId, courseId]
        );
        return { action: 'removed', message: '已取消收藏' };
      } else {
        // 添加收藏
        await execute(
          'INSERT INTO course_favorite (user_id, course_id, created_at) VALUES (?, ?, NOW())',
          [userId, courseId]
        );
        return { action: 'added', message: '已添加收藏' };
      }
    } catch (error) {
      throw new Error('收藏操作失败');
    }
  }

  // 报名课程
  static async enrollCourse(userId, courseId) {
    // 检查是否已报名
    const [existing] = await execute(
      'SELECT * FROM enrollment WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );

    if (existing.length > 0) {
      throw new Error('您已经报名了该课程');
    }

    // 检查课程是否存在
    const [course] = await execute(
      'SELECT * FROM course WHERE course_id = ?',
      [courseId]
    );

    if (course.length === 0) {
      throw new Error('课程不存在');
    }

    // 创建报名记录
    const [result] = await execute(
      'INSERT INTO enrollment (user_id, course_id, enrollment_date) VALUES (?, ?, NOW())',
      [userId, courseId]
    );

    return {
      enrollment_id: result.insertId,
      message: '报名成功'
    };
  }

  // 获取成就列表（如果有成就表）
  static async getAchievements(userId) {
    try {
      const [achievements] = await execute(
        `SELECT 
          a.achievement_id,
          a.name,
          a.description,
          a.icon,
          ua.earned_at,
          ua.progress
        FROM user_achievement ua
        JOIN achievement a ON ua.achievement_id = a.achievement_id
        WHERE ua.user_id = ?
        ORDER BY ua.earned_at DESC`,
        [userId]
      );
      return achievements;
    } catch (error) {
      // 如果成就表不存在，返回空数组
      return [];
    }
  }

  // 获取推荐课程
  static async getRecommendedCourses(userId, limit = 10) {
    const [courses] = await execute(
      `SELECT 
        c.course_id,
        c.course_name,
        c.description,
        c.cover_image,
        c.difficulty,
        c.price,
        u.user_name as instructor_name
      FROM course c
      LEFT JOIN user u ON c.instructor_id = u.user_id
      WHERE c.course_id NOT IN (
        SELECT course_id FROM enrollment WHERE user_id = ?
      )
      ORDER BY c.created_at DESC
      LIMIT ?`,
      [userId, limit]
    );
    return courses;
  }
}

module.exports = StudentService;
