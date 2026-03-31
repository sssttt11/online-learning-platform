const {
  getAllCategories: fetchAllCategories,
  getTopCategories: fetchTopCategories,
  getCategoryById,
  getSubCategories
} = require('../models/categoryModel');

// 获取所有课程分类
exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await fetchAllCategories();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// 获取顶级分类
exports.getTopCategories = async (req, res, next) => {
  try {
    const categories = await fetchTopCategories();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// 获取分类详情及子分类
exports.getCategoryDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 获取分类信息
    const categories = await getCategoryById(id);

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      });
    }

    const category = categories[0];

    // 获取子分类
    const subCategories = await getSubCategories(id);

    category.sub_categories = subCategories;

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};
