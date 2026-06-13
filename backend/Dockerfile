# 使用官方轻量级 Python 镜像
FROM python:3.12-slim

# 设置工作目录
WORKDIR /app

# 先复制依赖文件并安装，利用 Docker 缓存加速构建
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制代码
COPY . .

# 暴露 8080 端口
EXPOSE 8080

# 启动后端服务 (请确保这里的启动命令与你实际代码匹配)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]