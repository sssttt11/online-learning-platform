import request from '@/utils/request'

// 课程相关API
export const getCourseDetail = (courseId) => {
  return request.get(`/courses/${courseId}`)
}

export const getAllCourses = () => {
  return request.get('/courses')
}

export const searchCourses = (keyword) => {
  return request.get('/courses/search', { params: { q: keyword } })
}

export const getCourseChapters = (courseId) => {
  return request.get(`/courses/${courseId}/chapters`)
}

export const getCourseStats = (courseId) => {
  return request.get(`/courses/${courseId}/stats`)
}

// 课程收藏相关
export const getCourseFavoriteStatus = async (courseId) => {
  try {
    console.log(`🔍 获取课程 ${courseId} 收藏状态`)
    
    const token = localStorage.getItem('token')
    if (!token) {
      return { success: false, data: { isFavorite: false }, message: '未登录' }
    }
    
    // 直接调用个人中心的收藏状态接口
    const response = await axios.get(`/personal/library/${courseId}/status`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    console.log('收藏状态响应:', response.data)
    return {
      success: response.data.success,
      data: {
        isFavorite: response.data.data?.is_enrolled || false
      }
    }
  } catch (error) {
    console.error('获取收藏状态失败:', error)
    return { success: false, data: { isFavorite: false } }
  }
}

export const toggleCourseFavorite = async (courseId, isFavorite = null) => {
  try {
    console.log(`❤️ 切换课程 ${courseId} 收藏状态`)
    
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('未登录')
    }
    
    // 直接调用个人中心的收藏切换接口
    const response = await axios.post(`/personal/favorites/${courseId}/toggle`, 
      { isFavorite },
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    console.log('收藏切换响应:', response.data)
    return {
      success: response.data.success,
      data: {
        isFavorite: response.data.data?.is_favorite
      },
      message: response.data.message
    }
  } catch (error) {
    console.error('切换收藏状态失败:', error)
    throw error
  }
}

// 获取课程评价列表
export const getCourseReviews = (courseId, limit = 10) => {
  return request.get(`/courses/${courseId}/reviews`, { params: { limit } })
}

// 提交课程评价
export const submitCourseReview = (courseId, rating, reviewContent) => {
  return request.post(`/courses/${courseId}/reviews`, { rating, reviewContent })
}

// 获取相关课程推荐
export const getRelatedCourses = (courseId, limit = 4) => {
  return request.get(`/courses/${courseId}/related`, { params: { limit } })
}

export const getCourseProgress = (courseId) => {
  return request.get(`/courses/${courseId}/progress`)
}

// 视频相关API
export const getVideoDetail = (videoId) => {
  return request.get(`/courses/video/${videoId}`)
}

export const getVideoProgress = (videoId) => {
  return request.get(`/courses/video/${videoId}/progress`)
}

export const updateVideoProgress = (data) => {
  return request.post('/courses/video/progress', data)
}

// 学习行为记录API
export const recordLearningBehavior = (data) => {
  console.log('📝 发送学习行为数据:', data)
  return request.post('/courses/video/behavior', data)
}

// 获取用户视频学习统计
export const getUserVideoStats = (videoId) => {
  return request.get(`/courses/video/${videoId}/stats`)
}

// 不再直接导入deepseek，使用后端API

// AI助手相关API
export const getAISummary = async (videoId) => {
  try {
    // 获取视频字幕或转写文本
    const { data: videoData } = await request.get(`/api/videos/${videoId}/transcript`)
    
    // 调用后端API获取摘要
    const response = await request.post(`/api/ai/videos/${videoId}/summary`, {
      videoId,
      transcript: videoData.transcript
    })
    
    return response.data
  } catch (error) {
    console.error('获取AI总结失败:', error)
    throw error
  }
}

export const getAIHighlights = async (videoId) => {
  try {
    // 获取视频字幕或转写文本
    const { data: videoData } = await request.get(`/api/videos/${videoId}/transcript`)
    
    // 调用后端API获取重点
    const response = await request.post(`/api/ai/videos/${videoId}/highlights`, {
      videoId,
      transcript: videoData.transcript
    })
    
    return response.data
  } catch (error) {
    console.error('获取重点标记失败:', error)
    throw error
  }
}

export const getAIQuiz = async (videoId) => {
  try {
    // 获取视频元数据和内容
    const { data: videoData } = await request.get(`/api/videos/${videoId}`)
    
    // 调用后端API生成测验
    const response = await request.post(`/api/ai/videos/${videoId}/quiz`, {
      videoId,
      content: videoData.description || ''
    })
    
    // 格式化返回数据，匹配前端预期格式
    return {
      data: response.data.map((q, i) => ({
        quiz_id: `quiz-${i}`,
        question_text: q.question,
        options: q.options.map((opt, idx) => ({
          option_id: `opt-${i}-${idx}`,
          option_text: opt,
          is_correct: idx === q.correctIndex
        }))
      }))
    }
  } catch (error) {
    console.error('生成测验失败:', error)
    throw error
  }
}

export const submitAIQuestion = async (data) => {
  try {
    // 获取相关课程内容作为上下文
    const { data: contextData } = await request.get(`/api/videos/${data.videoId}/context`)
    
    // 调用后端API获取回答
    const response = await request.post('/api/ai/ask', {
      videoId: data.videoId,
      courseId: data.courseId,
      message: data.message,
      context: contextData.content
    })
    
    return response.data
  } catch (error) {
    console.error('提交问题失败:', error)
    throw error
  }
}

// 学习行为类型常量
export const BEHAVIOR_TYPES = {
  PLAY: 'play',
  PAUSE: 'pause', 
  SEEK: 'seek',
  COMPLETE: 'complete',
  SPEED_CHANGE: 'speed_change',
  ENTER_FULLSCREEN: 'enter_fullscreen',
  EXIT_FULLSCREEN: 'exit_fullscreen'
}

// 工具函数：创建学习行为数据
export const createBehaviorData = (videoId, behaviorType, extraData = {}) => {
  return {
    videoId,
    behaviorType,
    timestamp: new Date().toISOString(),
    ...extraData
  }
}

// 工具函数：简化行为记录器
export const createBehaviorRecorder = () => {
  let timeoutId = null
  
  return {
    // 直接记录单个行为
    addBehavior: async (videoId, behaviorData, immediate = false) => {
      try {
        // 直接调用单个行为记录API
        await recordLearningBehavior(behaviorData)
        console.log('✅ 记录学习行为:', behaviorData.behaviorType)
      } catch (error) {
        console.error('记录学习行为失败:', error)
      }
    },
    
    // 空方法保持兼容
    flush: () => Promise.resolve(),
    getQueueLength: () => 0,
    clear: () => {
      clearTimeout(timeoutId)
    }
  }
}

// 修改createStandardBehavior函数，确保包含courseId
export const createStandardBehavior = (videoId, courseId, behaviorType, videoState = {}) => {
  const {
    currentTime = 0,
    duration = 0,
    playSpeed = 1.0,
    progress = 0
  } = videoState

  return {
    videoId: parseInt(videoId),
    courseId: parseInt(courseId),
    behaviorType,
    currentTime: Math.floor(currentTime),
    duration: Math.floor(duration),
    playSpeed: parseFloat(playSpeed),
    progress: Math.floor(progress),
    timestamp: new Date().toISOString()
  }
}

// 添加一个专门记录倍速的函数
export const recordSpeedChange = (videoId, courseId, speed, videoState = {}) => {
  const behaviorData = {
    videoId,
    courseId,
    behaviorType: 'speed_change',
    playSpeed: parseFloat(speed),
    currentTime: Math.floor(videoState.currentTime || 0),
    duration: Math.floor(videoState.duration || 0),
    progress: Math.floor(videoState.progress || 0),
    timestamp: new Date().toISOString()
  }
  
  console.log('🎚️ 记录倍速变化:', behaviorData)
  return recordLearningBehavior(behaviorData)
}

// 预定义的行为记录函数
export const BehaviorRecorder = {
  // 播放行为
  recordPlay: (videoId, courseId, videoState) => {
    const behaviorData = createStandardBehavior(videoId, courseId, 'play', videoState)
    return recordLearningBehavior(behaviorData)
  },
  
  // 暂停行为
  recordPause: (videoId, courseId, videoState) => {
    const behaviorData = createStandardBehavior(videoId, courseId, 'pause', videoState)
    return recordLearningBehavior(behaviorData)
  },
  
  // 完成行为
  recordComplete: (videoId, courseId, videoState) => {
    const behaviorData = createStandardBehavior(videoId, courseId, 'complete', videoState)
    return recordLearningBehavior(behaviorData)
  },
  
  // 跳转行为
  recordSeek: (videoId, courseId, videoState, seekInfo = {}) => {
    const behaviorData = createStandardBehavior(videoId, courseId, 'seek', {
      ...videoState,
      ...seekInfo
    })
    return recordLearningBehavior(behaviorData)
  },
  
  // 倍速变化行为 - 专门记录倍速
  recordSpeedChange: async (videoId, courseId, newSpeed, videoState = {}) => {
    const behaviorData = {
      videoId,
      courseId,
      behaviorType: 'speed_change',
      playSpeed: parseFloat(newSpeed),
      currentTime: Math.floor(videoState.currentTime || 0),
      duration: Math.floor(videoState.duration || 0),
      progress: Math.floor(videoState.progress || 0),
      timestamp: new Date().toISOString()
    }
    
    console.log('🎚️ 记录倍速变化:', behaviorData)
    return await recordLearningBehavior(behaviorData)
  }
}

// 批量操作工具
export const BatchBehavior = {
  // 批量记录行为（简单实现）
  recordMultiple: async (behaviors) => {
    const results = []
    for (const behavior of behaviors) {
      try {
        const result = await recordLearningBehavior(behavior)
        results.push({ success: true, behavior: behavior.behaviorType })
      } catch (error) {
        results.push({ success: false, behavior: behavior.behaviorType, error })
      }
    }
    return results
  },
  
  // 创建批量行为数据
  createBatch: (videoId, behaviorList, videoState = {}) => {
    return behaviorList.map(behaviorType => 
      createStandardBehavior(videoId, behaviorType, videoState)
    )
  }
}

// 调试工具
export const DebugUtils = {
  // 打印行为数据（开发环境使用）
  logBehavior: (behaviorData) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 学习行为数据:', {
        videoId: behaviorData.videoId,
        behaviorType: behaviorData.behaviorType,
        currentTime: behaviorData.currentTime,
        progress: behaviorData.progress,
        timestamp: behaviorData.timestamp
      })
    }
  },
  
  // 验证行为数据
  validateBehavior: (behaviorData) => {
    const errors = []
    
    if (!behaviorData.videoId || isNaN(behaviorData.videoId)) {
      errors.push('videoId 无效')
    }
    
    if (!behaviorData.behaviorType || !Object.values(BEHAVIOR_TYPES).includes(behaviorData.behaviorType)) {
      errors.push('behaviorType 无效')
    }
    
    if (behaviorData.currentTime === undefined || isNaN(behaviorData.currentTime)) {
      errors.push('currentTime 无效')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

export default {
  // 课程相关
  getCourseDetail,
  getAllCourses,
  searchCourses,
  getCourseChapters,
  getCourseStats,
  getCourseFavoriteStatus,
  toggleCourseFavorite,
  getCourseReviews,
  submitCourseReview,
  getRelatedCourses,
  getCourseProgress,
  
  // 视频相关
  getVideoDetail,
  getVideoProgress,
  updateVideoProgress,
  
  // 学习行为相关
  recordLearningBehavior,
  getUserVideoStats,
  
  // AI相关
  getAISummary,
  getAIHighlights,
  getAIQuiz,
  submitAIQuestion,
  
  // 工具函数
  BEHAVIOR_TYPES,
  createBehaviorData,
  createBehaviorRecorder,
  createStandardBehavior,
  BehaviorRecorder,
  BatchBehavior,
  DebugUtils
}