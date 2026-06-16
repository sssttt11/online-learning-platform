// backend/server.js
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const axios = require('axios'); // 新增：引入 axios 模块

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const logger = require('./utils/logger'); //  新增：引入日志模块
// 确保 uploads 文件夹存在，不存在则自动创建
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// 配置文件上传规则 (存到 uploads 文件夹，并用时间戳重命名防止重名)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// 中间件配置
app.use(cors()); // 允许前端 Vue 跨域请求
app.use(express.json()); // 允许后端解析前端传来的 JSON 数据

const SECRET_KEY = 'super_secret_key_for_university_project'; // 用于生成 JWT Token 的密钥

// 🌟 新增：全局指标收集中间件 (请求计数、响应时间、错误率拦截)
app.use(
(req, res, next) => {
    
const start = Date.now();
    res.on(
'finish', () => {
        
const duration = Date.now() - start;
        
const logData = {
            
method: req.method,
            
url: req.originalUrl,
            
status: res.statusCode,
            
durationMs: duration
        };
        
// 依据状态码判断是否为错误率指标
        
if (res.statusCode >= 400) {
            logger.error(
'API Error', logData);
        } 
else {
            logger.info(
'API Request', logData);
        }
    });
    next();
});


// 🌟 新增：健康检查端点 (严格按照作业要求的 JSON 格式返回)
app.get(
'/health', (req, res) => {
    res.json({
        
status: "healthy",
        
timestamp: new Date().toISOString(),
        
version: "1.0.0"
    });
});


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
 * 3. 获取所有课程列表 (GET /api/courses)
 */
app.get('/api/courses', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM courses ORDER BY id DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: '获取课程失败' });
    }
});

/**
 * 4. 获取单门课程详情 (GET /api/courses/:id)
 */
app.get('/api/courses/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM courses WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: '课程不存在' });
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: '服务器报错' });
    }
});

/**
 * 5. 发布新课程 (POST /api/courses)
 */
app.post('/api/courses', async (req, res) => {
    const { title, description, cover_image, video_url, category, teacher_name } = req.body;
    try {
        await db.query(
            'INSERT INTO courses (title, description, cover_image, video_url, category, teacher_name) VALUES (?, ?, ?, ?, ?, ?)',
            [title, description, cover_image, video_url, category, teacher_name || '特邀导师']
        );
        res.json({ success: true, message: '新课程发布成功！' });
    } catch (error) {
        res.status(500).json({ success: false, message: '发布失败' });
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
        // 使用子查询获取评论数，以及当前 user_id 点赞状态
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
 * 15. 编辑更新课程信息 (PUT /api/courses/:id)
 */
app.put('/api/courses/:id', async (req, res) => {
    const { title, description, cover_image, video_url, category, teacher_name } = req.body;
    try {
        await db.query(
            'UPDATE courses SET title = ?, description = ?, cover_image = ?, video_url = ?, category = ?, teacher_name = ? WHERE id = ?',
            [title, description, cover_image, video_url, category, teacher_name, req.params.id]
        );
        res.json({ success: true, message: '课程信息更新成功！' });
    } catch (error) {
        res.status(500).json({ success: false, message: '更新失败' });
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

/**
 * 23. [管理员] 为某门课程添加新章节 (POST /api/courses/:id/chapters)
 */
app.post('/api/courses/:id/chapters', async (req, res) => {
    const course_id = req.params.id;
    const { chapter_number, title, video_url } = req.body;
    try {
        await db.query(
            'INSERT INTO course_chapters (course_id, chapter_number, title, video_url) VALUES (?, ?, ?, ?)',
            [course_id, chapter_number, title, video_url]
        );
        res.json({ success: true, message: '章节添加成功！' });
    } catch (error) {
        console.error('添加章节失败:', error);
        res.status(500).json({ success: false, message: '添加章节失败' });
    }
});

/**
 * 24. [管理员] 删除某个指定的课程章节 (DELETE /api/chapters/:id)
 */
app.delete('/api/chapters/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM course_chapters WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: '章节已删除' });
    } catch (error) {
        console.error('删除章节失败:', error);
        res.status(500).json({ success: false, message: '删除章节失败' });
    }
});

/**
 * 25. 获取所有导师列表 (GET /api/teachers)
 * 用于管理员发布课程时的下拉菜单选择
 */
app.get('/api/teachers', async (req, res) => {
    try {
        const [teachers] = await db.query('SELECT * FROM teachers ORDER BY id ASC');
        res.json({ success: true, data: teachers });
    } catch (error) {
        res.status(500).json({ success: false, message: '获取导师列表失败' });
    }
});

/**
 * 26. [管理员] 上传课程封面图片 (POST /api/upload)
 */
app.post('/api/upload', upload.single('cover'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: '没有获取到文件' });
    }
    // 拼接出这张图片在服务器上的完整网络地址
    const imageUrl = `http://47.99.85.173:3000/uploads/${req.file.filename}`;
    res.json({ success: true, url: imageUrl });
});

/**
 * 27. 获取某门课程的所有评价 (GET /api/courses/:id/comments)
 */
app.get('/api/courses/:id/comments', async (req, res) => {
    try {
        const [comments] = await db.query(`
            SELECT cc.*, u.username, u.grade 
            FROM course_comments cc 
            JOIN users u ON cc.user_id = u.id 
            WHERE cc.course_id = ? 
            ORDER BY cc.created_at DESC
        `, [req.params.id]);
        res.json({ success: true, data: comments });
    } catch (error) {
        console.error('获取评价报错:', error);
        res.status(500).json({ success: false, message: '获取评价失败' });
    }
});

/**
 * 28. 学生发布课程评价 (POST /api/courses/:id/comments)
 */
app.post('/api/courses/:id/comments', async (req, res) => {
    const { user_id, content, rating } = req.body;
    if (!content) return res.status(400).json({ success: false, message: '评价内容不能为空' });
    
    try {
        await db.query(
            'INSERT INTO course_comments (course_id, user_id, content, rating) VALUES (?, ?, ?, ?)',
            [req.params.id, user_id, content, rating || 5]
        );
        res.json({ success: true, message: '评价发布成功，感谢你的分享！' });
    } catch (error) {
        console.error('发布评价报错:', error);
        res.status(500).json({ success: false, message: '评价发布失败' });
    }
});

/**
 * 29. 真实 AI 助教问答接口 (POST /api/chat)
 * 已接入 DeepSeek 大语言模型
 */
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: '你想问什么呢？' });

    // 🌟 将刚才复制的 DeepSeek API Key 粘贴在这里（保留外面的引号）
    const DEEPSEEK_API_KEY = 'sk-f9cc4eefb0754c59be53c0995861dfca';

    try {
        // 向大模型发起真实对话请求
        const response = await axios.post(
            'https://api.deepseek.com/chat/completions',
            {
                model: 'deepseek-chat', // 使用对话大模型
                messages: [
                    {
                        // System 角色是给 AI 下达的最高指令，也就是它的“人设”
                        role: 'system',
                        content: '你是“栖学课堂”的专属AI学习向导，名字叫“栖学”。你性格温和、专业、循循善诱。你的任务是解答学生关于学习规划、编程、理科等各方面的疑问。语气要像良师益友，尽量使用Markdown排版让回答清晰易读，不要回答涉及政治的敏感话题。'
                    },
                    {
                        // User 角色就是学生发来的问题
                        role: 'user',
                        content: message
                    }
                ],
                temperature: 0.7, // 控制回答的创造性（0.7比较适合教育问答）
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
                }
            }
        );

        // 提取大模型的真实回复内容
        const reply = response.data.choices[0].message.content;
        
        // 成功返回给前端！
        res.json({ success: true, reply: reply });

    } catch (error) {
        console.error('AI 接口请求失败:', error?.response?.data || error.message);
        res.status(500).json({ success: false, message: 'AI 助教的大脑正在升级中，请稍后再试哦 🌿' });
    }
});

/**
 * 30. 获取学生在该课程已完成的章节列表 (GET /api/progress)
 */
app.get('/api/progress', async (req, res) => {
    const { user_id, course_id } = req.query;
    try {
        const [rows] = await db.query(
            'SELECT chapter_id FROM learning_progress WHERE user_id = ? AND course_id = ?', 
            [user_id, course_id]
        );
        // 只返回已完成的章节 ID 数组，例如 [1, 2, 5]
        res.json({ success: true, data: rows.map(r => r.chapter_id) });
    } catch (error) {
        res.status(500).json({ success: false, message: '获取进度失败' });
    }
});

/**
 * 31. 记录某一小节为“已完成”状态 (POST /api/progress)
 */
app.post('/api/progress', async (req, res) => {
    const { user_id, course_id, chapter_id } = req.body;
    try {
        // 使用 INSERT IGNORE 避免重复插入报错
        await db.query(
            'INSERT IGNORE INTO learning_progress (user_id, course_id, chapter_id) VALUES (?, ?, ?)',
            [user_id, course_id, chapter_id]
        );
        res.json({ success: true, message: '本节研读已完成 🌿' });
    } catch (error) {
        res.status(500).json({ success: false, message: '进度记录失败' });
    }
});

/**
 * 32. 获取学生在“个人书斋”展示的已选课程及真实进度 (GET /api/users/:id/enrolled-courses)
 */
app.get('/api/users/:id/enrolled-courses', async (req, res) => {
    try {
        const userId = req.params.id;
        // 核心 SQL：联查选课表、课程表、章节表和进度表
        const [rows] = await db.query(`
            SELECT 
                c.id, c.title, c.cover_image, c.category, c.teacher_name,
                (SELECT COUNT(*) FROM course_chapters WHERE course_id = c.id) as total_chapters,
                (SELECT COUNT(*) FROM learning_progress WHERE course_id = c.id AND user_id = ?) as completed_chapters
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            WHERE e.student_id = ?
            ORDER BY e.enrolled_at DESC
        `, [userId, userId]);
        
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('获取个人课程库报错:', error);
        res.status(500).json({ success: false, message: '获取个人课程库失败' });
    }
});

/**
 * 33. 获取学生在所有课程中记下的“时光笔记”汇总 (GET /api/users/:id/all-notes)
 */
app.get('/api/users/:id/all-notes', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT n.*, c.title as course_title 
            FROM notes n
            JOIN courses c ON n.course_id = c.id
            WHERE n.user_id = ?
            ORDER BY n.created_at DESC
        `, [req.params.id]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: '获取笔记失败' });
    }
});

/**
 * 34. 获取平台注册用户总数 (GET /api/users/count)
 * 用于管理后台系统数据指标动态统计
 */
app.get('/api/users/count', async (req, res) => {
    try {
        // 执行统计用户总数的 SQL 语句
        const [rows] = await db.query('SELECT COUNT(*) AS total FROM users');
        res.json({ 
            success: true, 
            count: rows[0].total 
        });
    } catch (error) {
        console.error('查询注册用户总数失败:', error);
        res.status(500).json({ success: false, message: '无法获取系统用户总数数据' });
    }
});