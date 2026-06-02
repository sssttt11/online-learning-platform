const winston = require('winston');

// 创建结构化 JSON 日志记录器
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json() // 强制输出 JSON 格式，满足作业结构化要求
    ),
    transports: [
        new winston.transports.Console(), // 输出到控制台终端
        new winston.transports.File({ filename: 'app.log' }) // 保存到文件中
    ]
});

module.exports = logger;
// 创建结构化 JSON 日志记录器

