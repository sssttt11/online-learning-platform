// 错误处理中间件
const errorHandler = (err, req, res, next) => {
  console.error('错误:', err);

  // 默认错误
  let error = { ...err };
  error.message = err.message;

  // MySQL错误
  if (err.code === 'ER_DUP_ENTRY') {
    error.message = '该记录已存在';
    error.statusCode = 400;
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    error.message = '关联的记录不存在';
    error.statusCode = 400;
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    error.message = '无效的认证令牌';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = '认证令牌已过期';
    error.statusCode = 401;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
