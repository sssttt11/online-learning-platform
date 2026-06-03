<<<<<<< HEAD
 🌿 栖学课堂 (QiXue Classroom)
=======
# 🌿 栖学课堂 (QiXue Classroom)
>>>>>>> f1e9296908069d10f9245dbf44b81a3bf1056598

> 一个探索沉浸式学习与 AI 赋能的现代化在线教育平台。

![Vue.js](https://img.shields.io/badge/Vue%203-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![DeepSeek API](https://img.shields.io/badge/AI_Powered-DeepSeek-000000?style=for-the-badge)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)

## 📖 项目介绍

**栖学课堂** 打破了传统网课平台的单向灌输模式，致力于构建一个“有记忆、有温度、有智慧”的个人专属书斋。项目采用 Vue 3 + Node.js 的前后端分离架构，不仅实现了流媒体播放与互动学习的业务闭环，更深度集成了大语言模型（LLM）作为全局私人助教，为学习者提供全天候的知识解惑。

---

## ✨ 核心业务功能

### 📺 沉浸式研读空间
- **智能播放器**：支持本地视频流托管与 Bilibili 跨域视频 iframe 无缝嵌入，自适应切换。
- **多章节选集**：清晰的课程目录树，支持点击无刷新切换播放源。
- **真实进度追踪**：基于后端的 `learning_progress` 进度系统，联动视频播放结束事件（`@ended`），实现真实打卡与进度条推演。

### 🤖 全局 AI 学习向导
- **专属 AI 助教**：深度接入 **DeepSeek** 大语言模型 API，并注入“栖学专属老师”人设。
- **悬浮陪伴式交互**：全局支持右下角悬浮唤醒，带有沉浸式打字机 Loading 动画与自动滚动置底体验。

### ✍️ 时空互动体系
- **随堂时光笔记**：在播放特定时刻留下的笔记，带有时间戳 Badge，点击即可穿梭回对应的视频进度。
- **多维课程评价**：支持 1-5 星级的色彩动态评分系统与文字心得沉淀。
- **作业撰写与批阅**：独立的作业撰写弹窗与提交流程闭环。

### 👤 个人专属书斋 (Profile)
- **双引擎面板**：提供“基本资料及密码安全管理”与“我的书斋”双卡片布局。
- **学习数据聚合**：实时计算已选课程的百分比进度，时间轴式汇总跨课程的所有时光笔记。

---

## 🚀 工程化与进阶实践 (Beyond Features)

除了业务功能，本项目在**系统架构、DevOps 与代码工程化**层面进行了深度实践，达到了生产环境标准：

### ☁️ 云原生部署与 CI/CD 流水线
- **多云协同架构**：前端静态单页应用（SPA）托管于 **Vercel** 边缘网络；后端 Node.js API 容器化部署于 **Railway (Nixpacks)**；数据层接入公网云数据库 MySQL。
- **自动化持续集成**：深度绑定 GitHub `main` 分支代码，实现 Push 即部署、无缝滚动更新的现代 CI/CD 流程。
- **安全隔离**：全栈实施严格的环境变量（Environment Variables）注入策略，确保 `DATABASE_URL` 与大模型密钥等敏感资产不在源码中裸露。

### 📈 生产级监控与可观测性 (Observability)
- **JSON 结构化日志**：引入 `winston` 引擎，实现控制台与 `app.log` 文件的 JSON 格式双路输出，精准记录核心交互。
- **API 性能指标拦截**：在 Express 中挂载全局耗时追踪探针，自动收集并分类打印**请求计数**、**响应延迟 (ms)** 以及 **HTTP 状态码异常 (>=400)**。
- **存活心跳检测**：配置标准的 `/health` 端点，为云平台负载均衡器提供存活验证。

### 🧪 健壮性与安全机制
- **CORS 跨域打通**：通过精准的中间件配置，解决 Vercel 线上域名与 Railway 后端服务的安全跨域请求问题。
- **代码覆盖率保障**：引入 V8 引擎驱动的组件测试，针对 Login 登录模块及 CourseCard 课程卡片等核心组件进行严密的测试覆盖与异常排查，保障交互逻辑的极高健壮性。

---

## 🛠️ 技术栈指北

| 领域 | 核心技术选型 | 说明 |
| :--- | :--- | :--- |
| **前端框架** | Vue 3 (Composition API) + Vite | 采用 script setup 语法糖构建现代组件 |
| **UI 组件库** | Element Plus | 深度定制了部分 CSS 变量以符合高雅视觉规范 |
| **后端引擎** | Node.js + Express | 搭建轻量、高性能的 RESTful API 服务 |
| **持久化层** | MySQL 8.0 + `mysql2/promise` | 全面使用异步 Promise 驱动数据库查询，杜绝回调地狱 |
| **图片托管** | Multer | 实现本地 `multipart/form-data` 的课程封面上传引擎 |
| **AI 大模型** | DeepSeek Chat API + Axios | 使用 Axios 封装 HTTP 请求与大模型中转 |
| **监控工具** | Winston | 工业级结构化日志管理 |

---

## 💻 本地运行指南

### 环境要求
- Node.js >= 18.x
- MySQL >= 8.0

### 1. 启动后端 (Backend)
<<<<<<< HEAD

cd backend

npm install

请确保本地 MySQL 已启动，并已导入初始 SQL 文件

npm run dev 

默认运行在 http://localhost:3000

###2. 启动前端 (Frontend)

cd frontend

npm install

npm run dev

Vite 将自动分配端口，如 http://localhost:5173

📁 核心目录结构

project/

├── backend/                   # 后端 API 服务层

│   ├── utils/logger.js        # Winston 结构化日志配置

=======
```bash
cd backend
npm install
# 请确保本地 MySQL 已启动，并已导入初始 SQL 文件
npm run dev 
# 默认运行在 http://localhost:3000

2. 启动前端 (Frontend)
Bash
cd frontend
npm install
npm run dev
# Vite 将自动分配端口，如 http://localhost:5173

📁 核心目录结构

project/

├── backend/                   # 后端 API 服务层

│   ├── utils/logger.js        # Winston 结构化日志配置

>>>>>>> f1e9296908069d10f9245dbf44b81a3bf1056598
│   ├── uploads/               # 本地图片上传托管目录

│   └── server.js              # 核心路由与数据库/AI控制层

├── frontend/                  # 前端 Vue 3 渲染层

│   ├── src/

│   │   ├── views/             # 页面视图 (Dashboard, CourseDetail, Profile)

│   │   └── style.css          # 全局 CSS 变量与极简主题

│   └── vite.config.js

├── docs/                      # 工程与作业交付文档

│   ├── deployment.md          # CI/CD 部署技术架构说明

│   └── monitoring.md          # 可观测性与日志监控配置说明

├── vercel.json                # Vercel 前端重写与托管引导

└── railway.toml               # Railway Nixpacks 容器化构建引导
