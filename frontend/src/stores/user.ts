import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  apiUserProfile, 
  apiUpdateBasicInfo, 
  apiUpdateUserDetail, 
  apiUserStats, 
  apiUploadAvatar,
  apiCheckEmail,
  apiCheckPhone
} from '../api/user'

export const useUserStore = defineStore('user', () => {
  // 用户基本信息
  const userId = ref<number | null>(null)
  const userName = ref('')
  const email = ref('')
  const avatarUrl = ref('')
  const role = ref<'learner' | 'instructor' | 'admin'>('learner')
  const isActive = ref(true)
  const registerTime = ref('')
  const lastLoginTime = ref('')

  // 用户详细信息
  const phone = ref('')
  const userIntro = ref('')
  const occupation = ref('')
  const learningGoal = ref('')
  const location = ref('')
  const website = ref('')
  const socialLinks = ref<any>({})

  // 学习统计
  const learningStats = ref({
    total_learning_hours: 0,
    courses_completed: 0,
    courses_in_progress: 0,
    total_courses: 0,
    continuous_days: 0,
    achievements_earned: 0,
    achievements_total: 0,
    achievement_rate: 0
  })

  // 认证状态
  const token = ref<string | null>(localStorage.getItem('token'))
  const isLoggedIn = computed(() => !!token.value)

  // 完整的用户信息（计算属性）
  const userProfile = computed(() => ({
    userId: userId.value,
    userName: userName.value,
    email: email.value,
    avatarUrl: avatarUrl.value,
    role: role.value,
    isActive: isActive.value,
    registerTime: registerTime.value,
    lastLoginTime: lastLoginTime.value,
    phone: phone.value,
    userIntro: userIntro.value,
    occupation: occupation.value,
    learningGoal: learningGoal.value,
    location: location.value,
    website: website.value,
    socialLinks: socialLinks.value
  }))

  // 从 localStorage 初始化用户状态
  function initFromStorage() {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('userData')
    
    if (storedToken) {
      token.value = storedToken
    }
    
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUserData(userData)
      } catch (error) {
        console.error('解析存储的用户数据失败:', error)
        clearStorage()
      }
    }
  }

  // 设置用户数据
  function setUserData(userData: any) {
    if (userData.token) {
      token.value = userData.token
      localStorage.setItem('token', userData.token)
    }

    const user = userData.user || userData
    
    // 修复类型比较问题：确保数字类型
    userId.value = Number(user.user_id || user.id) || null
    userName.value = user.user_name || user.name || ''
    email.value = user.email || ''
    avatarUrl.value = user.avatar_url || user.avatar || ''
    role.value = user.role || 'learner'
    isActive.value = user.is_active !== undefined ? Boolean(user.is_active) : true
    registerTime.value = user.register_time || ''
    lastLoginTime.value = user.last_login_time || ''

    // 用户详情信息
    phone.value = user.phone || ''
    userIntro.value = user.user_intro || user.bio || ''
    occupation.value = user.occupation || ''
    learningGoal.value = user.learning_goal || ''
    location.value = user.location || ''
    website.value = user.website || ''
    socialLinks.value = user.social_links || {}

    // 存储到 localStorage
    localStorage.setItem('userData', JSON.stringify({
      user_id: userId.value,
      user_name: userName.value,
      email: email.value,
      avatar_url: avatarUrl.value,
      role: role.value,
      phone: phone.value,
      user_intro: userIntro.value,
      occupation: occupation.value,
      learning_goal: learningGoal.value,
      location: location.value,
      website: website.value,
      social_links: socialLinks.value
    }))
  }

  // 更新用户基本信息
  async function updateBasicInfo(updateData: any) {
    try {
      const response = await apiUpdateBasicInfo(updateData)
      if (response.data && response.data.status === 'success'){
        // 更新本地状态
        if (updateData.user_name) userName.value = updateData.user_name
        if (updateData.avatar_url) avatarUrl.value = updateData.avatar_url
        
        // 重新存储更新后的数据
        const storedUser = localStorage.getItem('userData')
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          userData.user_name = userName.value
          userData.avatar_url = avatarUrl.value
          localStorage.setItem('userData', JSON.stringify(userData))
        }
        
        return response
      }
    } catch (error) {
      console.error('更新基本信息失败:', error)
      throw error
    }
  }

  // 更新用户详细信息
  async function updateUserDetail(updateData: any) {
    try {
      const response = await apiUpdateUserDetail(updateData)
      if (response.data && response.data.status === 'success') {
        // 更新本地状态
        if (updateData.phone !== undefined) phone.value = updateData.phone
        if (updateData.user_intro !== undefined) userIntro.value = updateData.user_intro
        if (updateData.occupation !== undefined) occupation.value = updateData.occupation
        if (updateData.learning_goal !== undefined) learningGoal.value = updateData.learning_goal
        if (updateData.location !== undefined) location.value = updateData.location
        if (updateData.website !== undefined) website.value = updateData.website
        if (updateData.social_links !== undefined) socialLinks.value = updateData.social_links
        
        // 重新存储更新后的数据
        const storedUser = localStorage.getItem('userData')
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          Object.assign(userData, updateData)
          localStorage.setItem('userData', JSON.stringify(userData))
        }
        
        return response
      }
    } catch (error) {
      console.error('更新用户详情失败:', error)
      throw error
    }
  }

  // 获取用户学习统计
  async function fetchLearningStats() {
    try {
      const response = await apiUserStats()
      if (response.data && response.data.status === 'success') {
        learningStats.value = response.data
        return learningStats.value
      }
    } catch (error) {
      console.error('获取学习统计失败:', error)
      throw error
    }
  }

  // 获取完整的用户资料
  async function fetchUserProfile() {
    try {
      const response = await apiUserProfile()
      if (response.data && response.data.status === 'success') {
        setUserData(response.data)
        return userProfile.value
      }
    } catch (error) {
      console.error('获取用户资料失败:', error)
      throw error
    }
  }

  // 上传头像
  async function uploadAvatar(file: File) {
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      
      const response = await apiUploadAvatar(formData)
      if (response.data && response.data.status === 'success') {
        avatarUrl.value = response.data.avatar_url
        
        // 更新 localStorage
        const storedUser = localStorage.getItem('userData')
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          userData.avatar_url = avatarUrl.value
          localStorage.setItem('userData', JSON.stringify(userData))
        }
        
        return response.data
      }
    } catch (error) {
      console.error('上传头像失败:', error)
      throw error
    }
  }

  // 检查邮箱是否可用
  async function checkEmailAvailability(email: string, currentUserId?: number) {
    try {
      const response = await apiCheckEmail(email, currentUserId)
      return response.data
    } catch (error) {
      console.error('检查邮箱失败:', error)
      throw error
    }
  }

  // 检查手机号是否可用
  async function checkPhoneAvailability(phone: string, currentUserId?: number) {
    try {
      const response = await apiCheckPhone(phone, currentUserId)
      return response.data
    } catch (error) {
      console.error('检查手机号失败:', error)
      throw error
    }
  }

  // 退出登录
  function logout() {
    userId.value = null
    userName.value = ''
    email.value = ''
    avatarUrl.value = ''
    role.value = 'learner'
    isActive.value = true
    registerTime.value = ''
    lastLoginTime.value = ''
    
    phone.value = ''
    userIntro.value = ''
    occupation.value = ''
    learningGoal.value = ''
    location.value = ''
    website.value = ''
    socialLinks.value = {}
    
    learningStats.value = {
      total_learning_hours: 0,
      courses_completed: 0,
      courses_in_progress: 0,
      total_courses: 0,
      continuous_days: 0,
      achievements_earned: 0,
      achievements_total: 0,
      achievement_rate: 0
    }
    
    token.value = null
    clearStorage()
  }

  // 清除本地存储
  function clearStorage() {
    localStorage.removeItem('token')
    localStorage.removeItem('userData')
  }

  // 检查认证状态
  function checkAuth() {
    const storedToken = localStorage.getItem('token')
    if (storedToken && !token.value) {
      token.value = storedToken
      initFromStorage()
      return true
    }
    return !!token.value
  }

  // 便捷方法 - 为了兼容性添加
  const updateBio = async (newBio: string) => {
    return await updateUserDetail({ user_intro: newBio })
  }

  const updateName = async (newName: string) => {
    return await updateBasicInfo({ user_name: newName })
  }

  const updateAvatar = async (newAvatar: string) => {
    return await updateBasicInfo({ avatar_url: newAvatar })
  }

  // 初始化
  initFromStorage()

  return {
    // 状态
    userId,
    userName,
    email,
    avatarUrl,
    role,
    isActive,
    registerTime,
    lastLoginTime,
    phone,
    userIntro,
    occupation,
    learningGoal,
    location,
    website,
    socialLinks,
    learningStats,
    token,
    
    // 计算属性
    isLoggedIn,
    userProfile,
    
    // 方法
    setUserData,
    updateBasicInfo,
    updateUserDetail,
    fetchLearningStats,
    fetchUserProfile,
    uploadAvatar,
    checkEmailAvailability,
    checkPhoneAvailability,
    logout,
    checkAuth,
    initFromStorage,
    
    // 便捷方法
    updateBio,
    updateName,
    updateAvatar
  }
})