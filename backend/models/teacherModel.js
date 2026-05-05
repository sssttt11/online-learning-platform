const { pool } = require('../config/database');

const getTopTeachers = async (limit) => {
  const [teachers] = await pool.query(
    `SELECT 
       u.user_id,
       u.user_name,
       u.avatar_url AS avatar,
       ud.user_intro AS bio,
       ud.occupation,
       COUNT(DISTINCT c.course_id) AS course_count,
       ROUND(AVG(c.rating), 1) AS avg_rating,
       SUM(c.student_count) AS student_count,
       SUM(c.rating_count) AS total_reviews
     FROM user u
     LEFT JOIN user_detail ud ON u.user_id = ud.user_id
     INNER JOIN course c ON u.user_id = c.teacher_user_id
     WHERE u.role = 'instructor' AND c.is_online = 1
     GROUP BY u.user_id, u.user_name, u.avatar_url, ud.user_intro, ud.occupation
     HAVING avg_rating >= 4.0
     ORDER BY avg_rating DESC, student_count DESC
     LIMIT ?`,
    [parseInt(limit, 10)]
  );

  return teachers;
};

module.exports = {
  getTopTeachers
};
