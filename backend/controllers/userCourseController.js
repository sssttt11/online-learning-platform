// controllers/userCourseController.js
const UserCourseModel = require('../models/userCourseModel');
const Course = require('../models/Course');
const { successResponse, errorResponse, notFoundResponse } = require('../utils/response');

class UserCourseController {
  // 获取用户课程列表（学习库）
  static async getUserCourses(req, res) {
    try {
      const userId = req.user.userId;
      const { 
        status = 'all',
        page = 1,
        limit = 10,
        search = ''
      } = req.query;

      const result = await UserCourseModel.getUserCourses(userId, {
        status,
        page: parseInt(page),
        limit: parseInt(limit),
        search
      });

      res.json(successResponse(result));
    } catch (error) {
      console.error('获取用户课程列表失败:', error);
      res.status(500).json(errorResponse('服务器内部错误'));
    }
  }

  // 报名课程
  static async enrollCourse(req, res) {
    try {
      const userId = req.user.userId;
      const { courseId } = req.params;

      // 检查课程是否存在
      const course = await Course.getById(courseId);
      if (!course) {
        return res.status(404).json(notFoundResponse('课程不存在'));
      }

      // 报名课程
      const enrollment = await UserCourseModel.enrollCourse(userId, courseId);

      res.json(successResponse({
        enrollment,
        message: '报名成功'
      }));
    } catch (error) {
      console.error('报名课程失败:', error);
      res.status(500).json(errorResponse('服务器内部错误'));
    }
  }

  // 取消报名（删除课程）
  static async unenrollCourse(req, res) {
    try {
      const userId = req.user.userId;
      const { courseId } = req.params;

      const result = await UserCourseModel.deleteUserCourse(userId, courseId);
      
      if (!result) {
        return res.status(404).json(notFoundResponse('课程关系不存在'));
      }

      res.json(successResponse({ message: '已取消报名' }));
    } catch (error) {
      console.error('取消报名失败:', error);
      res.status(500).json(errorResponse('服务器内部错误'));
    }
  }

  // 获取课程详情（包含用户学习进度）
    static async getCourseWithProgress(req, res) {
    try {
        const userId = req.user.userId;
        const { courseId } = req.params;

        // 获取课程详情
        const course = await Course.getById(courseId);
        if (!course) {
        return res.status(404).json({
            success: false,
            message: '课程不存在'
        });
        }

        // 获取用户学习进度
        const userCourse = await UserCourseModel.getUserCourse(userId, courseId);
        
        // 获取章节和视频信息
        // const chapters = await Course.getChapters(courseId); // 暂时注释，避免循环依赖

        // 如果是用户已报名的课程，记录访问行为
        if (userCourse) {
        await UserCourseModel.updateProgress(userId, courseId, {
            lastChapterId: null,
            lastVideoId: null
        });
        }

        res.json({
        success: true,
        data: {
            course,
            user_course: userCourse || null,
            // chapters // 暂时注释
        }
        });
    } catch (error) {
        console.error('获取课程详情失败:', error);
        res.status(500).json({ 
        success: false, 
        message: '服务器内部错误',
        error: error.message 
        });
    }
    }

    // 修改 updateProgress 方法，处理课程关系不存在的情况：
    static async updateProgress(req, res) {
    try {
        const userId = req.user.userId;
        const { courseId } = req.params;
        const {
        progress,
        lastChapterId,
        lastVideoId,
        learnDuration
        } = req.body;

        // 验证进度值
        if (progress !== undefined && (progress < 0 || progress > 100)) {
        return res.status(400).json({ 
            success: false, 
            message: '进度值必须在0-100之间' 
        });
        }

        // 先检查用户是否报名了课程
        const userCourse = await UserCourseModel.getUserCourse(userId, courseId);
        if (!userCourse) {
        // 如果课程关系不存在，先自动报名
        await UserCourseModel.enrollCourse(userId, courseId);
        }

        const result = await UserCourseModel.updateProgress(userId, courseId, {
        progress,
        lastChapterId,
        lastVideoId,
        learnDuration
        });

        if (!result) {
        return res.status(404).json({ 
            success: false, 
            message: '更新失败' 
        });
        }

        res.json({ 
        success: true, 
        message: '进度更新成功' 
        });
    } catch (error) {
        console.error('更新学习进度失败:', error);
        res.status(500).json({ 
        success: false, 
        message: '服务器内部错误' 
        });
    }
    }

  // 切换收藏状态
  static async toggleFavorite(req, res) {
    try {
      const userId = req.user.userId;
      const { courseId } = req.params;
      const { isFavorite } = req.body;

      const result = await UserCourseModel.toggleFavorite(userId, courseId, isFavorite);

      res.json(successResponse({
        is_favorite: result,
        message: result ? '已添加到收藏' : '已取消收藏'
      }));
    } catch (error) {
      console.error('切换收藏状态失败:', error);
      res.status(500).json(errorResponse('服务器内部错误'));
    }
  }

  // 获取用户收藏列表
  static async getFavorites(req, res) {
    try {
      const userId = req.user.userId;
      const { 
        page = 1,
        limit = 10,
        search = ''
      } = req.query;

      const result = await UserCourseModel.getUserFavorites(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        search
      });

      res.json(successResponse(result));
    } catch (error) {
      console.error('获取收藏列表失败:', error);
      res.status(500).json(errorResponse('服务器内部错误'));
    }
  }

  // 获取用户学习统计
  static async getLearningStats(req, res) {
    try {
      const userId = req.user.userId;

      const stats = await UserCourseModel.getUserLearningStats(userId);

      // 适配前端期望的字段名
      const raw = stats || {};
      const mapped = {
        total_learning_hours: raw.total_learn_duration ? Number((raw.total_learn_duration / 60).toFixed(1)) : 0,
        enrolled_courses: raw.total_courses || 0,
        courses_completed: raw.completed_courses || 0,
        continuous_days: raw.continuous_days || 0,
        achievement_rate: raw.avg_progress ? Math.round(raw.avg_progress) : 0,
        // 保留原始数据以供前端使用
        _raw: raw
      };

      res.json({ success: true, data: mapped });
    } catch (error) {
      console.error('获取学习统计失败:', error);
      res.status(500).json(errorResponse('服务器内部错误'));
    }
  }

  // 批量更新进度（用于同步多个课程的进度）
  static async batchUpdateProgress(req, res) {
    try {
      const userId = req.user.userId;
      const { updates } = req.body;

      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json(errorResponse('更新数据不能为空'));
      }

      // 验证数据
      for (const update of updates) {
        if (!update.courseId) {
          return res.status(400).json(errorResponse('每个更新项必须包含courseId'));
        }
        if (update.progress !== undefined && (update.progress < 0 || update.progress > 100)) {
          return res.status(400).json(errorResponse('进度值必须在0-100之间'));
        }
      }

      await UserCourseModel.batchUpdateProgress(userId, updates);

      res.json(successResponse({ message: '批量更新成功' }));
    } catch (error) {
      console.error('批量更新进度失败:', error);
      res.status(500).json(errorResponse('服务器内部错误'));
    }
  }

  // 获取最近学习的课程
  static async getRecentCourses(req, res) {
    try {
      const userId = req.user.userId;
      const { limit = 5 } = req.query;

      const [recentCourses] = await pool.execute(
        `SELECT 
          uc.course_id,
          c.course_name,
          c.cover_img,
          uc.progress,
          uc.last_learn_time,
          c.teacher_user_id,
          u.user_name as teacher_name
         FROM user_course uc
         LEFT JOIN course c ON uc.course_id = c.course_id
         LEFT JOIN user u ON c.teacher_user_id = u.user_id
         WHERE uc.user_id = ? AND uc.last_learn_time IS NOT NULL
         ORDER BY uc.last_learn_time DESC
         LIMIT ?`,
        [userId, parseInt(limit)]
      );

      res.json(successResponse(recentCourses));
    } catch (error) {
      console.error('获取最近学习课程失败:', error);
      res.status(500).json(errorResponse('服务器内部错误'));
    }
  }

  // 检查用户是否已报名课程
  static async checkEnrollment(req, res) {
    try {
      const userId = req.user.userId;
      const { courseId } = req.params;

      const userCourse = await UserCourseModel.getUserCourse(userId, courseId);

      res.json(successResponse({
        is_enrolled: !!userCourse,
        user_course: userCourse || null
      }));
    } catch (error) {
      console.error('检查报名状态失败:', error);
      res.status(500).json(errorResponse('服务器内部错误'));
    }
  }
}

module.exports = UserCourseController;