import { pool } from '../config/database.js';

class AchievementModel {
  // 获取所有成就定义
  static async findAll() {
    const [rows] = await pool.query(
      `SELECT 
        achievement_id,
        name,
        description,
        icon_class,
        achievement_type,
        required_value,
        created_at
      FROM achievement
      ORDER BY achievement_type, achievement_id`
    );
    return rows;
  }

  // 获取用户已获得的成就
  static async findUserAchievements(userId) {
    const [rows] = await pool.query(
      `SELECT 
        a.achievement_id,
        a.name,
        a.description,
        a.icon_class,
        a.achievement_type,
        a.required_value,
        ua.earned_time,
        1 as is_earned
      FROM user_achievement ua
      JOIN achievement a ON ua.achievement_id = a.achievement_id
      WHERE ua.user_id = ?
      ORDER BY ua.earned_time DESC`,
      [userId]
    );
    return rows;
  }

  // 获取用户成就进度（所有成就+完成状态）
  static async getUserAchievementProgress(userId) {
    const [rows] = await pool.query(
      `SELECT 
        a.achievement_id,
        a.name,
        a.description,
        a.icon_class,
        a.achievement_type,
        a.required_value,
        ua.earned_time,
        CASE WHEN ua.user_achieve_id IS NOT NULL THEN 1 ELSE 0 END as is_earned
      FROM achievement a
      LEFT JOIN user_achievement ua ON a.achievement_id = ua.achievement_id AND ua.user_id = ?
      ORDER BY is_earned DESC, a.achievement_type, a.achievement_id`,
      [userId]
    );
    return rows;
  }

  // 检查用户是否已获得某个成就
  static async checkUserAchievement(userId, achievementId) {
    const [rows] = await pool.query(
      'SELECT user_achieve_id FROM user_achievement WHERE user_id = ? AND achievement_id = ?',
      [userId, achievementId]
    );
    return rows.length > 0;
  }

  // 授予用户成就
  static async grantAchievement(userId, achievementId) {
    try {
      const [result] = await pool.query(
        'INSERT INTO user_achievement (user_id, achievement_id) VALUES (?, ?)',
        [userId, achievementId]
      );
      return result.insertId;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('该成就已获得');
      }
      throw error;
    }
  }

  // 获取用户学习统计数据（用于成就计算）
  static async getUserLearningStats(userId) {
    const [stats] = await pool.query(
      `SELECT 
        COUNT(DISTINCT uc.course_id) as enrolled_courses_count,
        COUNT(DISTINCT ld.video_id) as learned_videos_count,
        SUM(ld.learn_duration) as total_learning_duration,
        MAX(uc.progress) as max_course_progress,
        COUNT(DISTINCT cr.review_id) as reviews_count,
        COUNT(DISTINCT vc.comment_id) as comments_count
      FROM user_course uc
      LEFT JOIN learning_detail ld ON uc.user_id = ld.user_id AND uc.course_id = ld.course_id
      LEFT JOIN course_review cr ON uc.user_id = cr.user_id AND uc.course_id = cr.course_id
      LEFT JOIN video_comment vc ON uc.user_id = vc.user_id
      WHERE uc.user_id = ?`,
      [userId]
    );

    // 计算连续学习天数
    const [continuousDays] = await pool.query(
      `SELECT COUNT(DISTINCT DATE(learn_time)) as continuous_days
      FROM learning_detail 
      WHERE user_id = ? 
      AND learn_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      [userId]
    );

    return {
      ...stats[0],
      continuous_days: continuousDays[0]?.continuous_days || 0
    };
  }

  // 自动检查并授予符合条件的成就
  static async checkAndGrantAchievements(userId) {
    const stats = await this.getUserLearningStats(userId);
    const allAchievements = await this.findAll();
    const grantedAchievements = [];

    for (const achievement of allAchievements) {
      // 检查是否已获得
      const hasAchievement = await this.checkUserAchievement(userId, achievement.achievement_id);
      if (hasAchievement) continue;

      let shouldGrant = false;

      // 根据成就类型检查条件
      switch (achievement.achievement_type) {
        case 'course':
          if (stats.enrolled_courses_count >= achievement.required_value) {
            shouldGrant = true;
          }
          break;

        case 'duration':
          if (stats.total_learning_duration >= achievement.required_value) {
            shouldGrant = true;
          }
          break;

        case 'learning':
          if (achievement.name === '视频达人') {
            if (stats.learned_videos_count >= achievement.required_value) {
              shouldGrant = true;
            }
          } else if (achievement.name === '全勤奖') {
            if (stats.continuous_days >= achievement.required_value) {
              shouldGrant = true;
            }
          }
          break;

        case 'social':
          if (achievement.name === '评价专家') {
            if (stats.reviews_count >= achievement.required_value) {
              shouldGrant = true;
            }
          } else if (achievement.name === '社区活跃者') {
            if (stats.comments_count >= achievement.required_value) {
              shouldGrant = true;
            }
          }
          break;
      }

      if (shouldGrant) {
        try {
          await this.grantAchievement(userId, achievement.achievement_id);
          grantedAchievements.push(achievement);
        } catch (error) {
          console.error(`授予成就失败: ${error.message}`);
        }
      }
    }

    return grantedAchievements;
  }

  // 获取用户成就统计
  static async getUserAchievementStats(userId) {
    const [totalCount] = await pool.query(
      'SELECT COUNT(*) as total FROM achievement'
    );
    
    const [earnedCount] = await pool.query(
      'SELECT COUNT(*) as earned FROM user_achievement WHERE user_id = ?',
      [userId]
    );

    return {
      total: totalCount[0].total,
      earned: earnedCount[0].earned,
      progress: totalCount[0].total > 0 ? (earnedCount[0].earned / totalCount[0].total * 100).toFixed(1) : 0
    };
  }
}

export default AchievementModel;