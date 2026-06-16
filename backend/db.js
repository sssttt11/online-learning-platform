// backend/db.js
const mysql = require('mysql2/promise');

// 创建数据库连接池
const pool = mysql.createPool({
    host: 'db',              // 🌟 修改点：从 'localhost' 改为 docker-compose 中的服务名 'db'
    user: 'root',            
    password: 'wsw051021',   // 密码保持不变
    database: 'learning_platform', 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;