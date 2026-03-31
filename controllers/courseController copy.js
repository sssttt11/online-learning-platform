const {
  getCourseList: fetchCourseList,
  countCourses,
  getCourseById,
  getCourseChaptersWithVideos,
  getTeacherStats,
  getRecommendedCourses: fetchRecommendedCourses,
  getPopularCourses: fetchPopularCourses,
  getNewestCourses: fetchNewestCourses,
  getCourseCategoryId,
  getRelatedCourses: fetchRelatedCourses,
  getCourseAvailability,
  incrementEnrollment
} = require('../models/courseModel');
const {
  getEnrollment,
  createEnrollment,
  setFavoriteStatus,
  updateEnrollmentProgress,
  getUserCourses: getUserCourseList
} = require('../models/userCourseModel');

// 获取课程列表（支持筛选和分页）
exports.getCourseList = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      category_id,
      difficulty,
      keyword,
      sort = 'popular' // popular, rating, newest
    } = req.query;

    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereConditions = ['c.is_online = 1'];
    let queryParams = [];

    if (category_id) {
      whereConditions.push('c.category_id = ?');
      queryParams.push(category_id);
    }

    if (difficulty) {
      whereConditions.push('c.difficulty_level = ?');
      queryParams.push(difficulty);
    }

    if (keyword) {
      whereConditions.push('(c.course_name LIKE ? OR c.course_desc LIKE ?)');
      queryParams.push(`%${keyword}%`, `%${keyword}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    // 确定排序方式
    let orderBy = 'c.student_count DESC'; // 默认按热度
    if (sort === 'rating') {
      orderBy = 'c.rating DESC, c.rating_count DESC';
    } else if (sort === 'newest') {
      orderBy = 'c.created_at DESC';
    }

    // 查询课程列表
    const courses = await fetchCourseList({
      whereClause,
      params: queryParams,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      orderBy
    });

    const total = await countCourses(whereClause, queryParams);

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取课程详情
exports.getCourseDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 查询课程基本信息
    const courses = await getCourseById(id);

    if (courses.length === 0) {
      return res.status(404).json({
        success: false,
        message: '课程不存在或已下线'
      });
    }

    const course = courses[0];

    // 查询课程章节和视频
    const chapters = await getCourseChaptersWithVideos(id);

    // 整理章节和视频数据
    const chaptersMap = new Map();
    chapters.forEach(row => {
      if (!chaptersMap.has(row.chapter_id)) {
        chaptersMap.set(row.chapter_id, {
          chapter_id: row.chapter_id,
          chapter_title: row.chapter_title,
          order_index: row.order_index,
          videos: []
        });
      }

      if (row.video_id) {
        chaptersMap.get(row.chapter_id).videos.push({
          video_id: row.video_id,
          video_title: row.video_title,
          duration_seconds: row.duration_seconds,
          order_index: row.video_order
        });
      }
    });

    course.chapters = Array.from(chaptersMap.values());

    // 查询讲师的其他课程数量和学生总数
    const teacherStats = await getTeacherStats(course.teacher_id);

    course.teacher_stats = teacherStats[0];

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};

// 获取推荐课程
exports.getRecommendedCourses = async (req, res, next) => {
  try {
    const { limit = 6 } = req.query;

    const courses = await fetchRecommendedCourses(parseInt(limit, 10));

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

// 获取热门课程（按评分排序）
exports.getPopularCourses = async (req, res, next) => {
  try {
    const { limit = 6 } = req.query;

    const courses = await fetchPopularCourses(parseInt(limit, 10));

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

// 获取最新课程
exports.getNewestCourses = async (req, res, next) => {
  try {
    const { limit = 6 } = req.query;

    const courses = await fetchNewestCourses(parseInt(limit, 10));

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

// 获取相关课程
exports.getRelatedCourses = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 4 } = req.query;

    // 先获取当前课程的分类
    const currentCourse = await getCourseCategoryId(id);

    if (currentCourse.length === 0) {
      return res.status(404).json({
        success: false,
        message: '课程不存在'
      });
    }

    // 查询同分类的其他课程
    const courses = await fetchRelatedCourses(
      currentCourse[0].category_id,
      id,
      parseInt(limit, 10)
    );

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

// 报名课程
exports.enrollCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // 检查课程是否存在
    const courses = await getCourseAvailability(id);

    if (courses.length === 0 || !courses[0].is_online) {
      return res.status(404).json({
        success: false,
        message: '课程不存在或已下线'
      });
    }

    // 检查是否已报名
    const existing = await getEnrollment(userId, id);

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: '您已报名该课程'
      });
    }

    // 创建报名记录
    await createEnrollment(userId, id);

    // 更新课程学生数
    await incrementEnrollment(id);

    res.json({
      success: true,
      message: '报名成功'
    });
  } catch (error) {
    next(error);
  }
};

// 收藏/取消收藏课程
exports.toggleFavorite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // 检查是否已报名
    const userCourse = await getEnrollment(userId, id);

    if (userCourse.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请先报名该课程'
      });
    }

    const newFavoriteStatus = userCourse[0].is_favorite ? 0 : 1;

    await setFavoriteStatus(userId, id, newFavoriteStatus);

    res.json({
      success: true,
      message: newFavoriteStatus ? '收藏成功' : '取消收藏成功',
      data: {
        is_favorite: newFavoriteStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

// 更新学习进度
exports.updateProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;
    const userId = req.user.userId;

    if (progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        message: '进度值必须在0-100之间'
      });
    }

    // 检查是否已报名
    const userCourse = await getEnrollment(userId, id);

    if (userCourse.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请先报名该课程'
      });
    }

    await updateEnrollmentProgress(userId, id, progress);

    res.json({
      success: true,
      message: '进度更新成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取用户的课程列表
exports.getUserCourses = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { type = 'all' } = req.query; // all, learning, favorite, completed

    let whereCondition = 'uc.user_id = ?';
    const params = [userId];

    if (type === 'learning') {
      whereCondition += ' AND uc.progress > 0 AND uc.progress < 100';
    } else if (type === 'favorite') {
      whereCondition += ' AND uc.is_favorite = 1';
    } else if (type === 'completed') {
      whereCondition += ' AND uc.progress = 100';
    }

    const courses = await getUserCourseList(userId, type);

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

// 获取课程章节列表
exports.getCourseChapters = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 查询章节和视频
    const [chapters] = await pool.query(
      `SELECT 
        ch.chapter_id, ch.chapter_title, ch.order_index as chapter_order,
        v.video_id, v.video_title, v.video_url, v.duration_seconds, 
        v.order_index as video_order
       FROM course_chapter ch
       LEFT JOIN course_video v ON ch.chapter_id = v.chapter_id
       WHERE ch.course_id = ?
       ORDER BY ch.order_index ASC, v.order_index ASC`,
      [id]
    );

    // 组织数据结构
    const chaptersMap = new Map();
    chapters.forEach(row => {
      if (!chaptersMap.has(row.chapter_id)) {
        chaptersMap.set(row.chapter_id, {
          chapter_id: row.chapter_id,
          chapter_title: row.chapter_title,
          chapter_order: row.chapter_order,
          videos: []
        });
      }
      
      if (row.video_id) {
        chaptersMap.get(row.chapter_id).videos.push({
          video_id: row.video_id,
          video_title: row.video_title,
          video_url: row.video_url,
          duration_seconds: row.duration_seconds,
          video_order: row.video_order
        });
      }
    });

    const result = Array.from(chaptersMap.values());

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
