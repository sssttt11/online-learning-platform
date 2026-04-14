import { pool } from '../config/database.js';

class UserModel {
  // 根据邮箱查找用户
  static async findByEmail(email) {
    const [rows] = await pool.query(
      `SELECT 
        u.user_id, 
        u.user_name, 
        u.email, 
        u.password_hash, 
        u.avatar_url, 
        u.role, 
        u.is_active,
        u.register_time,
        u.last_login_time,
        ud.phone,
        ud.user_intro,
        ud.occupation,
        ud.learning_goal,
        ud.location,
        ud.website,
        ud.social_links
      FROM user u
      LEFT JOIN user_detail ud ON u.user_id = ud.user_id
      WHERE u.email = ?`,
      [email]
    );
    return rows[0];
  }

  // 根据用户ID查找用户
  static async findById(userId) {
    const [rows] = await pool.query(
      `SELECT 
        u.user_id, 
        u.user_name, 
        u.email, 
        u.avatar_url, 
        u.role, 
        u.is_active,
        u.register_time,
        u.last_login_time,
        ud.phone,
        ud.user_intro,
        ud.occupation,
        ud.learning_goal,
        ud.location,
        ud.website,
        ud.social_links
      FROM user u
      LEFT JOIN user_detail ud ON u.user_id = ud.user_id
      WHERE u.user_id = ?`,
      [userId]
    );
    return rows[0];
  }

  // 创建新用户
  static async create(userData) {
    const { user_name, email, password_hash, role = 'learner' } = userData;
    
    // 开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 插入主用户表
      const [userResult] = await connection.query(
        'INSERT INTO user (user_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [user_name, email, password_hash, role]
      );
      
      const userId = userResult.insertId;

      // 如果提供了用户详情信息，插入到 user_detail 表
      const { phone, user_intro, occupation, learning_goal, location, website, social_links } = userData;
      if (phone || user_intro || occupation || learning_goal || location || website || social_links) {
        await connection.query(
          `INSERT INTO user_detail 
          (user_id, phone, user_intro, occupation, learning_goal, location, website, social_links) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, phone, user_intro, occupation, learning_goal, location, website, social_links]
        );
      }

      await connection.commit();
      return userId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 更新用户信息
  static async update(userId, userData) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 更新主用户表
      const userFields = [];
      const userValues = [];
      
      const allowedUserFields = ['user_name', 'avatar_url', 'role', 'is_active'];
      allowedUserFields.forEach(field => {
        if (userData[field] !== undefined) {
          userFields.push(`${field} = ?`);
          userValues.push(userData[field]);
        }
      });

      if (userFields.length > 0) {
        userValues.push(userId);
        await connection.query(
          `UPDATE user SET ${userFields.join(', ')} WHERE user_id = ?`,
          userValues
        );
      }

      // 更新用户详情表
      const detailFields = [];
      const detailValues = [];
      
      const allowedDetailFields = ['phone', 'user_intro', 'occupation', 'learning_goal', 'location', 'website', 'social_links'];
      allowedDetailFields.forEach(field => {
        if (userData[field] !== undefined) {
          detailFields.push(`${field} = ?`);
          detailValues.push(userData[field]);
        }
      });

      if (detailFields.length > 0) {
        detailValues.push(userId);
        
        // 检查用户详情记录是否存在
        const [existingDetail] = await connection.query(
          'SELECT user_detail_id FROM user_detail WHERE user_id = ?',
          [userId]
        );

        if (existingDetail.length > 0) {
          // 更新现有记录
          await connection.query(
            `UPDATE user_detail SET ${detailFields.join(', ')} WHERE user_id = ?`,
            detailValues
          );
        } else {
          // 插入新记录
          await connection.query(
            `INSERT INTO user_detail (user_id, ${allowedDetailFields.join(', ')}) VALUES (?, ${allowedDetailFields.map(() => '?').join(', ')})`,
            [userId, ...allowedDetailFields.map(field => userData[field])]
          );
        }
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 更新最后登录时间
  static async updateLastLogin(userId) {
    await pool.query(
      'UPDATE user SET last_login_time = NOW() WHERE user_id = ?',
      [userId]
    );
  }

  // 检查邮箱是否已存在
  static async isEmailExists(email, excludeUserId = null) {
    let query = 'SELECT COUNT(*) as count FROM user WHERE email = ?';
    const params = [email];
    
    if (excludeUserId) {
      query += ' AND user_id != ?';
      params.push(excludeUserId);
    }
    
    const [rows] = await pool.query(query, params);
    return rows[0].count > 0;
  }

  // 检查手机号是否已存在
  static async isPhoneExists(phone, excludeUserId = null) {
    let query = `SELECT COUNT(*) as count FROM user_detail ud 
                JOIN user u ON ud.user_id = u.user_id 
                WHERE ud.phone = ?`;
    const params = [phone];
    
    if (excludeUserId) {
      query += ' AND u.user_id != ?';
      params.push(excludeUserId);
    }
    
    const [rows] = await pool.query(query, params);
    return rows[0].count > 0;
  }
}

export default UserModel;