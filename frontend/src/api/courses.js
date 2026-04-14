import request from '@/utils/request'

// 课程相关API
export const courseAPI = {
  // 获取主页数据
  getHomeData() {
    return request({
      url: '/home',
      method: 'get'
    })
  },

  // 获取课程列表
  getCourses(params) {
    return request({
      url: '/courses',
      method: 'get',
      params
    })
  },

  // 搜索课程
  searchCourses(keyword, params = {}) {
    return request({
      url: '/courses/search',
      method: 'get',
      params: { keyword, ...params }
    })
  },

  // 获取课程详情
  getCourseDetail(courseId) {
    return request({
      url: `/courses/${courseId}`,
      method: 'get'
    })
  },

  // 获取课程分类
  getCategories() {
    return request({
      url: '/categories',
      method: 'get'
    })
  },

  // 获取讲师列表
  getInstructors() {
    return request({
      url: '/instructors',
      method: 'get'
    })
  },

  // 获取课程章节
  getCourseChapters(courseId) {
    return request({
      url: `/courses/${courseId}/chapters`,
      method: 'get'
    })
  },

  // 获取课程统计
  getCourseStats(courseId) {
    return request({
      url: `/courses/${courseId}/stats`,
      method: 'get'
    })
  },

  // 获取课程进度
  getCourseProgress(courseId) {
    return request({
      url: `/courses/${courseId}/progress`,
      method: 'get'
    })
  },

  // 获取视频详情
  getVideoDetail(videoId) {
    return request({
      url: `/courses/video/${videoId}`,
      method: 'get'
    })
  },

  // 获取视频进度
  getVideoProgress(videoId) {
    return request({
      url: `/courses/video/${videoId}/progress`,
      method: 'get'
    })
  },

  // 更新视频进度
  updateVideoProgress(data) {
    return request({
      url: '/courses/video/progress',
      method: 'post',
      data
    })
  },

  // 记录学习行为（视频播放器需要的关键方法）
  recordLearningBehavior(data) {
    console.log('📝 发送学习行为数据到服务器:', data)
    return request({
      url: '/courses/video/behavior',
      method: 'post',
      data
    })
  },

  // 获取用户视频统计
  getUserVideoStats(videoId) {
    return request({
      url: `/courses/video/${videoId}/stats`,
      method: 'get'
    })
  },

  // 课程收藏相关
  getCourseFavoriteStatus: async (courseId) => {
    try {
      console.log(`🔍 获取课程 ${courseId} 收藏状态`)
      
      const token = localStorage.getItem('token')
      if (!token) {
        return { success: false, data: { isFavorite: false }, message: '未登录' }
      }
      
      // 直接调用个人中心的收藏状态接口
      const response = await request({
        url: `/personal/library/${courseId}/status`,
        method: 'get',
        headers: { Authorization: `Bearer ${token}` }
      })
      
      console.log('收藏状态响应:', response)
      return {
        success: response.success,
        data: {
          isFavorite: response.data?.is_enrolled || false
        }
      }
    } catch (error) {
      console.error('获取收藏状态失败:', error)
      return { success: false, data: { isFavorite: false } }
    }
  },

  toggleCourseFavorite: async (courseId, isFavorite = null) => {
    try {
      console.log(`❤️ 切换课程 ${courseId} 收藏状态`)
      
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('未登录')
      }
      
      // 直接调用个人中心的收藏切换接口
      const response = await request({
        url: `/personal/favorites/${courseId}/toggle`,
        method: 'post',
        data: { isFavorite },
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('收藏切换响应:', response)
      return {
        success: response.success,
        data: {
          isFavorite: response.data?.is_favorite
        },
        message: response.message
      }
    } catch (error) {
      console.error('切换收藏状态失败:', error)
      throw error
    }
  },

  // 获取课程评价列表
  getCourseReviews(courseId, limit = 10) {
    return request({
      url: `/courses/${courseId}/reviews`,
      method: 'get',
      params: { limit }
    })
  },

  // 提交课程评价
  submitCourseReview(courseId, rating, reviewContent) {
    return request({
      url: `/courses/${courseId}/reviews`,
      method: 'post',
      data: { rating, reviewContent }
    })
  },

  // 获取相关课程推荐
  getRelatedCourses(courseId, limit = 4) {
    return request({
      url: `/courses/${courseId}/related`,
      method: 'get',
      params: { limit }
    })
  }
}

// 导出为默认导出，同时保持命名导出
export default courseAPI

// 为了方便，也导出所有函数作为命名导出
export const getCourseDetail = courseAPI.getCourseDetail
export const getAllCourses = courseAPI.getCourses
export const searchCourses = courseAPI.searchCourses
export const getCourseChapters = courseAPI.getCourseChapters
export const getCourseStats = courseAPI.getCourseStats
export const getCourseFavoriteStatus = courseAPI.getCourseFavoriteStatus
export const toggleCourseFavorite = courseAPI.toggleCourseFavorite
export const getCourseReviews = courseAPI.getCourseReviews
export const submitCourseReview = courseAPI.submitCourseReview
export const getRelatedCourses = courseAPI.getRelatedCourses
export const getCourseProgress = courseAPI.getCourseProgress

// 视频相关API
export const getVideoDetail = courseAPI.getVideoDetail
export const getVideoProgress = courseAPI.getVideoProgress
export const updateVideoProgress = courseAPI.updateVideoProgress
export const recordLearningBehavior = courseAPI.recordLearningBehavior
export const getUserVideoStats = courseAPI.getUserVideoStats