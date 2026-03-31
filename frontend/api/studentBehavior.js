import request from '@/utils/request'

export default {
  // 获取概览数据（包含课程列表）
  getOverview() {
    return request({
      url: '/student/behavior/overview',
      method: 'get'
    })
  },

  // 获取学习建议
  getLearningSuggestions() {
    return request({
      url: '/student/behavior/suggestions',
      method: 'get'
    })
  },

  // 获取课程详细分析
  getCourseAnalysis(courseId) {
    return request({
      url: `/student/behavior/course/${courseId}`,
      method: 'get'
    })
  },

  // 获取学习趋势
  getLearningTrend(period = '7d') {
    return request({
      url: '/student/behavior/trend',
      method: 'get',
      params: { period }
    })
  },

  // 获取倍速播放使用情况 - 新增API
  getPlaybackSpeedUsage(courseId = 'overall') {
    const params = {}
    if (courseId && courseId !== 'overall') {
      params.courseId = courseId
    }

    return request({
      url: '/student/behavior/speed-usage',
      method: 'get',
      params
    })
  },

  // 获取不同课程倍速偏好
  getCourseSpeedPreference(courseId) {
    return request({
      url: `/student/behavior/course/${courseId}/speed-preference`,
      method: 'get'
    })
  },

  // 获取用户个人倍速习惯统计
  getUserSpeedHabits(period = '30d') {
    return request({
      url: '/student/behavior/speed-habits',
      method: 'get',
      params: { period }
    })
  },

  // 获取倍速与学习效果关联分析
  getSpeedLearningCorrelation(courseId) {
    const params = {}
    if (courseId) {
      params.courseId = courseId
    }

    return request({
      url: '/student/behavior/speed-learning-correlation',
      method: 'get',
      params
    })
  },

  // 更新目标进度
  updateGoalProgress(goalId, currentValue) {
    return request({
      url: `/student/behavior/goal/${goalId}`,
      method: 'put',
      data: { currentValue }
    })
  },

  // 更新用户倍速偏好设置
  updateSpeedPreference(preferenceData) {
    return request({
      url: '/student/behavior/speed-preference',
      method: 'post',
      data: preferenceData
    })
  },

  // 批量获取多个课程倍速数据
  getBatchSpeedAnalysis(courseIds) {
    return request({
      url: '/student/behavior/batch-speed-analysis',
      method: 'post',
      data: { courseIds }
    })
  }
}