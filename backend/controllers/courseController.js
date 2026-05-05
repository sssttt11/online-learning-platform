// controllers/courseController.js
const Course = require('../models/Course');
const Chapter = require('../models/Chapter');
const { successResponse, errorResponse, notFoundResponse } = require('../utils/response');

class CourseController {
  // 获取课程详情
  static async getCourse(req, res) {
    try {
      const { courseId } = req.params;
      console.log(`📚 获取课程详情: ${courseId}`);
      
      const course = await Course.getById(courseId);
      
      if (!course) {
        return res.status(404).json(notFoundResponse('课程不存在'));
      }
      
      console.log(`✅ 找到课程: ${course.course_name}`);
      
      res.json(successResponse(course));
    } catch (error) {
      console.error('获取课程详情失败:', error);
      res.status(500).json(errorResponse('服务器内部错误'));
    }
  }

  // 获取课程章节
  static async getChapters(req, res) {
    try {
      const { courseId } = req.params;
      console.log(`📖 获取课程章节: ${courseId}`);
      
      const chapters = await Chapter.getByCourseId(courseId);

      console.log(`找到 ${chapters.length} 个章节`);

      // 为每个章节获取视频
      for (let chapter of chapters) {
        const videos = await Chapter.getVideos(chapter.chapter_id);
        
        // 处理视频 URL - 转换为完整 URL
        chapter.videos = videos.map(video => {
          if (video.video_url && video.video_url.startsWith('/')) {
            video.video_url = `http://localhost:4000${video.video_url}`;
          }
          return video;
        });
        
        console.log(`章节 "${chapter.chapter_title}" 有 ${videos.length} 个视频`);
      }

      res.json(successResponse(chapters));
    } catch (error) {
      console.error('获取章节失败:', error);
      res.status(500).json(errorResponse('服务器内部错误'));
    }
  }

  // 获取所有课程
  static async getAllCourses(req, res) {
    try {
      console.log('📋 获取所有课程列表');
      
      const courses = await Course.getAll();
      
      console.log(`✅ 找到 ${courses.length} 个课程`);
      
      res.json(successResponse(courses));
    } catch (error) {
      console.error('获取课程列表失败:', error);
      res.status(500).json(errorResponse('服务器内部错误'));
    }
  }

  static async getStats(req, res) {
    try {
      const { courseId } = req.params;
      console.log(`📈 获取课程统计: courseId=${courseId}`);

      const stats = await Course.getStats(courseId);

      res.json(successResponse(stats));
    } catch (error) {
      console.error('获取课程统计失败:', error);
      res.status(500).json(errorResponse('服务器内部错误'));
    }
  }

  // 获取当前用户是否收藏该课程
  static async getFavoriteStatus(req, res) {
    try {
      const { courseId } = req.params;
      const userId = req.user.userId;

      const isFavorite = await Course.getFavoriteStatus(userId, courseId);

      res.json(successResponse({ isFavorite }));
    } catch (error) {
      console.error('获取课程收藏状态失败:', error);
      res.status(500).json(errorResponse('服务器内部错误'));
    }
  }

  // 切换或设置收藏状态
  static async toggleFavorite(req, res) {
    try {
      const { courseId } = req.params;
      const userId = req.user.userId;

      // 如果前端传了 isFavorite，则按传入值设置；否则在当前状态基础上取反
      let { isFavorite } = req.body || {};
      if (typeof isFavorite === 'undefined') {
        const current = await Course.getFavoriteStatus(userId, courseId);
        isFavorite = !current;
      }

      const finalStatus = await Course.setFavoriteStatus(userId, courseId, !!isFavorite);

      res.json(successResponse({ isFavorite: finalStatus }));
    } catch (error) {
      console.error('更新课程收藏状态失败:', error);
      res.status(500).json(errorResponse('服务器内部错误'));
    }
  }

  // 搜索课程
  static async searchCourses(req, res) {
    try {
      const { q } = req.query;
      console.log(`🔍 搜索课程: "${q}"`);

      if (!q || q.trim() === '') {
        // 如果没有搜索关键词，返回所有课程
        const courses = await Course.getAll();
        console.log(`✅ 返回所有课程: ${courses.length} 个`);
        return res.json(successResponse(courses));
      }

      const courses = await Course.search(q.trim());
      console.log(`✅ 找到 ${courses.length} 个相关课程`);

      res.json(successResponse(courses));
    } catch (error) {
      console.error('搜索课程失败:', error);
      res.status(500).json(errorResponse('服务器内部错误'));
    }
  }

  // 获取课程评价列表
  static async getCourseReviews(req, res) {
    try {
      const { courseId } = req.params;
      const limit = parseInt(req.query.limit) || 10;
      
      const reviews = await Course.getCourseReviews(courseId, limit);
      
      res.json(successResponse(reviews));
    } catch (error) {
      console.error('获取课程评价失败:', error);
      res.status(500).json(errorResponse('服务器内部错误'));
    }
  }

  // 获取相关课程推荐
  static async getRelatedCourses(req, res) {
    try {
      const { courseId } = req.params;
      const limit = parseInt(req.query.limit) || 4;
      
      console.log(`🔍 获取相关课程: courseId=${courseId}, limit=${limit}`);
      
      // 参数验证
      if (!courseId || isNaN(courseId)) {
        return res.status(400).json(errorResponse('课程ID无效'));
      }
      
      // 先获取当前课程的分类
      const course = await Course.getById(courseId);
      if (!course) {
        console.log(`❌ 课程不存在: courseId=${courseId}`);
        return res.status(404).json(notFoundResponse('课程不存在'));
      }
      
      console.log('📚 当前课程信息:', { 
        courseId, 
        categoryId: course.category_id, 
        courseName: course.course_name 
      });
      
      const relatedCourses = await Course.getRelatedCourses(courseId, course.category_id, limit);
      
      console.log(`✅ 找到 ${relatedCourses.length} 个相关课程`);
      
      // 确保返回的数据格式正确
      const formattedCourses = relatedCourses.map(course => ({
        ...course,
        rating: course.rating || 0,
        student_count: course.student_count || 0,
        teacher_name: course.teacher_name || '未知讲师'
      }));
      
      res.json(successResponse(formattedCourses));
    } catch (error) {
      console.error('获取相关课程失败:', error);
      console.error('错误堆栈:', error.stack);
      res.status(500).json(errorResponse('服务器内部错误'));
    }
  }

  // 提交课程评价
  static async submitCourseReview(req, res) {
    try {
      const { courseId } = req.params;
      const userId = req.user.userId;
      const { rating, reviewContent } = req.body;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json(errorResponse('评分必须在1-5之间'));
      }
      
      if (!reviewContent || reviewContent.trim() === '') {
        return res.status(400).json(errorResponse('评价内容不能为空'));
      }
      
      const reviewId = await Course.submitCourseReview(userId, courseId, rating, reviewContent);
      
      res.json(successResponse({ reviewId, message: '评价提交成功' }));
    } catch (error) {
      console.error('提交课程评价失败:', error);
      res.status(500).json(errorResponse('服务器内部错误'));
    }
  }
}

module.exports = CourseController;