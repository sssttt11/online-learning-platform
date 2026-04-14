//学习行为趋势折现图
const { pool } = require('../config/database');

class LearningTrendModel {
  // 根据分析类型获取趋势数据
  static async getTrendDataByType(teacherId, analysisType) {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          week_number,
          completion_rate,
          interaction_rate,
          mastery_rate,
          focus_duration,
          created_date
         FROM learning_trend_analysis 
         WHERE teacher_id = ? AND analysis_type = ?
         ORDER BY week_number ASC`,
        [teacherId, analysisType]
      );
      
      return rows;
    } catch (error) {
      console.error('获取学习趋势数据失败:', error);
      throw error;
    }
  }

  // 获取教师的趋势数据概览
  static async getTrendOverview(teacherId) {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          analysis_type,
          COUNT(*) as total_weeks,
          AVG(completion_rate) as avg_completion,
          AVG(interaction_rate) as avg_interaction,
          AVG(mastery_rate) as avg_mastery,
          AVG(focus_duration) as avg_focus_duration
         FROM learning_trend_analysis 
         WHERE teacher_id = ?
         GROUP BY analysis_type`,
        [teacherId]
      );
      
      return rows;
    } catch (error) {
      console.error('获取趋势概览失败:', error);
      throw error;
    }
  }

  // 获取最新的统计指标
  static async getLatestStats(teacherId) {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          analysis_type,
          completion_rate,
          interaction_rate,
          mastery_rate,
          focus_duration
         FROM learning_trend_analysis 
         WHERE teacher_id = ? AND week_number = 6
         ORDER BY analysis_type`,
        [teacherId]
      );
      
      return rows;
    } catch (error) {
      console.error('获取最新统计失败:', error);
      throw error;
    }
  }
}

module.exports = LearningTrendModel;