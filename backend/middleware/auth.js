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
    console.log('Token长度:', token.length);
    
    // 验证token
    // 为了与 token 生成端保持一致，默认 secret 也设置为 'mozhicourse-secret-key-2024'
    const secret = process.env.JWT_SECRET || 'mozhicourse-secret-key-2024';
    console.log('使用 JWT_SECRET:', process.env.JWT_SECRET ? 'env' : 'default');
    const decoded = jwt.verify(token, secret);
    console.log('✅ Token解码成功');
    console.log('Token payload:', decoded);
    
    // 从数据库中验证用户存在
    // 注意：这里查询的是 user 表而不是 users 表
    const { pool } = require('../config/database');
    const [users] = await pool.query(
      'SELECT user_id, user_name, email, role FROM user WHERE user_id = ?',
      [decoded.userId || decoded.id]
    );
    
    if (users.length === 0) {
      console.log('❌ 用户不存在于数据库中');
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    const user = users[0];
    
    // 设置用户信息
    req.user = {
      userId: user.user_id,        // 注意：数据库字段是 user_id
      username: user.user_name,    // 注意：数据库字段是 user_name
      email: user.email,
      role: user.role
    };
    
    console.log('✅ 认证成功 - 用户ID:', req.user.userId);
    console.log('=== 🔐 AUTH MIDDLEWARE END ===\n');
    
    next();
  } catch (error) {
    console.error('❌ 认证中间件错误:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的token',
        error: error.message
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'token已过期',
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: '认证过程出错',
      error: error.message
    });
  }
};

// 角色检查中间件
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    console.log('\n=== 🔒 ROLE CHECK MIDDLEWARE START ===');
    console.log('允许的角色:', allowedRoles);
    console.log('用户当前角色:', req.user?.role);
    
    if (!req.user || !req.user.role) {
      console.log('❌ 用户未认证或角色信息缺失');
      return res.status(401).json({
        success: false,
        message: '未认证或角色信息缺失'
      });
    }

    const userRole = req.user.role;
    
    // 管理员拥有所有权限
    if (userRole === 'admin') {
      console.log('✅ 管理员权限通过');
      console.log('=== 🔒 ROLE CHECK MIDDLEWARE END ===\n');
      return next();
    }

    // 检查角色是否在允许的列表中
    if (allowedRoles.includes(userRole)) {
      console.log(`✅ 角色检查通过 (${userRole})`);
      console.log('=== 🔒 ROLE CHECK MIDDLEWARE END ===\n');
      return next();
    }

    console.log(`❌ 权限不足: 需要 ${allowedRoles.join(' 或 ')}，当前是 ${userRole}`);
    console.log('=== 🔒 ROLE CHECK MIDDLEWARE END ===\n');
    
    return res.status(403).json({
      success: false,
      message: `权限不足，需要 ${allowedRoles.join(' 或 ')} 角色权限`,
      requiredRoles: allowedRoles,
      currentRole: userRole
    });
  };
};

// 针对数据库字段名的适配器（如果需要）
const checkRoleWithDbFields = (...allowedRoles) => {
  return async (req, res, next) => {
    console.log('\n=== 🔒 ROLE CHECK (WITH DB) MIDDLEWARE START ===');
    
    if (!req.user || !req.user.userId) {
      console.log('❌ 用户未认证');
      return res.status(401).json({
        success: false,
        message: '未认证'
      });
    }

    try {
      // 从数据库重新获取用户角色以确保准确性
      const { pool } = require('../config/database');
      const [users] = await pool.query(
        'SELECT role FROM user WHERE user_id = ?',
        [req.user.userId]
      );
      
      if (users.length === 0) {
        console.log('❌ 用户不存在');
        return res.status(401).json({
          success: false,
          message: '用户不存在'
        });
      }
      
      const userRole = users[0].role;
      console.log('数据库用户角色:', userRole);
      console.log('允许的角色:', allowedRoles);
      
      // 管理员拥有所有权限
      if (userRole === 'admin') {
        console.log('✅ 管理员权限通过');
        console.log('=== 🔒 ROLE CHECK (WITH DB) MIDDLEWARE END ===\n');
        return next();
      }

      // 检查角色是否在允许的列表中
      if (allowedRoles.includes(userRole)) {
        console.log(`✅ 角色检查通过 (${userRole})`);
        console.log('=== 🔒 ROLE CHECK (WITH DB) MIDDLEWARE END ===\n');
        return next();
      }

      console.log(`❌ 权限不足: 需要 ${allowedRoles.join(' 或 ')}，当前是 ${userRole}`);
      console.log('=== 🔒 ROLE CHECK (WITH DB) MIDDLEWARE END ===\n');
      
      return res.status(403).json({
        success: false,
        message: `权限不足，需要 ${allowedRoles.join(' 或 ')} 角色权限`,
        requiredRoles: allowedRoles,
        currentRole: userRole
      });
    } catch (error) {
      console.error('❌ 角色检查数据库错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误，角色检查失败'
      });
    }
  };
};

// 导出多个中间件
module.exports = { 
  authMiddleware, 
  checkRole,
  checkRoleWithDbFields // 可选：提供数据库验证版本
};