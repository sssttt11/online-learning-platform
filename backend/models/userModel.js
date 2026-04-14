const { execute } = require('../config/database');

class UserModel {
  // 根据用户ID查找用户
  static async findById(userId) {
    const [rows] = await execute(
      `SELECT 
        u.user_id, 
        u.user_name, 
        u.email, 
        u.avatar_url, 
        u.role, 
        u.register_time,
        u.last_login_time
      FROM user u
      WHERE u.user_id = ?`,
      [userId]
    );
    return rows[0];
  }

  // 根据邮箱查找用户
  static async findByEmail(email) {
    const [rows] = await execute(
      `SELECT 
        u.user_id, 
        u.user_name, 
        u.email, 
        u.password_hash, 
        u.avatar_url, 
        u.role, 
        u.register_time,
        u.last_login_time
      FROM user u
      WHERE u.email = ?`,
      [email]
    );
    return rows[0];
  }

  // 更新用户信息
  static async updateProfile(userId, data) {
    const fields = [];
    const values = [];

    if (data.user_name) {
      fields.push('user_name = ?');
      values.push(data.user_name);
    }
    if (data.email) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.user_intro !== undefined) {
      fields.push('user_intro = ?');
      values.push(data.user_intro);
    }
    if (data.avatar_url) {
      fields.push('avatar_url = ?');
      values.push(data.avatar_url);
    }

    if (fields.length === 0) {
      throw new Error('没有需要更新的字段');
    }

    values.push(userId);

    const [result] = await execute(
      `UPDATE user SET ${fields.join(', ')} WHERE user_id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  // 更新头像
  static async updateAvatar(userId, avatarUrl) {
    const [result] = await execute(
      'UPDATE user SET avatar_url = ? WHERE user_id = ?',
      [avatarUrl, userId]
    );
    return result.affectedRows > 0;
  }

  // 更新密码
  static async updatePassword(userId, passwordHash) {
    const [result] = await execute(
      'UPDATE user SET password_hash = ? WHERE user_id = ?',
      [passwordHash, userId]
    );
    return result.affectedRows > 0;
  }

  // 更新最后登录时间
  static async updateLastLoginTime(userId) {
    const [result] = await execute(
      'UPDATE user SET last_login_time = NOW() WHERE user_id = ?',
      [userId]
    );
    return result.affectedRows > 0;
  }

  // 检查用户名是否存在
  static async checkUserNameExists(userName, excludeUserId = null) {
    let query = 'SELECT user_id FROM user WHERE user_name = ?';
    let params = [userName];

    if (excludeUserId) {
      query += ' AND user_id != ?';
      params.push(excludeUserId);
    }

    const [rows] = await execute(query, params);
    return rows.length > 0;
  }

  // 检查邮箱是否存在
  static async checkEmailExists(email, excludeUserId = null) {
    let query = 'SELECT user_id FROM user WHERE email = ?';
    let params = [email];

    if (excludeUserId) {
      query += ' AND user_id != ?';
      params.push(excludeUserId);
    }

    const [rows] = await execute(query, params);
    return rows.length > 0;
  }

  // 根据用户名查找用户
  static async findByUserName(userName) {
    const [rows] = await execute(
      `SELECT 
        u.user_id, 
        u.user_name, 
        u.email, 
        u.password_hash, 
        u.avatar_url, 
        u.role, 
        u.register_time,
        u.last_login_time
      FROM user u
      WHERE u.user_name = ?`,
      [userName]
    );
    return rows[0];
  }

  // 根据账号查找用户（用户名或邮箱）
  static async findByAccount(account) {
    const [rows] = await execute(
      `SELECT 
        u.user_id, 
        u.user_name, 
        u.email, 
        u.password_hash, 
        u.avatar_url, 
        u.role, 
        u.is_active,
        u.register_time,
        u.last_login_time
      FROM user u
      WHERE u.user_name = ? OR u.email = ?`,
      [account, account]
    );
    return rows[0];
  }

  // 创建新用户
  static async create(userData) {
    const { user_name, password_hash, email, role = 'learner' } = userData;
    
    const [result] = await execute(
      `INSERT INTO user (user_name, password_hash, email, role, register_time) 
       VALUES (?, ?, ?, ?, NOW())`,
      [user_name, password_hash, email, role]
    );
    
    return {
      user_id: result.insertId,
      user_name,
      email,
      role
    };
  }

  // 获取用户密码哈希
  static async getPasswordHash(userId) {
    const [rows] = await execute(
      'SELECT password_hash FROM user WHERE user_id = ?',
      [userId]
    );
    return rows[0]?.password_hash;
  }
}

module.exports = UserModel;
