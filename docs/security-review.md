1. backend/config/database.js
修复点：引入 dotenv，强制所有敏感配置从环境变量中读取，移除硬编码密码。
// backend/config/database.js
const mysql = require('mysql2/promise');
require('dotenv').config(); // 确保加载环境变量

// 移除硬编码，全部改用环境变量
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',       
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD, // 强制通过 .env 提供，无默认值
  database: process.env.DB_NAME || 'mzcourse',
  charset: 'utf8mb4',
  connectionLimit: 10,
};

const pool = mysql.createPool(dbConfig);

// 测试数据库连接
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功');
    connection.release();

    // 测试查询
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM user'); // 建议改为user表测试
    console.log(`📊 数据库测试连接正常`);
  } catch (err) {
    console.error('❌ 数据库连接失败:', err.message);
    throw err;
  }
};

// 封装execute函数
const execute = async (sql, params = []) => {
  try {
    return await pool.execute(sql, params);
  } catch (error) {
    console.error('数据库查询错误:', error);
    throw error;
  }
};

module.exports = {
  pool,
  testConnection,
  execute
};

2. backend/middleware/auth.js
修复点：移除 JWT Secret 的硬编码回退值；在 500 错误时删除 error.message 以防内部信息泄露。
// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    console.log('\n=== 🔐 AUTH MIDDLEWARE START ===');
    console.log('请求路径:', req.path);
    
    // 从请求头获取token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ 无效的Authorization头');
      return res.status(401).json({
        success: false,
        message: '未提供有效的认证token'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // 【修复】：强制使用环境变量，无 fallback 默认值
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('❌ 服务器未配置 JWT_SECRET 环境变量');
      return res.status(500).json({
        success: false,
        message: '服务器配置错误' // 统一错误提示
      });
    }

    const decoded = jwt.verify(token, secret);
    
    // 从数据库中验证用户存在
    const { pool } = require('../config/database');
    const [users] = await pool.query(
      'SELECT user_id, user_name, email, role FROM user WHERE user_id = ?',
      [decoded.userId || decoded.id]
    );
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    const user = users[0];
    req.user = {
      userId: user.user_id,
      username: user.user_name,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    console.error('❌ 认证中间件错误:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的token' // 【修复】：移除了 error.message 的暴露
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'token已过期' // 【修复】：移除了 error.message 的暴露
      });
    }
    
    return res.status(500).json({
      success: false,
      message: '认证过程出错' // 【修复】：移除了 error.message 防止泄露内部堆栈或系统信息
    });
  }
};

// ...（下面的 checkRole 和 checkRoleWithDbFields 代码保持不变，由于篇幅不重复粘贴）...
module.exports = { authMiddleware };

3. backend/controllers/authController.js （Token 生成部分）
修复点：将 generateToken 函数中的硬编码密钥移除。
// backend/controllers/authController.js (截取被修改的顶部片段)
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

// 生成JWT Token
const generateToken = (user) => {
  // 【修复】：强制检查并使用环境变量
  if (!process.env.JWT_SECRET) {
    throw new Error('致命错误：服务器未配置 JWT_SECRET');
  }
  
  return jwt.sign(
    {
      userId: user.user_id,
      userName: user.user_name,
      role: user.role
    },
    process.env.JWT_SECRET, // 移除了 'mozhicourse-secret-key-2024'
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

