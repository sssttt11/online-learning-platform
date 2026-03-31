// utils/response.js
const successResponse = (data, message = '成功') => {
  return {
    code: 200,
    message: message,
    data: data
  };
};

const errorResponse = (message, code = 500) => {
  return {
    code: code,
    message: message
  };
};

const notFoundResponse = (message = '资源不存在') => {
  return {
    code: 404,
    message: message
  };
};

module.exports = {
  successResponse,
  errorResponse,
  notFoundResponse
};