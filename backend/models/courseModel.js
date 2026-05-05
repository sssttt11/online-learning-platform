const { pool } = require('../config/database');

const getCourseById = async (id) => {
  const [courses] = await pool.query(
    `SELECT 
       c.*,
       cat.category_name,
       u.user_id AS teacher_id,
       u.user_name AS teacher_name,
       u.user_intro AS teacher_intro,
       u.avatar_url AS teacher_avatar,
       u.occupation AS teacher_occupation
     FROM course c
     LEFT JOIN course_category cat ON c.category_id = cat.category_id
     LEFT JOIN user u ON c.teacher_user_id = u.user_id
     WHERE c.course_id = ? AND c.is_online = 1`,
    [id]
  );

  return courses;
};

const getCourseAvailability = async (courseId) => {
  const [rows] = await pool.query(
    'SELECT course_id, is_online FROM course WHERE course_id = ?',
    [courseId]
  );

  return rows;
};

const getCourseList = async ({ whereClause, params, limit, offset, orderBy }) => {
  const [courses] = await pool.query(
    `SELECT 
       c.course_id, c.course_name, c.course_desc, c.cover_img,
       c.difficulty_level, c.course_duration, c.student_count,
       c.rating, c.rating_count,
       cat.category_name,
       u.user_name AS teacher_name,
       u.avatar_url AS teacher_avatar
     FROM course c
     LEFT JOIN course_category cat ON c.category_id = cat.category_id
     LEFT JOIN user u ON c.teacher_user_id = u.user_id
     WHERE ${whereClause}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return courses;
};

const getCourseCategoryId = async (courseId) => {
  const [rows] = await pool.query(
    'SELECT category_id FROM course WHERE course_id = ?',
    [courseId]
  );

  return rows;
};

const countCourses = async (whereClause, params) => {
  const [countResult] = await pool.query(
    `SELECT COUNT(*) AS total FROM course c WHERE ${whereClause}`,
    params
  );

  return countResult[0].total;
};

const getCourseChaptersWithVideos = async (courseId) => {
  const [rows] = await pool.query(
    `SELECT 
       ch.chapter_id,
       ch.chapter_title,
       ch.order_index AS chapter_order,
       v.video_id,
       v.video_title,
       v.video_url,
       v.duration_seconds,
       v.order_index AS video_order
     FROM course_chapter ch
     LEFT JOIN course_video v ON ch.chapter_id = v.chapter_id
     WHERE ch.course_id = ?
     ORDER BY ch.order_index ASC, v.order_index ASC`,
    [courseId]
  );

  return rows;
};

const getTeacherStats = async (teacherId) => {
  const [rows] = await pool.query(
    `SELECT 
       COUNT(DISTINCT c.course_id) AS course_count,
       COALESCE(SUM(c.student_count), 0) AS total_students
     FROM course c
     WHERE c.teacher_user_id = ? AND c.is_online = 1`,
    [teacherId]
  );

  return rows;
};

const getRecommendedCourses = async (limit) => {
  const [courses] = await pool.query(
    `SELECT 
       c.course_id, c.course_name, c.course_desc, c.cover_img,
       c.difficulty_level, c.student_count, c.rating, c.rating_count,
       cat.category_name,
       u.user_name AS teacher_name
     FROM course c
     LEFT JOIN course_category cat ON c.category_id = cat.category_id
     LEFT JOIN user u ON c.teacher_user_id = u.user_id
     WHERE c.is_online = 1
     ORDER BY c.rating DESC, c.student_count DESC
     LIMIT ?`,
    [limit]
  );

  return courses;
};

const getPopularCourses = async (limit) => {
  const [courses] = await pool.query(
    `SELECT 
       c.course_id, c.course_name, c.course_desc, c.cover_img,
       c.difficulty_level, c.student_count, c.rating, c.rating_count,
       cat.category_name,
       u.user_name AS teacher_name
     FROM course c
     LEFT JOIN course_category cat ON c.category_id = cat.category_id
     LEFT JOIN user u ON c.teacher_user_id = u.user_id
     WHERE c.is_online = 1
     ORDER BY c.rating DESC, c.rating_count DESC
     LIMIT ?`,
    [limit]
  );

  return courses;
};

const getNewestCourses = async (limit) => {
  const [courses] = await pool.query(
    `SELECT 
       c.course_id, c.course_name, c.course_desc, c.cover_img,
       c.difficulty_level, c.student_count, c.rating, c.rating_count,
       cat.category_name,
       u.user_name AS teacher_name
     FROM course c
     LEFT JOIN course_category cat ON c.category_id = cat.category_id
     LEFT JOIN user u ON c.teacher_user_id = u.user_id
     WHERE c.is_online = 1
     ORDER BY c.created_at DESC
     LIMIT ?`,
    [limit]
  );

  return courses;
};

const getRelatedCourses = async (categoryId, courseId, limit) => {
  const [courses] = await pool.query(
    `SELECT 
       c.course_id, c.course_name, c.course_desc, c.cover_img,
       c.difficulty_level, c.student_count, c.rating, c.rating_count,
       cat.category_name,
       u.user_name AS teacher_name
     FROM course c
     LEFT JOIN course_category cat ON c.category_id = cat.category_id
     LEFT JOIN user u ON c.teacher_user_id = u.user_id
     WHERE c.category_id = ? AND c.course_id != ? AND c.is_online = 1
     ORDER BY c.rating DESC, c.student_count DESC
     LIMIT ?`,
    [categoryId, courseId, limit]
  );

  return courses;
};

const incrementEnrollment = async (courseId) => {
  await pool.query(
    'UPDATE course SET student_count = student_count + 1 WHERE course_id = ?',
    [courseId]
  );
};

const updateCourseRating = async (courseId, rating, ratingCount) => {
  await pool.query(
    'UPDATE course SET rating = ?, rating_count = ? WHERE course_id = ?',
    [rating, ratingCount, courseId]
  );
};

module.exports = {
  getCourseById,
  getCourseAvailability,
  getCourseList,
  getCourseCategoryId,
  countCourses,
  getCourseChaptersWithVideos,
  getTeacherStats,
  getRecommendedCourses,
  getPopularCourses,
  getNewestCourses,
  getRelatedCourses,
  incrementEnrollment,
  updateCourseRating
};
