# 使用官方 Node.js 轻量级镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 先复制 package.json 和 lock 文件，利用 Docker 缓存加速依赖安装
COPY package*.json ./
RUN npm install

# 复制后端所有代码
COPY . .

# 暴露 3000 端口
EXPOSE 3000

# 启动后端服务
CMD ["node", "server.js"]