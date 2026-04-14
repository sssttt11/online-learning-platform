// src/api/user.js
import request from '@/utils/request'

export const getUserInfo = (userId) =>
  request.get(`/api/user/${userId}`)

export const updateUserInfo = (data) =>
  request.put('/api/user', data)

// 如果没有后端接口，可以先用模拟数据
export const getMockUserInfo = () => {
  return Promise.resolve({
    data: {
      user_id: 1,
      user_name: '李小明',
      email: 'student1@icoursera.com',
      occupation: '大学生',
      learning_goal: '学习Python编程',
      role: 'learner'
    }
  })
}