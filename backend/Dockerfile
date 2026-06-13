# 使用官方轻量级 Node.js 镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 优先复制 package.json 安装依赖（利用 Docker 缓存加速）
COPY package*.json ./
RUN npm install

# 复制后端所有代码
COPY . .

# 暴露后端运行端口 (通常 Node 后端是 3000 或 8080，这里按我们之前配置的 8080)
EXPOSE 8080

# 启动 Node 服务
CMD ["node", "server.js"]