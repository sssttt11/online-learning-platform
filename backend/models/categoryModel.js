const { pool } = require('../config/database');

const getAllCategories = async () => {
  const [rows] = await pool.query(
    `SELECT 
       c.category_id, c.category_name, c.parent_category_id, c.category_icon, c.sort_order,
       COUNT(DISTINCT co.course_id) AS course_count
     FROM course_category c
     LEFT JOIN course co ON c.category_id = co.category_id AND co.is_online = 1
     GROUP BY c.category_id, c.category_name, c.parent_category_id, c.category_icon, c.sort_order
     ORDER BY c.sort_order, c.category_id`
  );

  return rows;
};

const getTopCategories = async () => {
  const [rows] = await pool.query(
    `SELECT 
       c.category_id, c.category_name, c.category_icon, c.sort_order,
       COUNT(DISTINCT co.course_id) AS course_count
     FROM course_category c
     LEFT JOIN course co ON c.category_id = co.category_id AND co.is_online = 1
     WHERE c.parent_category_id IS NULL
     GROUP BY c.category_id, c.category_name, c.category_icon, c.sort_order
     ORDER BY c.sort_order, c.category_id`
  );

  return rows;
};

const getCategoryById = async (categoryId) => {
  const [rows] = await pool.query(
    `SELECT 
       c.category_id, c.category_name, c.parent_category_id, c.category_icon,
       COUNT(DISTINCT co.course_id) AS course_count
     FROM course_category c
     LEFT JOIN course co ON c.category_id = co.category_id AND co.is_online = 1
     WHERE c.category_id = ?
     GROUP BY c.category_id, c.category_name, c.parent_category_id, c.category_icon`,
    [categoryId]
  );

  return rows;
};

const getSubCategories = async (categoryId) => {
  const [rows] = await pool.query(
    `SELECT 
       c.category_id, c.category_name, c.category_icon,
       COUNT(DISTINCT co.course_id) AS course_count
     FROM course_category c
     LEFT JOIN course co ON c.category_id = co.category_id AND co.is_online = 1
     WHERE c.parent_category_id = ?
     GROUP BY c.category_id, c.category_name, c.category_icon
     ORDER BY c.sort_order, c.category_id`,
    [categoryId]
  );

  return rows;
};

module.exports = {
  getAllCategories,
  getTopCategories,
  getCategoryById,
  getSubCategories
};
