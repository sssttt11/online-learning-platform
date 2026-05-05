const pool = require('../../config/database');

class Video {
  // 获取视频详情
  static async getById(videoId) {
    try {
      console.log(`🔍 查询视频详情: videoId=${videoId}`);
      
      const [videos] = await pool.execute(
        `SELECT 
          cv.video_id,
          cv.video_title,
          cv.video_url,
          cv.video_desc,
          cv.duration_seconds,
          cv.order_index,
          cv.created_time,
          cc.chapter_id,
          cc.chapter_title,
          cc.course_id,
          c.course_name,
          u.user_name as teacher_name
         FROM course_video cv
         LEFT JOIN course_chapter cc ON cv.chapter_id = cc.chapter_id
         LEFT JOIN course c ON cc.course_id = c.course_id
         LEFT JOIN user u ON c.teacher_user_id = u.user_id
         WHERE cv.video_id = ?`,
        [videoId]
      );
      
      if (videos.length === 0) {
        console.log(`❌ 未找到视频: ${videoId}`);
        return null;
      }
      
      const video = videos[0];
      console.log(`✅ 找到视频: ${video.video_title}, URL: ${video.video_url}`);
      
      return video;
    } catch (error) {
      console.error('查询视频详情失败:', error);
      throw error;
    }
  }

  // 获取学习进度
  static async getProgress(userId, videoId) {
    try {
      console.log(`📊 查询视频进度: userId=${userId}, videoId=${videoId}`);
      
      const [progress] = await pool.execute(
        `SELECT 
          complete_rate as progress,
          current_position as currentTime
         FROM learning_detail 
         WHERE user_id = ? AND video_id = ?
         ORDER BY learn_time DESC 
         LIMIT 1`,
        [userId, videoId]
      );
      
      if (progress.length === 0) {
        console.log('📊 未找到进度记录，返回默认进度');
        return { progress: 0, currentTime: 0 };
      }
      
      return progress[0];
    } catch (error) {
      console.error('查询视频进度失败:', error);
      // 如果表不存在或其他错误，返回默认进度
      return { progress: 0, currentTime: 0 };
    }
  }

  // 更新学习进度
  static async updateProgress(userId, videoId, progress, currentTime, duration = 0) {
    try {
      console.log('🔄 更新学习进度:', {
        userId, videoId, progress, currentTime, duration
      });
      
      // 获取课程ID
      const [courseInfo] = await pool.execute(
        `SELECT cc.course_id 
         FROM course_video cv
         LEFT JOIN course_chapter cc ON cv.chapter_id = cc.chapter_id
         WHERE cv.video_id = ?`,
        [videoId]
      );

      const courseId = courseInfo[0]?.course_id;

      await pool.execute(
        `INSERT INTO learning_detail 
         (user_id, course_id, video_id, learn_duration, complete_rate, current_position, learn_time) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [userId, courseId, videoId, duration * (progress / 100), progress, currentTime]
      );
      
      console.log('✅ 进度更新成功');
    } catch (error) {
      console.error('更新学习进度失败:', error);
      throw error;
    }
  }

  // 记录学习行为（支持倍速记录）
  static async recordBehavior(userId, videoId, behaviorData) {
    const {
      behaviorType,
      currentTime = 0,
      playSpeed = 1.00,
      duration = 0,
      progress = 0,
      courseId = null
    } = behaviorData;
    
    console.log('📝 记录学习行为:', {
      userId, videoId, behaviorType, currentTime, playSpeed, courseId
    });
    
    try {
      // 1. 记录到学习行为表（user_behavior）
      let behaviorId = null;
      try {
        const [result] = await pool.execute(
          `INSERT INTO user_behavior 
           (user_id, course_id, video_id, behavior_type, current_time, play_speed, behavior_time) 
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [userId, courseId, videoId, behaviorType, currentTime, playSpeed]
        );
        
        behaviorId = result.insertId;
        console.log(`📝 学习行为已记录到user_behavior表，ID: ${behaviorId}`);
      } catch (logError) {
        console.log('⚠️ user_behavior表插入失败:', logError.message);
      }
      
      // 2. 如果是倍速变化，也更新learning_detail表的最近记录
      if (behaviorType === 'speed_change') {
        try {
          await pool.execute(
            `UPDATE learning_detail 
             SET play_speed = ?
             WHERE user_id = ? 
               AND video_id = ?
               AND DATE(learn_time) = CURDATE()
             ORDER BY learn_time DESC 
             LIMIT 1`,
            [playSpeed, userId, videoId]
          );
          
          console.log(`✅ 倍速数据已同步到learning_detail表: ${playSpeed}x`);
        } catch (updateError) {
          console.log('⚠️ 更新learning_detail表倍速失败:', updateError.message);
        }
      }
      
      // 3. 如果是播放/暂停行为，也记录到learning_detail表
      if (behaviorType === 'play' || behaviorType === 'pause' || behaviorType === 'complete') {
        try {
          // 计算学习时长（如果是complete，使用完整时长）
          const learnDuration = behaviorType === 'complete' ? duration : 10; // 假设每次记录10秒
          
          // 获取课程ID（如果未提供）
          let actualCourseId = courseId;
          if (!actualCourseId) {
            const [courseInfo] = await pool.execute(
              `SELECT cc.course_id 
               FROM course_video cv
               LEFT JOIN course_chapter cc ON cv.chapter_id = cc.chapter_id
               WHERE cv.video_id = ?`,
              [videoId]
            );
            actualCourseId = courseInfo[0]?.course_id;
          }
          
          await pool.execute(
            `INSERT INTO learning_detail 
             (user_id, course_id, video_id, learn_time, learn_duration, complete_rate, current_position) 
             VALUES (?, ?, ?, NOW(), ?, ?, ?)`,
            [userId, actualCourseId, videoId, learnDuration, progress, currentTime]
          );
          
          console.log('✅ 学习数据已更新到learning_detail表');
        } catch (detailError) {
          console.log('⚠️ 更新learning_detail表失败:', detailError.message);
        }
      }
      
      return behaviorId;
      
    } catch (error) {
      console.error('记录学习行为失败:', error);
      throw error;
    }
  }
  
  // 获取视频的倍速使用统计
  static async getSpeedStats(userId, videoId = null, courseId = null) {
    try {
      let query = `
        SELECT 
          play_speed,
          COUNT(*) as usage_count,
          SUM(learn_duration) as total_duration
        FROM learning_detail
        WHERE user_id = ? 
          AND play_speed IS NOT NULL
          AND play_speed > 0
      `;
      
      const params = [userId];
      
      if (videoId) {
        query += ' AND video_id = ?';
        params.push(videoId);
      }
      
      if (courseId) {
        query += ' AND course_id = ?';
        params.push(courseId);
      }
      
      query += ' GROUP BY play_speed ORDER BY play_speed';
      
      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      console.error('获取倍速统计失败:', error);
      return [];
    }
  }

  // 批量记录学习行为
  static async recordBehaviorsBatch(userId, videoId, behaviors) {
    if (!Array.isArray(behaviors) || behaviors.length === 0) {
      throw new Error('行为数据不能为空');
    }
    
    console.log('📝 批量记录学习行为:', {
      userId, videoId, count: behaviors.length
    });
    
    for (const behavior of behaviors) {
      try {
        const {
          behaviorType,
          currentTime = 0,
          playSpeed = 1.00,
          duration = 0,
          progress = 0,
          courseId = null
        } = behavior;
        
        await this.recordBehavior(userId, videoId, {
          behaviorType,
          currentTime,
          playSpeed,
          duration,
          progress,
          courseId
        });
      } catch (error) {
        console.error('记录单个行为失败:', error);
        // 继续处理其他行为
      }
    }
    
    console.log(`✅ 批量记录完成，共 ${behaviors.length} 条记录`);
  }

  // 获取用户视频学习统计
  static async getUserVideoStats(userId, videoId) {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          COUNT(*) as total_watches,
          SUM(learn_duration) as total_duration,
          MAX(complete_rate) as max_progress,
          AVG(play_speed) as avg_speed,
          COUNT(DISTINCT DATE(learn_time)) as learning_days
         FROM learning_detail
         WHERE user_id = ? AND video_id = ?`,
        [userId, videoId]
      );
      
      return rows[0] || {
        total_watches: 0,
        total_duration: 0,
        max_progress: 0,
        avg_speed: 1.0,
        learning_days: 0
      };
    } catch (error) {
      console.error('获取用户视频统计失败:', error);
      return {
        total_watches: 0,
        total_duration: 0,
        max_progress: 0,
        avg_speed: 1.0,
        learning_days: 0
      };
    }
  }
  
  // 获取课程ID通过视频ID
  static async getCourseIdByVideoId(videoId) {
    try {
      const [rows] = await pool.execute(
        `SELECT cc.course_id 
         FROM course_video cv
         LEFT JOIN course_chapter cc ON cv.chapter_id = cc.chapter_id
         WHERE cv.video_id = ?`,
        [videoId]
      );
      
      return rows[0]?.course_id || null;
    } catch (error) {
      console.error('获取课程ID失败:', error);
      return null;
    }
  }
}

module.exports = Video;