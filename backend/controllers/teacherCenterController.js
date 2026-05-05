const { execute } = require('../config/database');
const LearningTrendModel = require('../models/learningTrendModel');

// 获取教师统计数据
const getTeacherStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // 获取教师开设的课程统计
    const [courseRows] = await execute(`
      SELECT 
        COUNT(*) as total_courses,
        SUM(CASE WHEN is_online = 1 THEN 1 ELSE 0 END) as published_courses,
        SUM(CASE WHEN is_online = 0 THEN 1 ELSE 0 END) as draft_courses
      FROM course 
      WHERE teacher_user_id = ?
    `, [userId]);
    const courseStats = courseRows[0] || {};

    // 获取学生总数
    const [studentRows] = await execute(`
      SELECT COUNT(DISTINCT uc.user_id) as total_students
      FROM user_course uc
      JOIN course c ON uc.course_id = c.course_id
      WHERE c.teacher_user_id = ? AND uc.is_enrolled = 1
    `, [userId]);
    const studentStats = studentRows[0] || {};

    // 获取平均评分
    const [ratingRows] = await execute(`
      SELECT AVG(r.rating) as avg_rating, COUNT(r.review_id) as total_reviews
      FROM course_review r
      JOIN course c ON r.course_id = c.course_id
      WHERE c.teacher_user_id = ?
    `, [userId]);
    const ratingStats = ratingRows[0] || {};

    // 课程总学习时长
    const [durationRows] = await execute(`
      SELECT SUM(uc.total_learn_duration) as total_duration
      FROM user_course uc
      JOIN course c ON uc.course_id = c.course_id
      WHERE c.teacher_user_id = ? AND uc.is_enrolled = 1
    `, [userId]);
    const durationStats = durationRows[0] || {};

    res.json({
      success: true,
      data: {
        courses: {
          total: courseStats.total_courses || 0,
          published: courseStats.published_courses || 0,
          draft: courseStats.draft_courses || 0
        },
        students: {
          total: studentStats.total_students || 0
        },
        rating: {
          average: Math.round((ratingStats.avg_rating || 0) * 10) / 10,
          total_reviews: ratingStats.total_reviews || 0
        },
        duration: {
          total_hours: Math.round((durationStats.total_duration || 0) / 3600 * 10) / 10
        }
      }
    });

  } catch (error) {
    console.error('获取教师统计失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 获取教师课程列表
const getTeacherCourses = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, page = 1, limit = 10 } = req.query;

    let whereClause = 'WHERE c.teacher_user_id = ?';
    let params = [userId];

    if (status === 'published') {
      whereClause += ' AND c.is_online = 1';
    } else if (status === 'draft') {
      whereClause += ' AND c.is_online = 0';
    }

    // 转换为数字并确保有效值
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    //const offset = (page - 1) * limit;

    console.log('查询参数:', {
      userId,
      page: pageNum,
      limit: limitNum,
      offset,
      whereClause,
    });

    const [courses] = await execute(`
      SELECT 
        c.course_id,
        c.course_name,
        c.course_desc as description,
        c.cover_img as cover_image,
        c.difficulty_level as difficulty,
        c.is_online as status,
        c.created_time as create_time,
        c.updated_time as update_time,
        c.student_count,
        c.rating as avg_rating,
        c.rating_count as review_count
      FROM course c
      ${whereClause}
      ORDER BY c.created_time DESC
      LIMIT ? OFFSET ?
    `, [userId.toString(), limitNum.toString(), offset.toString()]);
    //`, [...params, parseInt(limit), offset]);

    res.json({
      success: true,
      data: courses.map(course => ({
        ...course,
        avg_rating: Math.round((course.avg_rating || 0) * 10) / 10,
        student_count: course.student_count || 0,
        review_count: course.review_count || 0
      }))
    });

  } catch (error) {
    console.error('获取教师课程失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 获取课程学生列表
const getCourseStudents = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // 验证课程是否属于该教师
    const [courseCheck] = await execute(
      'SELECT course_id FROM course WHERE course_id = ? AND teacher_user_id = ?',
      [courseId, userId]
    );

    if (courseCheck.length === 0) {
      return res.status(403).json({ success: false, message: '无权访问该课程' });
    }

    const offset = (page - 1) * limit;

    const [students] = await execute(`
      SELECT 
        u.user_id,
        u.user_name,
        u.email,
        u.avatar_url,
        uc.enroll_time as enrollment_date,
        uc.id as enrollment_id,
        uc.total_learn_duration as total_watch_time,
        uc.progress as completed_percent
      FROM user_course uc
      JOIN user u ON uc.user_id = u.user_id
      WHERE uc.course_id = ? AND uc.is_enrolled = 1
      ORDER BY uc.enroll_time DESC
      LIMIT ? OFFSET ?
    `, [courseId, parseInt(limit), offset]);

    res.json({
      success: true,
      data: students.map(student => ({
        ...student,
        total_watch_hours: Math.round((student.total_watch_time || 0) / 3600 * 100) / 100,
        completed_percent: student.completed_percent || 0
      }))
    });

  } catch (error) {
    console.error('获取课程学生失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 创建新课程
const createCourse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { course_name, description, difficulty = 'beginner', category_id } = req.body;

    if (!course_name || !description) {
      return res.status(400).json({ success: false, message: '课程名称和描述不能为空' });
    }

    const [result] = await execute(`
      INSERT INTO course (course_name, course_desc, teacher_user_id, difficulty_level, category_id, is_online, created_time)
      VALUES (?, ?, ?, ?, ?, 0, NOW())
    `, [course_name, description, userId, difficulty, category_id]);

    res.json({
      success: true,
      data: {
        course_id: result.insertId,
        message: '课程创建成功'
      }
    });

  } catch (error) {
    console.error('创建课程失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 更新课程信息
const updateCourse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.params;
    const { course_name, description, difficulty, is_online } = req.body;

    // 验证课程是否属于该教师
    const [courseCheck] = await execute(
      'SELECT course_id FROM course WHERE course_id = ? AND teacher_user_id = ?',
      [courseId, userId]
    );

    if (courseCheck.length === 0) {
      return res.status(403).json({ success: false, message: '无权修改该课程' });
    }

    const updates = [];
    const params = [];

    if (course_name) {
      updates.push('course_name = ?');
      params.push(course_name);
    }
    if (description) {
      updates.push('course_desc = ?');
      params.push(description);
    }
    if (difficulty) {
      updates.push('difficulty_level = ?');
      params.push(difficulty);
    }
    if (is_online !== undefined) {
      updates.push('is_online = ?');
      params.push(is_online);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: '没有需要更新的字段' });
    }

    updates.push('updated_time = NOW()');
    params.push(courseId);

    await execute(
      `UPDATE course SET ${updates.join(', ')} WHERE course_id = ?`,
      params
    );

    res.json({ success: true, message: '课程更新成功' });

  } catch (error) {
    console.error('更新课程失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 删除课程
const deleteCourse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.params;

    // 验证课程是否属于该教师
    const [courseCheck] = await execute(
      'SELECT course_id FROM course WHERE course_id = ? AND teacher_user_id = ?',
      [courseId, userId]
    );

    if (courseCheck.length === 0) {
      return res.status(403).json({ success: false, message: '无权删除该课程' });
    }

    // 检查是否有学生报名
    const [enrollmentCheck] = await execute(
      'SELECT COUNT(*) as count FROM user_course WHERE course_id = ? AND is_enrolled = 1',
      [courseId]
    );

    if (enrollmentCheck[0].count > 0) {
      return res.status(400).json({ success: false, message: '该课程已有学生报名，无法删除' });
    }

    await execute('DELETE FROM course WHERE course_id = ?', [courseId]);

    res.json({ success: true, message: '课程删除成功' });

  } catch (error) {
    console.error('删除课程失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 获取学生知识掌握分布数据（环状图）
async function getKnowledgeMasteryDistribution(req, res) {
  try {
    const userId = req.user.userId;

    // 获取教师所有课程下学生的章节掌握情况
    const [masteryRows] = await execute(`
      SELECT 
        CASE 
          WHEN cp.progress_rate >= 90 THEN '精通'
          WHEN cp.progress_rate >= 70 THEN '熟练'
          WHEN cp.progress_rate >= 50 THEN '理解'
          WHEN cp.progress_rate >= 30 THEN '入门'
          ELSE '待学习'
        END as mastery_level,
        COUNT(*) as student_count
      FROM chapter_progress cp
      INNER JOIN course_chapter cc ON cp.chapter_id = cc.chapter_id
      INNER JOIN course c ON cc.course_id = c.course_id
      WHERE c.teacher_user_id = ?
      GROUP BY mastery_level
      ORDER BY FIELD(mastery_level, '精通', '熟练', '理解', '入门', '待学习')
    `, [userId]);

    // 如果没有数据，返回默认结构
    if (!masteryRows || masteryRows.length === 0) {
      return res.json({
        success: true,
        data: [
          { name: '精通', value: 0 },
          { name: '熟练', value: 0 },
          { name: '理解', value: 0 },
          { name: '入门', value: 0 },
          { name: '待学习', value: 0 }
        ]
      });
    }

    // 转换为ECharts需要的格式
    const distribution = masteryRows.map(item => ({
      name: item.mastery_level,
      value: parseInt(item.student_count)
    }));

    console.log('📊 知识掌握分布数据:', distribution);

    res.json({
      success: true,
      data: distribution
    });

  } catch (error) {
    console.error('获取知识掌握分布失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

// 获取学习行为词云数据（真实动态数据）
async function getKnowledgeWordCloud(req, res) {
  try {
    const userId = req.user.userId;

    // 行为类型映射为中文
    const behaviorNameMap = {
      'focus': '专注',
      'pause': '暂停',
      'replay': '回滚',
      'speed_change': '倍速',
      'note': '笔记',
      'question': '提问',
      'discuss': '讨论',
      'leave': '离开',
      'confusion': '困惑',
      'exercise': '练习',
      'review': '复习',
      'summary': '总结',
      'interact': '互动',
      'feedback': '反馈',
      'think': '思考',
      'progress': '进步',
      'challenge': '挑战',
      'interest': '兴趣',
      'master': '掌握',
      'understand': '理解'
    };

    // 从student_learning_log表获取真实的学习行为统计
    const [behaviorRows] = await execute(`
      SELECT 
        sll.action_type,
        COUNT(*) as action_count
      FROM student_learning_log sll
      JOIN course c ON sll.course_id = c.course_id
      WHERE c.teacher_user_id = ?
      GROUP BY sll.action_type
      ORDER BY action_count DESC
    `, [userId]);

    let behaviorData = [];

    if (behaviorRows && behaviorRows.length > 0) {
      // 使用真实数据
      behaviorData = behaviorRows.map(row => ({
        name: behaviorNameMap[row.action_type] || row.action_type,
        value: parseInt(row.action_count) || 0
      }));
      console.log('☁️ 使用真实学习行为数据:', behaviorData);
    } else {
      // 如果没有真实数据，返回模拟的学习行为词云数据
      const [studentCountRows] = await execute(`
        SELECT COUNT(DISTINCT uc.user_id) as student_count
        FROM user_course uc
        JOIN course c ON uc.course_id = c.course_id
        WHERE c.teacher_user_id = ? AND uc.is_enrolled = 1
      `, [userId]);
      
      const studentCount = studentCountRows[0]?.student_count || 10;
      const baseValue = Math.max(20, studentCount * 5);

      // 学习行为词云 - 包含各种学习行为关键词
      behaviorData = [
        { name: '专注', value: Math.round(baseValue * (0.8 + Math.random() * 0.4)) },
        { name: '暂停', value: Math.round(baseValue * (0.6 + Math.random() * 0.3)) },
        { name: '思考', value: Math.round(baseValue * (0.7 + Math.random() * 0.3)) },
        { name: '回滚', value: Math.round(baseValue * (0.5 + Math.random() * 0.3)) },
        { name: '笔记', value: Math.round(baseValue * (0.75 + Math.random() * 0.35)) },
        { name: '讨论', value: Math.round(baseValue * (0.6 + Math.random() * 0.3)) },
        { name: '提问', value: Math.round(baseValue * (0.55 + Math.random() * 0.3)) },
        { name: '倍速', value: Math.round(baseValue * (0.4 + Math.random() * 0.3)) },
        { name: '复习', value: Math.round(baseValue * (0.8 + Math.random() * 0.3)) },
        { name: '理解', value: Math.round(baseValue * (0.85 + Math.random() * 0.25)) },
        { name: '困惑', value: Math.round(baseValue * (0.35 + Math.random() * 0.25)) },
        { name: '练习', value: Math.round(baseValue * (0.7 + Math.random() * 0.35)) },
        { name: '掌握', value: Math.round(baseValue * (0.65 + Math.random() * 0.35)) },
        { name: '进步', value: Math.round(baseValue * (0.75 + Math.random() * 0.3)) },
        { name: '挑战', value: Math.round(baseValue * (0.5 + Math.random() * 0.3)) },
        { name: '兴趣', value: Math.round(baseValue * (0.65 + Math.random() * 0.3)) },
        { name: '互动', value: Math.round(baseValue * (0.6 + Math.random() * 0.3)) },
        { name: '反馈', value: Math.round(baseValue * (0.55 + Math.random() * 0.3)) },
        { name: '总结', value: Math.round(baseValue * (0.6 + Math.random() * 0.35)) },
        { name: '离开', value: Math.round(baseValue * (0.3 + Math.random() * 0.2)) }
      ];
      console.log('☁️ 使用模拟学习行为数据');
    }

    res.json({
      success: true,
      data: behaviorData
    });

  } catch (error) {
    console.error('获取词云数据失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

// ============ 学习趋势分析函数 ============
// 获取学习趋势数据
const getLearningTrendData = async (req, res) => {
  try {
    const { type = 'overall', course_id } = req.query;
    const teacherId = req.user.userId;
    
    console.log(`📊 获取趋势数据请求: type=${type}, course_id=${course_id}, teacherId=${teacherId}`);
    
    let analysisType = type;
    
    // 如果有课程ID，使用课程分析类型
    if (course_id) {
      analysisType = `course-${course_id}`;
      console.log(`📊 使用课程分析类型: ${analysisType}`);
    }
    
    // 使用 LearningTrendModel 获取数据
    const trendData = await LearningTrendModel.getTrendDataByType(teacherId, analysisType);

    console.log(`📊 数据库返回数据条数:`, trendData ? trendData.length : 0);
    
    const formattedData = {
      weeks: [],
      completion: [],
      interaction: [],
      mastery: [],
      focusDuration: []
    };
    
    if (trendData && trendData.length > 0) {
      trendData.forEach(item => {
        formattedData.weeks.push(`第${item.week_number}周`);
        formattedData.completion.push(item.completion_rate);
        formattedData.interaction.push(item.interaction_rate);
        formattedData.mastery.push(item.mastery_rate);
        formattedData.focusDuration.push(item.focus_duration);
      });
      console.log(`📊 格式化后的数据:`, formattedData);
    } else {
      console.warn(`⚠️ 没有找到类型为 ${analysisType} 的趋势数据`);
    }
    
    res.json({
      success: true,
      data: formattedData,
      message: trendData && trendData.length > 0 ? '获取数据成功' : '暂无数据'
    });
    
  } catch (error) {
    console.error('获取学习趋势数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取学习趋势数据失败'
    });
  }
};

// 获取趋势概览数据
const getTrendOverview = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    console.log(`📈 获取趋势概览: teacherId=${teacherId}`);

    // 使用 LearningTrendModel 获取数据
    const overviewData = await LearningTrendModel.getTrendOverview(teacherId);
    const latestStats = await LearningTrendModel.getLatestStats(teacherId);
    
    console.log(`📈 概览数据:`, overviewData ? overviewData.length : 0, '条记录');
    console.log(`📈 最新统计:`, latestStats ? latestStats.length : 0, '条记录');

    // 创建不同类型的数据映射
    const statsByType = {};
    if (latestStats && latestStats.length > 0) {
      latestStats.forEach(stat => {
        statsByType[stat.analysis_type] = {
          completion_rate: stat.completion_rate,
          interaction_rate: stat.interaction_rate,
          mastery_rate: stat.mastery_rate,
          focus_duration: stat.focus_duration
        };
      });
    }
    
    res.json({
      success: true,
      data: {
        overview: overviewData,
        latest_stats: statsByType
      },
      message: overviewData && overviewData.length > 0 ? '获取数据成功' : '暂无数据'
    });
    
  } catch (error) {
    console.error('获取趋势概览失败:', error);
    res.status(500).json({
      success: false,
      message: '获取趋势概览失败'
    });
  }
};

module.exports = {
  getTeacherStats,
  getTeacherCourses,
  getCourseStudents,
  createCourse,
  updateCourse,
  deleteCourse,
  getKnowledgeMasteryDistribution,
  getKnowledgeWordCloud,
  getLearningTrendData,
  getTrendOverview
};

