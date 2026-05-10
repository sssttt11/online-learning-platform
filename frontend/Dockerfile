# 第一阶段：构建打包 (Build Stage)
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# 运行打包命令，产物会生成在 dist 目录下
RUN npm run build

# 第二阶段：生产环境运行 (Production Stage)
FROM nginx:alpine
# 将打包好的产物复制到 Nginx 的默认网页目录下
COPY --from=build /app/dist /usr/share/nginx/html
# 暴露 80 端口
EXPOSE 80
# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]