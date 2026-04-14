const { execute } = require('../config/database');
const UserModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const path = require('path');

// 获取用户个人信息
const getUserProfile = async (req, res) => {
  try {
    console.log('🔍 [getUserProfile] 开始获取用户信息，用户ID:', req.user.userId);
    console.log('🔍 从req.user中获取的token角色信息:', req.user.role);
    console.log('🔍 完整的req.user对象:', JSON.stringify(req.user, null, 2));
    
    const userId = req.user.userId;
    const user = await UserModel.findById(userId);

    if (!user) {
      console.log('❌ 用户不存在:', userId);
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    // 详细打印用户对象的所有字段
    console.log('✅ 数据库用户对象完整内容:', JSON.stringify(user, null, 2));
    console.log('✅ 数据库用户角色字段值:', user.role);
    console.log('✅ 数据库用户角色字段类型:', typeof user.role);
    console.log('✅ 数据库用户角色字段是否存在:', 'role' in user);

    // 确定最终角色：优先使用数据库中的角色，如果为空则使用token中的角色
    const finalRole = user.role || req.user.role || 'learner';
    console.log('🎯 最终确定的用户角色:', finalRole);
    console.log('🎯 角色来源:', 
      user.role ? '数据库' : 
      req.user.role ? 'JWT Token' : '默认值(learner)'
    );

    // 从 user_detail 读取个性签名等扩展信息
    const [detailRows] = await execute(
      'SELECT user_intro, occupation FROM user_detail WHERE user_id = ?',
      [userId]
    );
    const detail = detailRows?.[0] || {};
    console.log('📝 用户详细信息:', detail);

    // 查询已报名课程数量（is_enrolled=1）
    console.log('📚 查询已报名课程数量...');
    const [enrolledCoursesResult] = await execute(
      'SELECT COUNT(*) as count FROM user_course WHERE user_id = ? AND is_enrolled = 1',
      [userId]
    );
    
    const enrolledCount = enrolledCoursesResult[0]?.count || 0;
    console.log('📊 已报名课程数量:', enrolledCount);
    
    // 查询已完成课程数量（进度>=100）
    const [completedCoursesResult] = await execute(
      'SELECT COUNT(*) as count FROM user_course WHERE user_id = ? AND progress >= 100 AND is_enrolled = 1',
      [userId]
    );
    const completedCount = completedCoursesResult[0]?.count || 0;
    console.log('🎯 已完成课程数量:', completedCount);
    
    // 查询总学习时长（从 learning_detail 表）
    console.log('⏱️ 查询总学习时长...');
    const [learningHoursResult] = await execute(
      `SELECT COALESCE(SUM(learn_duration)/3600, 0) as hours 
       FROM learning_detail 
       WHERE user_id = ?`,
      [userId]
    );
    const totalHours = parseFloat(learningHoursResult[0]?.hours || 0);
    console.log('🕒 总学习时长(小时):', totalHours);
    
    // 查询连续学习天数
    console.log('📅 查询连续学习天数...');
    const [continuousDaysResult] = await execute(
      `SELECT 
        COUNT(DISTINCT DATE(learn_time)) as days
       FROM learning_detail 
       WHERE user_id = ? 
         AND learn_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [userId]
    );
    const continuousDays = continuousDaysResult[0]?.days || 0;
    console.log('🔥 连续学习天数:', continuousDays);
    
    // 查询获得的成就数量
    const [achievementsResult] = await execute(
      'SELECT COUNT(*) as count FROM user_achievement WHERE user_id = ?',
      [userId]
    );
    const achievementsCount = achievementsResult[0]?.count || 0;
    console.log('🏆 获得成就数量:', achievementsCount);

    // 学习统计数据
    const learningStats = {
      total_learning_hours: totalHours,
      enrolled_courses: enrolledCount,
      courses_completed: completedCount,
      continuous_days: continuousDays,
      achievements_earned: achievementsCount,
      achievement_rate: enrolledCount > 0 ? 
        Math.round((completedCount / enrolledCount) * 100) : 0
    };

    console.log('📈 最终学习统计数据:', JSON.stringify(learningStats, null, 2));

    // 构建返回数据，确保role字段始终存在且有正确值
    const responseData = {
      userId: user.user_id,
      userName: user.user_name,
      email: user.email,
      avatarUrl: user.avatar_url,
      role: finalRole, // 使用最终确定的角色
      registerTime: user.register_time,
      lastLoginTime: user.last_login_time,
      userIntro: detail.user_intro || '',
      occupation: detail.occupation || null,
      learningStats
    };

    console.log('📤 返回给前端的用户数据:', JSON.stringify(responseData, null, 2));
    console.log('📤 返回数据中的角色字段:', responseData.role);

    res.json({
      success: true,
      data: responseData
    });

    console.log('✅ [getUserProfile] 用户信息获取完成');

  } catch (error) {
    console.error('❌ 获取用户信息失败:', error);
    console.error('❌ 错误堆栈:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 更新用户信息
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { user_name, email, user_intro } = req.body;

    // 验证输入
    if (user_name && user_name.trim().length === 0) {
      return res.status(400).json({ success: false, message: '用户名不能为空' });
    }

    // 检查用户名是否已存在
    if (user_name && await UserModel.checkUserNameExists(user_name, userId)) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }

    // 检查邮箱是否已存在
    if (email && await UserModel.checkEmailExists(email, userId)) {
      return res.status(400).json({ success: false, message: '邮箱已存在' });
    }

    // 1. 更新 user 表中的基础信息（昵称 / 邮箱）
    const updateData = {};
    if (user_name) updateData.user_name = user_name.trim();
    if (email) updateData.email = email;

    if (Object.keys(updateData).length > 0) {
      await UserModel.updateProfile(userId, updateData);
    }

    // 2. 更新 user_detail 表中的个性签名
    if (user_intro !== undefined) {
      const intro = user_intro || '';

      // 先检查是否已有 user_detail 记录
      const [rows] = await execute(
        'SELECT user_detail_id FROM user_detail WHERE user_id = ?',
        [userId]
      );

      if (rows.length > 0) {
        await execute(
          'UPDATE user_detail SET user_intro = ? WHERE user_id = ?',
          [intro, userId]
        );
      } else {
        await execute(
          'INSERT INTO user_detail (user_id, user_intro) VALUES (?, ?)',
          [userId, intro]
        );
      }
    }

    res.json({ success: true, message: '用户信息更新成功' });

  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 上传头像
const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ success: false, message: '请选择要上传的图片' });
    }

    // 构建头像URL
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // 更新数据库中的头像URL
    await UserModel.updateAvatar(userId, avatarUrl);

    res.json({
      success: true,
      message: '头像上传成功',
      data: {
        avatarUrl: avatarUrl
      }
    });

  } catch (error) {
    console.error('上传头像失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 修改密码
const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: '请提供当前密码和新密码' });
    }

    if (newPassword.length < 6 || newPassword.length > 20) {
      return res.status(400).json({ success: false, message: '新密码长度应为6-20位' });
    }

    // 获取用户当前密码
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    // 验证当前密码
    const isValidPassword = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ success: false, message: '当前密码错误' });
    }

    // 加密新密码
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // 更新密码
    await UserModel.updatePassword(userId, newPasswordHash);

    res.json({ success: true, message: '密码修改成功' });

  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 获取社区数据
const getCommunityData = async (req, res) => {
  try {
    const userId = req.user.userId;

    // 获取用户参与的学习小组
    const [teams] = await execute(`
      SELECT 
        st.team_id,
        st.team_name,
        st.description,
        st.current_members,
        st.max_members,
        tm.role,
        tm.join_time
      FROM team_member tm
      JOIN study_team st ON tm.team_id = st.team_id
      WHERE tm.user_id = ?
      ORDER BY tm.join_time DESC
      LIMIT 5
    `, [userId]);

    // 获取用户参与的自习室
    const [rooms] = await execute(`
      SELECT 
        sr.room_id,
        sr.room_name,
        sr.description,
        sr.current_participants,
        sr.max_participants,
        rm.join_time
      FROM room_member rm
      JOIN study_room sr ON rm.room_id = sr.room_id
      WHERE rm.user_id = ? AND rm.leave_time IS NULL
      ORDER BY rm.join_time DESC
      LIMIT 5
    `, [userId]);

    // 获取用户发布的帖子数量
    const [postStats] = await execute(`
      SELECT 
        COUNT(*) as total_posts,
        SUM(likes_count) as total_likes,
        SUM(comments_count) as total_comments
      FROM community_post 
      WHERE author_id = ?
    `, [userId]);

    res.json({
      success: true,
      data: {
        teams: teams || [],
        rooms: rooms || [],
        postStats: postStats[0] || { total_posts: 0, total_likes: 0, total_comments: 0 }
      }
    });

  } catch (error) {
    console.error('获取社区数据失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
  changePassword,
  getCommunityData
};
