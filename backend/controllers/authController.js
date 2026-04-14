const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const UserModel = require('../models/userModel');

// 生成JWT Token
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.user_id,
      userName: user.user_name,
      role: user.role
    },
    process.env.JWT_SECRET || 'mozhicourse-secret-key-2024',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

// 用户注册（只需用户名和密码）
exports.register = async (req, res, next) => {
  try {
    console.log('📝 收到注册请求，请求体:', req.body);
    const { user_name, password, role } = req.body;

    // 验证必填字段
    if (!user_name || !password) {
      console.log('❌ 验证失败：缺少必填字段');
      return res.status(400).json({
        success: false,
        message: '用户名和密码为必填项'
      });
    }
    
    console.log('✅ 必填字段验证通过');

    console.log(' 检查用户名是否已存在:', user_name);
    // 检查用户名是否已存在
    const existing = await UserModel.findByUserName(user_name);

    if (existing) {
      console.log('❌ 用户名已存在');
      return res.status(400).json({
        success: false,
        message: '该用户名已被注册'
      });
    }

    // 自动生成唯一邮箱（数据库要求）
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const email = `${user_name.replace(/\s+/g, '_')}_${timestamp}_${randomStr}@mzcourse.local`;
    console.log('📧 自动生成邮箱:', email);

    // 角色校验
    let finalRole = 'learner';
    if (role === 'instructor' || role === 'learner') {
      finalRole = role;
    }
    console.log('👤 用户角色:', finalRole);

    // 密码加密
    console.log('🔐 开始加密密码...');
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    console.log('✅ 密码加密完成');

    // 插入用户数据
    console.log('💾 准备插入用户数据:', { user_name, role: finalRole });
    const newUser = await UserModel.create({
      user_name,
      email,
      password_hash,
      role: finalRole,
    });
    console.log('✅ 用户创建成功，ID:', newUser.user_id);

    // 生成token
    console.log('🎫 生成 JWT token...');
    const token = generateToken(newUser);
    console.log('✅ Token 生成成功');

    console.log('🎉 注册流程完成，返回响应');
    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: newUser,
        token
      }
    });
  } catch (error) {
    console.error('💥 注册过程中发生错误:');
    console.error('错误类型:', error.name);
    console.error('错误消息:', error.message);
    console.error('错误代码:', error.code);
    console.error('完整错误:', error);
    next(error);
  }
};

// 用户登录
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const account = username;

    // 验证必填字段
    if (!account || !password) {
      return res.status(400).json({
        success: false,
        message: '账号和密码为必填项'
      });
    }

    // 查询用户（支持 phone 或 user_name 作为账号）
    const user = await UserModel.findByAccount(account);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 检查账户状态
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: '账户已被禁用'
      });
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 更新最后登录时间
    await UserModel.updateLastLoginTime(user.user_id);

    // 删除敏感信息
    delete user.password_hash;

    // 生成token
    const token = generateToken(user);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取当前用户信息
exports.getCurrentUser = async (req, res, next) => {
  try {
    const users = await getUserById(req.user.userId);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    next(error);
  }
};

// 更新用户信息
exports.updateProfile = async (req, res, next) => {
  try {
    const { user_name, email, occupation, learning_goal, user_intro } = req.body;
    const userId = req.user.userId;

    const hasUpdates = [user_name, email, occupation, learning_goal, user_intro]
      .some((value) => value !== undefined);

    if (!hasUpdates) {
      return res.status(400).json({
        success: false,
        message: '没有要更新的字段'
      });
    }

    const updated = await updateUserProfile(userId, {
      user_name,
      email,
      occupation,
      learning_goal,
      user_intro
    });

    // 获取更新后的用户信息
    const users = await getUserById(userId);

    res.json({
      success: true,
      message: '更新成功',
      data: users[0]
    });
  } catch (error) {
    next(error);
  }
};

// 修改密码
exports.changePassword = async (req, res, next) => {
  try {
    const { old_password, new_password } = req.body;
    const userId = req.user.userId;

    if (!old_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: '旧密码和新密码为必填项'
      });
    }

    // 获取当前密码
    const users = await getUserPasswordHash(userId);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 验证旧密码
    const isMatch = await bcrypt.compare(old_password, users[0].password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '旧密码错误'
      });
    }

    // 加密新密码
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password, salt);

    // 更新密码
    await updateUserPassword(userId, password_hash);

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    next(error);
  }
};
