const { getTopTeachers } = require('../models/teacherModel');

/**
 * 获取明星讲师列表（高评分讲师）
 * GET /api/teachers/top
 * Query: limit (默认6)
 */
exports.getTopTeachers = async (req, res, next) => {
  try {
    const { limit = 6 } = req.query;
    const teachers = await getTopTeachers(limit);

    res.json({
      success: true,
      data: teachers
    });
  } catch (error) {
    next(error);
  }
};
