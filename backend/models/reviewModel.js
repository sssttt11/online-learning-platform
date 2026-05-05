const { pool } = require('../config/database');

const getCourseReviews = async (courseId, limit, offset) => {
  const [rows] = await pool.query(
    `SELECT 
       r.review_id, r.rating, r.review_content, r.created_at,
       u.user_id, u.user_name, u.avatar_url, u.occupation
     FROM course_review r
     INNER JOIN user u ON r.user_id = u.user_id
     WHERE r.course_id = ?
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`, 
    [courseId, limit, offset]
  );

  return rows;
};

const countCourseReviews = async (courseId) => {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS total FROM course_review WHERE course_id = ?',
    [courseId]
  );

  return rows[0].total;
};

const findUserCourseReview = async (userId, courseId) => {
  const [rows] = await pool.query(
    'SELECT review_id FROM course_review WHERE user_id = ? AND course_id = ?',
    [userId, courseId]
  );

  return rows;
};

const createReview = async (courseId, userId, rating, reviewContent) => {
  const [result] = await pool.query(
    'INSERT INTO course_review (course_id, user_id, rating, review_content) VALUES (?, ?, ?, ?)',
    [courseId, userId, rating, reviewContent || null]
  );

  return result.insertId;
};

const getReviewById = async (reviewId) => {
  const [rows] = await pool.query(
    `SELECT 
       r.review_id, r.rating, r.review_content, r.created_at,
       u.user_id, u.user_name, u.avatar_url, u.occupation
     FROM course_review r
     INNER JOIN user u ON r.user_id = u.user_id
     WHERE r.review_id = ?`,
    [reviewId]
  );

  return rows;
};

const updateReviewById = async (reviewId, updates) => {
  const columns = [];
  const values = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      columns.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (columns.length === 0) {
    return false;
  }

  values.push(reviewId);

  await pool.query(
    `UPDATE course_review SET ${columns.join(', ')} WHERE review_id = ?`,
    values
  );

  return true;
};

const getReviewOwnership = async (reviewId, userId) => {
  const [rows] = await pool.query(
    'SELECT review_id, course_id FROM course_review WHERE review_id = ? AND user_id = ?',
    [reviewId, userId]
  );

  return rows;
};

const deleteReviewById = async (reviewId) => {
  await pool.query('DELETE FROM course_review WHERE review_id = ?', [reviewId]);
};

const getCourseRatingStats = async (courseId) => {
  const [rows] = await pool.query(
    `SELECT AVG(rating) AS avg_rating, COUNT(*) AS count
     FROM course_review
     WHERE course_id = ?`,
    [courseId]
  );

  return rows[0];
};

module.exports = {
  getCourseReviews,
  countCourseReviews,
  findUserCourseReview,
  createReview,
  getReviewById,
  updateReviewById,
  getReviewOwnership,
  deleteReviewById,
  getCourseRatingStats
};
