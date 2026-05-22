// backend/db.js
const mysql = require('mysql2/promise');

// 创建数据库连接池
const pool = mysql.createPool({
    host: 'localhost',       // 你的数据库地址
    user: 'root',            // 你的 MySQL 用户名 (通常是 root)
    password: 'wsw051021',    // ⚠️ 请把你本机的 MySQL 密码填在这里！
    database: 'learning_platform', // 刚才建的数据库名
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;