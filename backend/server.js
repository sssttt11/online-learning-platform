// backend/server.js
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();

// 中间件配置
app.use(cors()); // 允许前端 Vue 跨域请求
app.use(express.json()); // 允许后端解析前端传来的 JSON 数据

const SECRET_KEY = 'super_secret_key_for_university_project'; // 用于生成 JWT Token 的密钥

// ================= API 路由区 =================

/**
 * 1. 用户登录接口 (POST /api/login)
 */
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // 去数据库查询该用户
        const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        const user = users[0];

        // 校验账号密码 (暂时明文比对，方便测试)
        if (!user || user.password !== password) {
            return res.status(401).json({ success: false, message: '用户名或密码错误' });
        }

        // 登录成功，生成 JWT Token
        // Token 里包含了用户的 id 和角色信息
        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '24h' });

        res.json({
            success: true,
            message: '登录成功',
            token: token,
            user: { id: user.id, username: user.username, role: user.role }
        });
    } catch (error) {
        console.error('登录报错:', error);
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
});

/**
 * 2. 获取课程列表接口 (GET /api/courses)
 */
app.get('/api/courses', async (req, res) => {
    try {
        const [courses] = await db.query('SELECT id, title, description, cover_image FROM courses');
        res.json({ success: true, data: courses });
    } catch (error) {
        console.error('获取课程报错:', error);
        res.status(500).json({ success: false, message: '获取课程失败' });
    }
});

// ================= 启动服务器 =================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 后端服务器已成功启动，正在监听端口: http://localhost:${PORT}`);
});

/**
 * 3. 获取单个课程详情 (GET /api/courses/:id)
 */
app.get('/api/courses/:id', async (req, res) => {
    try {
        // req.params.id 就是前端 URL 里传过来的课程 ID
        const [courses] = await db.query('SELECT * FROM courses WHERE id = ?', [req.params.id]);
        
        if (courses.length === 0) {
            return res.status(404).json({ success: false, message: '课程不存在' });
        }
        
        res.json({ success: true, data: courses[0] });
    } catch (error) {
        console.error('获取课程详情报错:', error);
        res.status(500).json({ success: false, message: '获取课程详情失败' });
    }
});

/**
 * 4. 提交作业接口 (POST /api/assignments)
 */
app.post('/api/assignments', async (req, res) => {
    // 从前端请求体中获取 课程ID、学生ID 和 作业内容
    const { course_id, student_id, content } = req.body;

    if (!content || content.trim() === '') {
        return res.status(400).json({ success: false, message: '作业内容不能为空' });
    }

    try {
        // 插入到数据库的 assignments 表
        await db.query(
            'INSERT INTO assignments (course_id, student_id, content, status) VALUES (?, ?, ?, ?)',
            [course_id, student_id, content, 'submitted']
        );
        res.json({ success: true, message: '作业提交成功，请等待导师批阅' });
    } catch (error) {
        console.error('提交作业报错:', error);
        res.status(500).json({ success: false, message: '提交失败，请稍后重试' });
    }
});

/**
 * 5. 发布新课程接口 (POST /api/courses)
 */
app.post('/api/courses', async (req, res) => {
    // 接收前端表单传来的课程数据
    const { title, description, cover_image, video_url, category, teacher_id } = req.body;

    if (!title || !category) {
        return res.status(400).json({ success: false, message: '课程标题和分类为必填项' });
    }

    try {
        await db.query(
            'INSERT INTO courses (title, description, cover_image, video_url, category, teacher_id) VALUES (?, ?, ?, ?, ?, ?)',
            [title, description, cover_image, video_url, category, teacher_id]
        );
        res.json({ success: true, message: '新课程发布成功！' });
    } catch (error) {
        console.error('发布课程报错:', error);
        res.status(500).json({ success: false, message: '发布课程失败，请检查数据格式' });
    }
});
/**
 * 6. 用户注册接口 (POST /api/register)
 */
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: '账号和密码不能为空' });
    }

    try {
        // 1. 先检查数据库里有没有同名的账号
        const [existingUsers] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ success: false, message: '该学号/账号已被注册，请换一个试试' });
        }

        // 2. 插入新用户，默认分配 'student' 学生角色
        await db.query(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
            [username, password, 'student'] // ⚠️ 实际商业项目中密码需要用 bcrypt 加密，这里为了你测试方便暂用明文
        );

        res.json({ success: true, message: '注册成功！欢迎加入栖学课堂。' });
    } catch (error) {
        console.error('注册报错:', error);
        res.status(500).json({ success: false, message: '服务器内部错误，请稍后再试' });
    }
});

/**
 * 7. 获取个人中心信息及选课进度 (GET /api/user/profile/:id)
 */
app.get('/api/user/profile/:id', async (req, res) => {
    try {
        // 查询用户基本信息 (排除密码)
        const [users] = await db.query('SELECT id, username, grade, role FROM users WHERE id = ?', [req.params.id]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }

        // 联表查询该学生选修的课程以及对应的学习进度
        const [courses] = await db.query(
            `SELECT c.id, c.title, c.cover_image, c.category, e.progress 
             FROM enrollments e 
             JOIN courses c ON e.course_id = c.id 
             WHERE e.student_id = ?`, 
            [req.params.id]
        );

        res.json({
            success: true,
            user: users[0],
            enrolledCourses: courses
        });
    } catch (error) {
        console.error('获取个人中心失败:', error);
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
});

/**
 * 8. 修改基本信息 (PUT /api/user/profile/:id)
 */
app.put('/api/user/profile/:id', async (req, res) => {
    const { username, grade } = req.body;
    try {
        // 检查新用户名是否被其他人占用了
        const [existing] = await db.query('SELECT * FROM users WHERE username = ? AND id != ?', [username, req.params.id]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: '该用户名已被占用' });
        }

        await db.query('UPDATE users SET username = ?, grade = ? WHERE id = ?', [username, grade, req.params.id]);
        res.json({ success: true, message: '资料更新成功' });
    } catch (error) {
        res.status(500).json({ success: false, message: '更新资料失败' });
    }
});

/**
 * 9. 修改密码 (PUT /api/user/password/:id)
 */
app.put('/api/user/password/:id', async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    try {
        const [users] = await db.query('SELECT password FROM users WHERE id = ?', [req.params.id]);
        if (users[0].password !== oldPassword) {
            return res.status(400).json({ success: false, message: '旧密码验证失败，请重新输入' });
        }

        await db.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, req.params.id]);
        res.json({ success: true, message: '密码修改成功，请用新密码重新登录' });
    } catch (error) {
        res.status(500).json({ success: false, message: '修改密码失败' });
    }
});

// ================= 社区互动接口 =================

/**
 * 10. 获取所有帖子列表 (包含作者信息和评论数) (GET /api/posts)
 */
app.get('/api/posts', async (req, res) => {
    try {
        const query = `
            SELECT p.id, p.title, p.content, p.created_at, u.username, u.grade,
                   (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
        `;
        const [posts] = await db.query(query);
        res.json({ success: true, data: posts });
    } catch (error) {
        res.status(500).json({ success: false, message: '获取社区帖子失败' });
    }
});

/**
 * 11. 发布新帖子 (POST /api/posts)
 */
app.post('/api/posts', async (req, res) => {
    const { user_id, title, content } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: '标题和内容不能为空' });

    try {
        await db.query('INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)', [user_id, title, content]);
        res.json({ success: true, message: '发布成功，栖学因你更精彩！' });
    } catch (error) {
        res.status(500).json({ success: false, message: '发布帖子失败' });
    }
});

/**
 * 12. 获取单个帖子及其所有评论 (GET /api/posts/:id)
 */
app.get('/api/posts/:id', async (req, res) => {
    try {
        // 查帖子详情
        const [posts] = await db.query(
            'SELECT p.*, u.username FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?', 
            [req.params.id]
        );
        if (posts.length === 0) return res.status(404).json({ success: false, message: '帖子不存在' });

        // 查该帖子下的评论
        const [comments] = await db.query(
            'SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ? ORDER BY c.created_at ASC',
            [req.params.id]
        );

        res.json({ success: true, post: posts[0], comments });
    } catch (error) {
        res.status(500).json({ success: false, message: '获取帖子详情失败' });
    }
});

/**
 * 13. 发表评论 (POST /api/comments)
 */
app.post('/api/comments', async (req, res) => {
    const { post_id, user_id, content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: '评论内容不能为空' });

    try {
        await db.query('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)', [post_id, user_id, content]);
        res.json({ success: true, message: '评论成功' });
    } catch (error) {
        res.status(500).json({ success: false, message: '评论失败' });
    }
});

/**
 * 14. [管理员] 强制删除帖子及关联评论 (DELETE /api/posts/:id)
 */
app.delete('/api/posts/:id', async (req, res) => {
    try {
        // 因为设置了 ON DELETE CASCADE，删除 posts 表的数据会自动删除 comments 表中关联的数据
        await db.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: '违规帖子已被彻底清除' });
    } catch (error) {
        console.error('删帖报错:', error);
        res.status(500).json({ success: false, message: '删除失败，请联系技术人员' });
    }
});