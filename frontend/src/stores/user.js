import { defineStore } from 'pinia'

const API_BASE = 'http://localhost:4000'

export const useUserStore = defineStore('user', {
  state: () => ({
    userId: null,
    userName: '',
    email: '',
    avatarUrl: '',
    role: '',
    userIntro: '',
    registerTime: null,
    lastLoginTime: null,
    learningStats: {
      total_learning_hours: 0,
      enrolled_courses: 0,
      courses_completed: 0,
      continuous_days: 0,
      achievement_rate: 0
    }
  }),

  getters: {
    isLoggedIn: (state) => !!state.userId,
    avatar: (state) => state.avatarUrl || '',
    occupation: () => '持续学习者'
  },

  actions: {
    // 检查认证状态
    checkAuth() {
      const token = localStorage.getItem('token')
      return !!token
    },

    // 获取用户信息
    async fetchUserProfile() {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('未找到认证token')
        }

        const res = await fetch(`${API_BASE}/api/personal/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        const data = await res.json()
        
        if (data.success) {
          this.userId = data.data.userId
          this.userName = data.data.userName
          this.email = data.data.email
          this.avatarUrl = data.data.avatarUrl
          this.role = data.data.role
          this.userIntro = data.data.userIntro
          this.registerTime = data.data.registerTime
          this.lastLoginTime = data.data.lastLoginTime
          
          if (data.data.learningStats) {
            this.learningStats = { ...this.learningStats, ...data.data.learningStats }
          }
          
          return data.data
        } else {
          throw new Error(data.message || '获取用户信息失败')
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        throw error
      }
    },

    // 获取学习统计
    async fetchLearningStats() {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_BASE}/api/personal/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        const data = await res.json()
        
        if (data.success) {
          this.learningStats = { ...this.learningStats, ...data.data }
        }
      } catch (error) {
        console.error('获取学习统计失败:', error)
      }
    },

    // 更新个人资料（昵称/邮箱/简介等）
    async updateProfile(payload) {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('未找到认证token')
        }

        const body = {}
        if (payload.userName !== undefined) {
          body.user_name = payload.userName
        }
        if (payload.email !== undefined) {
          body.email = payload.email
        }
        if (payload.userIntro !== undefined) {
          body.user_intro = payload.userIntro
        }

        const res = await fetch(`${API_BASE}/api/personal/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        })

        const data = await res.json()

        if (data.success) {
          if (payload.userName !== undefined) {
            this.userName = payload.userName
          }
          if (payload.email !== undefined) {
            this.email = payload.email
          }
          if (payload.userIntro !== undefined) {
            this.userIntro = payload.userIntro
          }
        } else {
          throw new Error(data.message || '更新个人资料失败')
        }
      } catch (error) {
        console.error('更新个人资料失败:', error)
        throw error
      }
    },

    // 更新用户名
    async updateName(newName) {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_BASE}/api/personal/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ user_name: newName })
        })
        
        const data = await res.json()
        
        if (data.success) {
          this.userName = newName
        } else {
          throw new Error(data.message || '更新用户名失败')
        }
      } catch (error) {
        console.error('更新用户名失败:', error)
        throw error
      }
    },

    // 更新个人简介
    async updateBio(newBio) {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_BASE}/api/personal/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ user_intro: newBio })
        })
        
        const data = await res.json()
        
        if (data.success) {
          this.userIntro = newBio
        } else {
          throw new Error(data.message || '更新个人简介失败')
        }
      } catch (error) {
        console.error('更新个人简介失败:', error)
        throw error
      }
    },

    // 更新头像
    async updateAvatar(avatarUrl) {
      this.avatarUrl = avatarUrl
    },

    // 清除用户数据
    clearUserData() {
      this.userId = null
      this.userName = ''
      this.email = ''
      this.avatarUrl = ''
      this.role = ''
      this.userIntro = ''
      this.registerTime = null
      this.lastLoginTime = null
      this.learningStats = {
        total_learning_hours: 0,
        enrolled_courses: 0,
        courses_completed: 0,
        continuous_days: 0,
        achievement_rate: 0
      }
    }
  }
})
