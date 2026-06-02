# 栖学课堂 - 云端部署架构说明

本项目采用前后端分离架构进行部署，具体策略如下：

## 1. 平台选择
* **前端 (Vue 3)**: 部署于 Vercel。Vercel 对前端框架支持极佳，提供全球 CDN 加速及自动 HTTPS。
* **后端 (Node.js/Express)**: 部署于 Railway。支持 Docker 及 Nixpacks 自动检测，非常适合 Node 服务的免运维部署。
* **数据库 (MySQL)**: 部署于外部云数据库（如腾讯云/阿里云），提供公网访问。

## 2. 环境变量配置
在 Railway 的部署面板中，配置了以下环境变量以保证服务正常运行：
* `DATABASE_URL`: MySQL 生产环境连接字符串。
* `NODE_ENV`: 设为 `production`。
* `DEEPSEEK_API_KEY`: 栖学 AI 助教的大模型密钥。

## 3. 自动部署 (CI/CD)
前后端均已绑定 GitHub 仓库的 `main` 分支。任何推送到 `main` 分支的代码变更，都将自动触发 Vercel 和 Railway 的重新构建与部署。