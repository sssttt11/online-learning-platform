import request from '@/utils/request'

// 用户注册
export const register = (data) => {
  // data: { user_name, phone, email?, password, occupation?, learning_goal? }
  return request.post('/auth/register', data)
}

// 用户登录（用户名 + 密码）
export const login = (data) => {
  // 前端传入 { username, password }，后端也按 username 接收
  const { username, password } = data
  return request.post('/auth/login', {
    username: username,
    password,
  })
}

// 获取当前登录用户信息
export const getCurrentUser = () => {
  return request.get('/auth/me')
}
