# ===== 第一阶段：构建打包 =====
FROM node:22-alpine

WORKDIR /app

# 缓存依赖
COPY package*.json ./
RUN npm ci

# 复制代码
COPY . .

# 接收 compose 传来的后端 IP 参数
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# 打包 Vue 代码到 dist 目录
RUN npm run build

# ===== 第二阶段：Nginx 部署 =====
FROM nginx:alpine

# 把构建好的静态文件放到 Nginx 默认目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 替换默认配置，完美解决 Vue Router 刷新 404 的问题
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]