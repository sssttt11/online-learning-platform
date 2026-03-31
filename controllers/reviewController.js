const { pool } = require('../config/database');

// 获取课程评价列表
exports.getCourseReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // 查询评价列表
    const [reviews] = await pool.query(
      `SELECT 
        r.review_id, r.rating, r.review_content, r.created_at,
        u.user_id, u.user_name, u.avatar_url, u.occupation
       FROM course_review r
       INNER JOIN user u ON r.user_id = u.user_id
       WHERE r.course_id = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [id, parseInt(limit), parseInt(offset)]
    );

    // 查询评价总数
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM course_review WHERE course_id = ?',
      [id]
    );

    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        reviews,
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

// 添加课程评价
exports.addReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, review_content } = req.body;
    const userId = req.user.userId;

    // 验证评分
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: '评分必须在1-5之间'
      });
    }

    // 检查是否已报名课程
    const [userCourse] = await pool.query(
      'SELECT id FROM user_course WHERE user_id = ? AND course_id = ?',
      [userId, id]
    );

    if (userCourse.length === 0) {
      return res.status(400).json({
        success: false,
        message: '只有报名的学生才能评价课程'
      });
    }

    // 检查是否已评价
    const [existing] = await pool.query(
      'SELECT review_id FROM course_review WHERE user_id = ? AND course_id = ?',
      [userId, id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: '您已评价过该课程'
      });
    }

    // 插入评价
    const [result] = await pool.query(
      'INSERT INTO course_review (course_id, user_id, rating, review_content) VALUES (?, ?, ?, ?)',
      [id, userId, rating, review_content || null]
    );

    // 更新课程评分
    const [stats] = await pool.query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as count 
       FROM course_review 
       WHERE course_id = ?`,
      [id]
    );

    await pool.query(
      'UPDATE course SET rating = ?, rating_count = ? WHERE course_id = ?',
      [parseFloat(stats[0].avg_rating).toFixed(1), stats[0].count, id]
    );

    // 获取新添加的评价
    const [newReview] = await pool.query(
      `SELECT 
        r.review_id, r.rating, r.review_content, r.created_at,
        u.user_id, u.user_name, u.avatar_url, u.occupation
       FROM course_review r
       INNER JOIN user u ON r.user_id = u.user_id
       WHERE r.review_id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: '评价成功',
      data: newReview[0]
    });
  } catch (error) {
    next(error);
  }
};

// 更新评价
exports.updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { rating, review_content } = req.body;
    const userId = req.user.userId;

    // 检查评价是否存在且属于当前用户
    const [reviews] = await pool.query(
      'SELECT review_id, course_id FROM course_review WHERE review_id = ? AND user_id = ?',
      [reviewId, userId]
    );

    if (reviews.length === 0) {
      return res.status(404).json({
        success: false,
        message: '评价不存在或无权修改'
      });
    }

    const courseId = reviews[0].course_id;

    // 更新评价
    const updates = [];
    const values = [];

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: '评分必须在1-5之间'
        });
      }
      updates.push('rating = ?');
      values.push(rating);
    }

    if (review_content !== undefined) {
      updates.push('review_content = ?');
      values.push(review_content);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有要更新的字段'
      });
    }

    values.push(reviewId);

    await pool.query(
      `UPDATE course_review SET ${updates.join(', ')} WHERE review_id = ?`,
      values
    );

    // 重新计算课程评分
    const [stats] = await pool.query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as count 
       FROM course_review 
       WHERE course_id = ?`,
      [courseId]
    );

    await pool.query(
      'UPDATE course SET rating = ?, rating_count = ? WHERE course_id = ?',
      [parseFloat(stats[0].avg_rating).toFixed(1), stats[0].count, courseId]
    );

    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    next(error);
  }
};

// 删除评价
exports.deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.userId;

    // 检查评价是否存在且属于当前用户
    const [reviews] = await pool.query(
      'SELECT review_id, course_id FROM course_review WHERE review_id = ? AND user_id = ?',
      [reviewId, userId]
    );

    if (reviews.length === 0) {
      return res.status(404).json({
        success: false,
        message: '评价不存在或无权删除'
      });
    }

    const courseId = reviews[0].course_id;

    // 删除评价
    await pool.query('DELETE FROM course_review WHERE review_id = ?', [reviewId]);

    // 重新计算课程评分
    const [stats] = await pool.query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as count 
       FROM course_review 
       WHERE course_id = ?`,
      [courseId]
    );

    const avgRating = stats[0].count > 0 ? parseFloat(stats[0].avg_rating).toFixed(1) : 0;

    await pool.query(
      'UPDATE course SET rating = ?, rating_count = ? WHERE course_id = ?',
      [avgRating, stats[0].count, courseId]
    );

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    next(error);
  }
};
