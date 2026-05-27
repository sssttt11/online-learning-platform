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
 * 10. 获取所有帖子列表 (支持最新/热门排序，并返回当前用户的点赞状态)
 */
app.get('/api/posts', async (req, res) => {
    const { user_id, sort } = req.query; // sort 可以是 'latest' 或 'trending'
    
    // 默认按时间倒序
    let orderClause = 'ORDER BY p.created_at DESC';
    if (sort === 'trending') {
        // 热度算法：点赞数权重为2，评论数权重为5。按总分倒序排列
        orderClause = 'ORDER BY (p.likes_count * 2 + (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) * 5) DESC, p.created_at DESC';
    }

    try {
        // 使用子查询获取评论数，以及当前用户是否点赞过该帖子
        const query = `
            SELECT p.id, p.title, p.content, p.created_at, p.likes_count, u.username, u.grade,
                   (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count
                   ${user_id ? `, (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) as is_liked` : ''}
            FROM posts p
            JOIN users u ON p.user_id = u.id
            ${orderClause}
        `;
        
        const params = user_id ? [user_id] : [];
        const [posts] = await db.query(query, params);
        res.json({ success: true, data: posts });
    } catch (error) {
        console.error('获取帖子失败:', error);
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

/**
 * 15. [管理员] 编辑更新课程信息 (PUT /api/courses/:id)
 */
app.put('/api/courses/:id', async (req, res) => {
    const { title, description, cover_image, video_url, category } = req.body;
    try {
        await db.query(
            'UPDATE courses SET title = ?, description = ?, cover_image = ?, video_url = ?, category = ? WHERE id = ?',
            [title, description, cover_image, video_url, category, req.params.id]
        );
        res.json({ success: true, message: '课程信息更新成功！' });
    } catch (error) {
        console.error('更新课程报错:', error);
        res.status(500).json({ success: false, message: '更新失败，请稍后重试' });
    }
});

/**
 * 16. [管理员] 下架(删除)课程 (DELETE /api/courses/:id)
 */
app.delete('/api/courses/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM courses WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: '课程已成功下架' });
    } catch (error) {
        console.error('下架课程报错:', error);
        res.status(500).json({ success: false, message: '下架失败，请检查相关数据' });
    }
});

/**
 * 17. 检查学生是否已选修某门课 (GET /api/enrollments/check)
 */
app.get('/api/enrollments/check', async (req, res) => {
    const { student_id, course_id } = req.query;
    if (!student_id || !course_id) return res.json({ success: false });

    try {
        const [rows] = await db.query(
            'SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?', 
            [student_id, course_id]
        );
        res.json({ success: true, isEnrolled: rows.length > 0 });
    } catch (error) {
        res.status(500).json({ success: false, message: '检查选课状态失败' });
    }
});

/**
 * 18. 学生正式选课接口 (POST /api/enrollments)
 */
app.post('/api/enrollments', async (req, res) => {
    const { student_id, course_id } = req.body;
    try {
        // 防重复选课校验
        const [existing] = await db.query('SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?', [student_id, course_id]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: '你已经选过这门课啦' });
        }

        // 插入选课记录，初始进度设为 0
        await db.query(
            'INSERT INTO enrollments (student_id, course_id, progress) VALUES (?, ?, 0)',
            [student_id, course_id]
        );
        res.json({ success: true, message: '选课成功，已收入你的个人书斋！' });
    } catch (error) {
        res.status(500).json({ success: false, message: '选课失败，请稍后再试' });
    }
});

/**
 * 19. 获取当前学生在某门课写的所有时间轴笔记 (GET /api/notes)
 */
app.get('/api/notes', async (req, res) => {
    const { user_id, course_id } = req.query;
    if (!user_id || !course_id) return res.status(400).json({ success: false, message: '缺乏必要参数' });

    try {
        const [notes] = await db.query(
            'SELECT * FROM course_notes WHERE user_id = ? AND course_id = ? ORDER BY timestamp_secs ASC',
            [user_id, course_id]
        );
        res.json({ success: true, data: notes });
    } catch (error) {
        res.status(500).json({ success: false, message: '获取随堂笔记失败' });
    }
});

/**
 * 20. 保存学生随堂时间轴笔记 (POST /api/notes)
 */
app.post('/api/notes', async (req, res) => {
    const { user_id, course_id, content, timestamp_secs } = req.body;
    if (!content || content.trim() === '') return res.status(400).json({ success: false, message: '笔记内容不能为空' });

    try {
        await db.query(
            'INSERT INTO course_notes (user_id, course_id, content, timestamp_secs) VALUES (?, ?, ?, ?)',
            [user_id, course_id, content, Math.floor(timestamp_secs)]
        );
        res.json({ success: true, message: '笔记已镌刻在时间轴上' });
    } catch (error) {
        res.status(500).json({ success: false, message: '保存笔记失败' });
    }
});

/**
 * 21. 获取某门课程的章节目录 (GET /api/courses/:id/chapters)
 */
app.get('/api/courses/:id/chapters', async (req, res) => {
    try {
        const [chapters] = await db.query(
            'SELECT * FROM course_chapters WHERE course_id = ? ORDER BY chapter_number ASC', 
            [req.params.id]
        );
        res.json({ success: true, data: chapters });
    } catch (error) {
        res.status(500).json({ success: false, message: '获取章节目录失败' });
    }
});

/**
 * 22. 切换帖子点赞状态 (POST /api/posts/:id/like)
 */
app.post('/api/posts/:id/like', async (req, res) => {
    const post_id = req.params.id;
    const { user_id } = req.body;

    if (!user_id) return res.status(400).json({ success: false, message: '请先登录' });

    try {
        // 查询是否已经点过赞
        const [existing] = await db.query('SELECT * FROM post_likes WHERE user_id = ? AND post_id = ?', [user_id, post_id]);
        
        if (existing.length > 0) {
            // 如果已点赞，则取消点赞
            await db.query('DELETE FROM post_likes WHERE user_id = ? AND post_id = ?', [user_id, post_id]);
            await db.query('UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = ?', [post_id]);
            res.json({ success: true, action: 'unliked' });
        } else {
            // 如果未点赞，则新增点赞
            await db.query('INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)', [user_id, post_id]);
            await db.query('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?', [post_id]);
            res.json({ success: true, action: 'liked' });
        }
    } catch (error) {
        console.error('点赞失败:', error);
        res.status(500).json({ success: false, message: '操作失败' });
    }
});