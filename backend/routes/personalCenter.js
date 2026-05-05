const express = require('express');
const router = express.Router();
const personalCenterController = require('../controllers/personalCenterController');
const UserCourseController = require('../controllers/userCourseController');
const { authMiddleware } = require('../middleware/auth');

// 获取用户个人信息
router.get('/profile', authMiddleware, personalCenterController.getUserProfile);

// 更新用户信息
router.put('/profile', authMiddleware, personalCenterController.updateUserProfile);

// 修改密码
router.put('/password', authMiddleware, personalCenterController.changePassword);

// 获取社区数据
router.get('/community', authMiddleware, personalCenterController.getCommunityData);

// 学习库相关路由 - 保持兼容性
// 获取用户课程列表（支持status参数：all, learning, completed, favorite）
// 修改 /courses 路由
router.get('/courses', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status = 'all', page = 1, limit = 10, search = '' } = req.query;
    
    console.log(`📚 获取用户 ${userId} 的课程，状态: ${status}`);
    
    // 使用pool直接查询
    const { pool } = require('../config/database');
    
    let whereClause = 'uc.user_id = ?';
    const params = [userId];

    if (status === 'learning') {
      whereClause += ' AND uc.progress > 0 AND uc.progress < 100';
    } else if (status === 'completed') {
      whereClause += ' AND uc.progress >= 100';
    } else if (status === 'favorite') {
      whereClause += ' AND uc.is_favorite = 1';
    }

    if (search) {
      whereClause += ' AND (c.course_name LIKE ? OR c.course_desc LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const offset = (page - 1) * limit;
    
    const [courses] = await pool.execute(
      `SELECT 
        uc.*,
        c.course_name,
        c.course_desc,
        c.cover_img,
        c.difficulty_level,
        c.course_duration,
        c.rating as course_rating,
        c.student_count,
        u.user_name as teacher_name,
        u.avatar_url as teacher_avatar
       FROM user_course uc
       LEFT JOIN course c ON uc.course_id = c.course_id
       LEFT JOIN user u ON c.teacher_user_id = u.user_id
       WHERE ${whereClause}
       ORDER BY uc.updated_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // 获取总数
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total 
       FROM user_course uc
       LEFT JOIN course c ON uc.course_id = c.course_id
       WHERE ${whereClause}`,
      params
    );

    console.log(`✅ 找到 ${courses.length} 门课程`);

    res.json({
      success: true,
      data: courses,
      pagination: {
        total: countRows[0]?.total || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((countRows[0]?.total || 0) / limit)
      }
    });
  } catch (error) {
    console.error('获取用户课程列表失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: error.message 
    });
  }
});

// 获取学习统计
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    await UserCourseController.getLearningStats(req, res);
  } catch (error) {
    console.error('获取学习统计失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取收藏课程
router.get('/favorites', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log(`❤️ 获取用户 ${userId} 的收藏课程`);
    
    const { pool } = require('../config/database');
    
    // 查询收藏的课程（不需要 is_enrolled 条件）
    const query = `
      SELECT 
        uc.course_id,
        uc.is_favorite,
        uc.is_enrolled,  -- 同时返回是否已报名
        uc.enroll_time,
        uc.updated_at,
        uc.progress,
        c.course_name,
        c.course_desc,
        c.cover_img,
        c.difficulty_level,
        c.course_duration,
        c.rating,
        c.student_count,
        u.user_name as teacher_name,
        u.avatar_url as teacher_avatar
      FROM user_course uc
      INNER JOIN course c ON uc.course_id = c.course_id
      LEFT JOIN user u ON c.teacher_user_id = u.user_id
      WHERE uc.user_id = ? AND uc.is_favorite = 1
      ORDER BY uc.updated_at DESC
    `;
    
    const [courses] = await pool.execute(query, [userId]);

    console.log(`✅ 找到 ${courses.length} 门收藏课程`);
    
    res.json({
      success: true,
      data: courses,
      message: `找到 ${courses.length} 门收藏课程`
    });
  } catch (error) {
    console.error('❌ 获取收藏课程失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取收藏课程失败',
      error: error.message
    });
  }
});

// 切换收藏状态 - 修改后的版本
router.post('/favorites/:courseId/toggle', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.params;
    const { isFavorite } = req.body;
    
    console.log(`❤️ 用户 ${userId} 独立切换课程 ${courseId} 收藏状态`);
    
    const { pool } = require('../config/database');
    
    // 检查课程是否存在
    const [courseRows] = await pool.execute(
      'SELECT course_id FROM course WHERE course_id = ?',
      [courseId]
    );
    
    if (courseRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '课程不存在'
      });
    }
    
    // 检查是否已有 user_course 记录
    const [userCourseRows] = await pool.execute(
      'SELECT * FROM user_course WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );
    
    let finalStatus;
    let message;
    
    if (userCourseRows.length === 0) {
      // 用户未报名，但可以收藏
      // 创建一条只收藏的记录，is_enrolled=0
      finalStatus = true; // 默认设为收藏
      
      await pool.execute(
        `INSERT INTO user_course (user_id, course_id, is_favorite, is_enrolled, created_at, updated_at) 
         VALUES (?, ?, 1, 0, NOW(), NOW())`,
        [userId, courseId]
      );
      
      message = '已添加到收藏';
    } else {
      // 用户已有记录，切换收藏状态
      const currentFavorite = userCourseRows[0].is_favorite || 0;
      finalStatus = isFavorite !== undefined ? isFavorite : !currentFavorite;
      
      await pool.execute(
        `UPDATE user_course 
         SET is_favorite = ?, updated_at = NOW()
         WHERE user_id = ? AND course_id = ?`,
        [finalStatus ? 1 : 0, userId, courseId]
      );
      
      message = finalStatus ? '已添加到收藏' : '已取消收藏';
    }
    
    console.log(`✅ 独立收藏状态更新为: ${finalStatus ? '已收藏' : '未收藏'}`);
    
    res.json({
      success: true,
      message: message,
      data: {
        is_favorite: finalStatus,
        course_id: parseInt(courseId),
        is_enrolled: userCourseRows.length > 0 ? (userCourseRows[0].is_enrolled || 0) : 0
      }
    });
  } catch (error) {
    console.error('切换收藏失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
});

// 检查收藏状态的路由
router.get('/favorites/:courseId/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.params;
    
    const { pool } = require('../config/database');
    
    const [rows] = await pool.execute(
      'SELECT is_favorite FROM user_course WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );
    
    // 如果用户未报名，默认未收藏
    const isFavorite = rows.length > 0 ? (rows[0].is_favorite === 1) : false;
    
    res.json({
      success: true,
      data: {
        is_favorite: isFavorite,
        course_id: parseInt(courseId),
        is_enrolled: rows.length > 0  // 同时返回是否已报名
      }
    });
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 报名课程
router.post('/enroll/:courseId', authMiddleware, async (req, res) => {
  try {
    await UserCourseController.enrollCourse(req, res);
  } catch (error) {
    console.error('报名课程失败:', error);
    res.status(500).json({ success: false, message: error.message || '服务器错误' });
  }
});

// 新增：独立报名接口
router.post('/library/:courseId/enroll', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    console.log(`📝 用户 ${userId} 报名课程 ${courseId}`);

    const { pool } = require('../config/database');
    
    // 检查课程是否存在
    const [courseRows] = await pool.execute(
      'SELECT course_id FROM course WHERE course_id = ?',
      [courseId]
    );
    
    if (courseRows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '课程不存在' 
      });
    }

    // 检查是否已有记录
    const [userCourseRows] = await pool.execute(
      'SELECT * FROM user_course WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );
    
    let message;
    let isEnrolled = false;
    
    if (userCourseRows.length === 0) {
      // 创建新记录
      await pool.execute(
        `INSERT INTO user_course (user_id, course_id, is_enrolled, created_at, updated_at) 
         VALUES (?, ?, 1, NOW(), NOW())`,
        [userId, courseId]
      );
      message = '报名成功';
      isEnrolled = true;
    } else {
      // 更新现有记录
      const currentEnrolled = userCourseRows[0].is_enrolled || 0;
      if (currentEnrolled === 1) {
        message = '已报名，无需重复操作';
        isEnrolled = true;
      } else {
        await pool.execute(
          `UPDATE user_course 
           SET is_enrolled = 1, updated_at = NOW()
           WHERE user_id = ? AND course_id = ?`,
          [userId, courseId]
        );
        message = '报名成功';
        isEnrolled = true;
      }
    }

    console.log(`✅ 报名结果: ${message}, is_enrolled: ${isEnrolled}`);

    res.json({ 
      success: true, 
      message: message,
      data: {
        is_enrolled: isEnrolled,
        course_id: parseInt(courseId)
      }
    });
  } catch (error) {
    console.error('报名失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: error.message 
    });
  }
});

// 新增：独立取消报名接口
router.post('/library/:courseId/unenroll', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    console.log(`🗑️ 用户 ${userId} 取消报名课程 ${courseId}`);

    const { pool } = require('../config/database');
    
    // 检查课程是否存在
    const [courseRows] = await pool.execute(
      'SELECT course_id FROM course WHERE course_id = ?',
      [courseId]
    );
    
    if (courseRows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '课程不存在' 
      });
    }

    // 检查是否已有记录
    const [userCourseRows] = await pool.execute(
      'SELECT * FROM user_course WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );
    
    let message;
    let isEnrolled = false;
    
    if (userCourseRows.length === 0) {
      message = '用户未报名此课程';
    } else {
      const currentEnrolled = userCourseRows[0].is_enrolled || 0;
      if (currentEnrolled === 0) {
        message = '未报名，无需取消';
      } else {
        await pool.execute(
          `UPDATE user_course 
           SET is_enrolled = 0, updated_at = NOW()
           WHERE user_id = ? AND course_id = ?`,
          [userId, courseId]
        );
        message = '已取消报名';
        isEnrolled = false;
      }
    }

    console.log(`✅ 取消报名结果: ${message}, is_enrolled: ${isEnrolled}`);

    res.json({ 
      success: true, 
      message: message,
      data: {
        is_enrolled: isEnrolled,
        course_id: parseInt(courseId)
      }
    });
  } catch (error) {
    console.error('取消报名失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: error.message 
    });
  }
});

// 检查课程报名状态
router.get('/library/:courseId/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.params;
    
    console.log(`🔍 独立检查用户 ${userId} 的课程 ${courseId} 状态`);
    
    const { pool } = require('../config/database');
    
    const [rows] = await pool.execute(
      'SELECT is_enrolled, is_favorite FROM user_course WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );
    
    // 默认值
    const isEnrolled = rows.length > 0 ? (rows[0].is_enrolled || 0) : 0;
    const isFavorite = rows.length > 0 ? (rows[0].is_favorite || 0) : 0;
    
    console.log(`📊 课程 ${courseId} 状态: 报名=${isEnrolled ? '是' : '否'}, 收藏=${isFavorite ? '是' : '否'}`);
    
    res.json({
      success: true,
      data: {
        is_enrolled: isEnrolled === 1,
        is_favorite: isFavorite === 1,
        course_id: parseInt(courseId)
      }
    });
  } catch (error) {
    console.error('检查状态失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: error.message 
    });
  }
});

// 检查收藏状态
router.get('/favorites/:courseId/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.params;
    
    const { pool } = require('../config/database');
    
    const [rows] = await pool.execute(
      'SELECT is_favorite FROM user_course WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );
    
    const isFavorite = rows.length > 0 ? (rows[0].is_favorite || 0) : 0;
    
    res.json({
      success: true,
      data: {
        is_favorite: isFavorite === 1,
        course_id: parseInt(courseId)
      }
    });
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 添加/移除学习库（报名接口）- 修改后的版本
// 修改后端 /api/personal/library/:courseId/toggle 接口
router.post('/library/:courseId/toggle', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;
    const { action } = req.body; // 新增：区分操作类型
    
    console.log(`📚 用户 ${userId} 操作课程 ${courseId}, action: ${action || 'toggle'}`);

    const { pool } = require('../config/database');
    
    const [courseRows] = await pool.execute(
      'SELECT course_id FROM course WHERE course_id = ?',
      [courseId]
    );
    
    if (courseRows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '课程不存在' 
      });
    }

    // 检查用户是否已有记录
    const [userCourseRows] = await pool.execute(
      'SELECT * FROM user_course WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );
    
    let message;
    let isEnrolled = false;
    
    if (userCourseRows.length === 0) {
      // 用户未报名
      if (action === 'remove') {
        // 移除操作但未报名，无需处理
        message = '用户未报名此课程';
      } else {
        // 报名操作（或默认toggle）
        await pool.execute(
          `INSERT INTO user_course (user_id, course_id, is_enrolled, created_at, updated_at) 
           VALUES (?, ?, 1, NOW(), NOW())`,
          [userId, courseId]
        );
        message = '报名成功';
        isEnrolled = true;
      }
    } else {
      // 用户已有记录
      const currentEnrolled = userCourseRows[0].is_enrolled || 0;
      
      if (action === 'enroll') {
        // 明确报名操作
        if (currentEnrolled === 1) {
          message = '已报名，无需重复操作';
          isEnrolled = true;
        } else {
          await pool.execute(
            `UPDATE user_course 
             SET is_enrolled = 1, updated_at = NOW()
             WHERE user_id = ? AND course_id = ?`,
            [userId, courseId]
          );
          message = '报名成功';
          isEnrolled = true;
        }
      } else if (action === 'remove') {
        // 明确移除操作
        if (currentEnrolled === 0) {
          message = '未报名，无需移除';
        } else {
          await pool.execute(
            `UPDATE user_course 
             SET is_enrolled = 0, updated_at = NOW()
             WHERE user_id = ? AND course_id = ?`,
            [userId, courseId]
          );
          message = '已取消报名';
          isEnrolled = false;
        }
      } else {
        // 默认toggle逻辑
        isEnrolled = !currentEnrolled;
        await pool.execute(
          `UPDATE user_course 
           SET is_enrolled = ?, updated_at = NOW()
           WHERE user_id = ? AND course_id = ?`,
          [isEnrolled ? 1 : 0, userId, courseId]
        );
        message = isEnrolled ? '报名成功' : '已取消报名';
      }
    }

    console.log(`✅ 操作结果: ${message}, is_enrolled: ${isEnrolled}`);

    res.json({ 
      success: true, 
      message: message,
      data: {
        is_enrolled: isEnrolled,
        course_id: parseInt(courseId)
      }
    });
  } catch (error) {
    console.error('操作失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: error.message 
    });
  }
});

// 获取学习库课程列表
router.get('/library', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log(`📚 获取用户 ${userId} 的已报名课程`);
    
    const { pool } = require('../config/database');
    
    const [courses] = await pool.execute(
      `SELECT 
        uc.*,
        c.course_name,
        c.course_desc,
        c.cover_img,
        c.difficulty_level,
        c.course_duration,
        c.rating as course_rating,
        c.student_count,
        u.user_name as teacher_name,
        u.avatar_url as teacher_avatar
       FROM user_course uc
       LEFT JOIN course c ON uc.course_id = c.course_id
       LEFT JOIN user u ON c.teacher_user_id = u.user_id
       WHERE uc.user_id = ? AND uc.is_enrolled = 1  -- 只查询已报名的
       ORDER BY uc.updated_at DESC
       LIMIT 100`,
      [userId]
    );

    console.log(`✅ 找到 ${courses.length} 门已报名课程`);

    res.json({
      success: true,
      data: courses.map(course => ({
        course_id: course.course_id,
        course_name: course.course_name,
        course_desc: course.course_desc,
        cover_img: course.cover_img,
        progress: course.progress || 0,
        enroll_time: course.enroll_time,
        created_at: course.created_at,
        updated_at: course.updated_at
      }))
    });
  } catch (error) {
    console.error('获取已报名课程失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: error.message 
    });
  }
});

module.exports = router;