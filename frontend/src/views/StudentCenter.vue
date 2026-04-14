<template>
  <div class="student-center">
    <!-- 头像弹窗 -->
    <AvatarModal v-model="showAvatar" @avatar-updated="handleAvatarUpdate" />
    <!-- 设置弹窗 -->
    <SettingsModal v-model="showSettings" />
    <!-- 个人资料编辑弹窗 -->
    <EditProfileModal 
      v-model="showEditProfile"
      :user-name="user.userName"
      :email="user.email"
      :user-intro="user.userIntro"
      @save="handleProfileUpdate"
    />
    <!-- 个人头部 -->
    <div class="container">
      <div class="profile-header">
        <!-- 背景装饰 -->
        <div class="profile-bg-decoration">
          <div class="decoration-circle circle-1"></div>
          <div class="decoration-circle circle-2"></div>
          <div class="decoration-circle circle-3"></div>
        </div>
        
        <button class="settings-btn" title="账户设置" @click="showSettings=true">
          <i class="fas fa-cog"></i>
        </button>
        <button class="edit-profile-btn" title="编辑个人资料" @click="showEditProfile=true">
          <i class="fas fa-user-edit"></i>
        </button>
        
        <!-- 左侧：头像区域 -->
        <div class="profile-left">
          <div class="profile-avatar" @click="showAvatar=true">
            <img v-if="user.avatarUrl" :src="user.avatarUrl" :alt="user.userName"/>
            <span v-else>{{ user.userName?.charAt(0) || '学' }}</span>
            <div class="avatar-edit-overlay"><i class="fas fa-camera"></i></div>
            <!-- 在线状态指示 -->
            <div class="online-indicator"></div>
          </div>
          <!-- 用户等级徽章 -->
          <div class="user-level">
            <i class="fas fa-star"></i>
            <span>Lv.{{ userLevel }}</span>
          </div>
        </div>
        
        <!-- 右侧：用户信息 -->
        <div class="profile-info">
          <div class="profile-name-row">
            <h1>{{ user.userName || '未设置用户名' }}</h1>
            <!-- 身份标签 -->
            <div class="user-badges">
              <span class="badge badge-learner"><i class="fas fa-graduation-cap"></i> 学习者</span>
              <span v-if="user.learningStats?.continuous_days >= 7" class="badge badge-streak">
                <i class="fas fa-fire"></i> {{ user.learningStats?.continuous_days }}天连续
              </span>
            </div>
          </div>
          <p class="user-title">{{ user.occupation || '持续学习者' }}</p>
          
          <!-- 个性签名 - 美化版 -->
          <div class="profile-bio-wrapper">
            <span class="quote-mark quote-left">"</span>
            <div class="profile-bio">
              {{ user.userIntro || '这个人很懒，什么都没有写～' }}
            </div>
            <span class="quote-mark quote-right">"</span>
          </div>
          
          <!-- 快捷统计 -->
          <div class="profile-quick-stats">
            <div class="quick-stat">
              <i class="fas fa-clock"></i>
              <span class="stat-num">{{ user.learningStats?.total_learning_hours || 0 }}</span>
              <span class="stat-unit">小时</span>
            </div>
            <div class="quick-stat">
              <i class="fas fa-book-open"></i>
              <span class="stat-num">{{ user.learningStats?.enrolled_courses || 0 }}</span>
              <span class="stat-unit">课程</span>
            </div>
            <div class="quick-stat">
              <i class="fas fa-trophy"></i>
              <span class="stat-num">{{ achievements.length || 0 }}</span>
              <span class="stat-unit">成就</span>
            </div>
            <div class="quick-stat">
              <i class="fas fa-heart"></i>
              <span class="stat-num">{{ collectList.length || 0 }}</span>
              <span class="stat-unit">收藏</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 可点击标签 -->
      <div class="tabs-container">
        <div class="tabs">
          <div
            v-for="t in tabs"
            :key="t.key"
            class="tab"
            :class="{ active: activeTab === t.key }"
            @click="activeTab = t.key"
          >
            {{ t.label }}
          </div>
        </div>
      </div>

      <!-- 下方内容：点谁显谁 -->
      <!-- 1. 学情分析 -->
      <section v-if="activeTab === 'analysis'" class="content-section">
        <h2 class="section-title">
          学情分析
          <button @click="goToBehaviorAnalysis" class="btn btn-link">
            查看更多 <i class="fas fa-arrow-right"></i>
          </button>
        </h2>
        
        <div class="stats-grid">
          <div class="stat-card"><div class="value">{{ user.learningStats?.total_learning_hours || 0 }}h</div><div class="label">总学习时长</div></div>
          <div class="stat-card"><div class="value">{{ user.learningStats?.enrolled_courses || 0 }}</div><div class="label">已学课程</div></div>
          <div class="stat-card"><div class="value">{{ user.learningStats?.continuous_days || 0 }}</div><div class="label">连续学习天数</div></div>
          <div class="stat-card"><div class="value">{{ user.learningStats?.achievement_rate || 0 }}%</div><div class="label">成就达成率</div></div>
        </div>
      </section>

      <!-- 2. 我的学习库 -->
      <section v-if="activeTab === 'library'" class="content-section">
        <h2 class="section-title">我的学习库 <button class="more-btn">查看全部 <i class="fas fa-chevron-right"></i></button></h2>
        <div class="courses-grid">
          <div v-for="course in libraryList" :key="course.id" class="course-card">
            <div class="course-image" :style="{background: course.bg || 'linear-gradient(135deg,#a8edea,#fed6e3)'}"></div>
            <div class="course-content">
              <h3 class="course-title">{{ course.title || course.name }}</h3>
              <p>{{ course.desc || course.description }}</p>
              <div class="course-meta">添加于 {{ course.add_time || course.date }}</div>
              <div class="course-progress" v-if="course.progress > 0">
                <div class="progress-bar"><div class="progress-fill" :style="{width: (course.progress || 0)+'%'}"></div></div>
                <div class="progress-text">{{ course.progress || 0 }}% 已完成</div>
              </div>
              <div class="course-actions">
                <button class="action-btn primary" @click="goToCourse(course.id)">开始学习</button>
                <button class="action-btn outline" @click="removeFromLibrary(course.id)">移除</button>
              </div>
            </div>
          </div>
          <div v-if="libraryList.length === 0" class="empty-state">
            <i class="fas fa-bookmark"></i>
            <p>学习库空空如也</p>
            <p class="empty-hint">将感兴趣的课程添加到学习库，随时随地开始学习</p>
            <button class="browse-btn" @click="$router.push('/search')">浏览课程</button>
          </div>
        </div>
      </section>

      <!-- 3. 我的收藏 -->
      <section v-if="activeTab === 'collect'" class="content-section">
        <h2 class="section-title">收藏的课程 <button class="more-btn">查看全部 <i class="fas fa-chevron-right"></i></button></h2>
        <div class="courses-grid">
          <div v-for="course in collectList" :key="course.id" class="course-card">
            <div class="course-image" :style="{background: course.bg || 'linear-gradient(135deg,#ffecd2,#fcb69f)'}"></div>
            <div class="course-content">
              <h3 class="course-title">{{ course.title || course.name }}</h3>
              <p>{{ course.desc || course.description }}</p>
              <div class="course-meta">收藏于 {{ course.collect_time || course.date }}</div>
              <div class="course-actions">
                <button class="action-btn primary" @click="goToCourse(course.id)">查看课程</button>
                <button class="action-btn outline" @click="removeFromFavorites(course.id)">取消收藏</button>
              </div>
            </div>
          </div>
          <div v-if="collectList.length === 0" class="empty-state">
            <i class="fas fa-heart"></i>
            <p>还没有收藏任何课程</p>
            <button class="browse-btn" @click="$router.push('/search')">发现课程</button>
          </div>
        </div>
      </section>

      <!-- 4. 我的社区 -->
      <section v-if="activeTab === 'community'" class="content-section">
        <h2 class="section-title">我的社区 <button class="more-btn" @click="goToCommunity">探索更多 <i class="fas fa-chevron-right"></i></button></h2>
        <!-- 社区统计 -->
        <div class="community-stats">
          <div class="stat-card"><div class="value">3</div><div class="label">活跃组队</div></div>
          <div class="stat-card"><div class="value">2</div><div class="label">自习室</div></div>
          <div class="stat-card"><div class="value">28</div><div class="label">讨论帖子</div></div>
          <div class="stat-card"><div class="value">156</div><div class="label">互动次数</div></div>
        </div>
        <!-- 我的组队 -->
        <div class="community-section">
          <h3 class="subsection-title"><i class="fas fa-users"></i> 我的组队</h3>
          <div class="teams-grid">
            <div class="team-card">
              <div class="team-header"><h4 class="team-name">React学习小组</h4><span class="team-status active">进行中</span></div>
              <p class="team-desc">共同学习React高级特性和最佳实践</p>
              <div class="team-members">
                <div class="member-avatars"><div class="member-avatar">张</div><div class="member-avatar">李</div><div class="member-avatar">王</div><div class="member-avatar">+2</div></div>
                <span class="member-count">5人</span>
              </div>
              <div class="team-progress">
                <div class="progress-bar"><div class="progress-fill" style="width:60%"></div></div>
                <span class="progress-text">60% 完成</span>
              </div>
              <div class="team-actions"><button class="action-btn primary">进入小组</button><button class="action-btn">管理</button></div>
            </div>
          </div>
        </div>
      </section>

      <!-- 5. 我的成就 -->
      <section v-if="activeTab === 'achievement'" class="content-section">
        <h2 class="section-title">已获得成就 <button class="more-btn">查看全部 <i class="fas fa-chevron-right"></i></button></h2>
        <div class="achievements-grid">
          <div v-for="achievement in achievements" :key="achievement.id" class="achievement-card">
            <div class="achievement-icon"><i :class="achievement.icon || 'fas fa-trophy'"></i></div>
            <h3 class="achievement-title">{{ achievement.title || achievement.name }}</h3>
            <p class="achievement-desc">{{ achievement.description || achievement.desc }}</p>
          </div>
          <div v-if="achievements.length === 0" class="empty-state">
            <i class="fas fa-trophy"></i>
            <p>还没有获得任何成就</p>
            <p class="empty-hint">继续学习，解锁更多成就吧！</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user.js'
import AvatarModal from '../components/AvatarModal.vue'
import SettingsModal from '../components/SettingsModal.vue'
import EditProfileModal from '../components/EditProfileModal.vue'

const router = useRouter()

/* 用户状态 */
const user = useUserStore()
// 公共 API 基址和 token 获取
const API_BASE = 'http://localhost:4000'
const getToken = () => localStorage.getItem('token')
const showAvatar = ref(false)
const showSettings = ref(false)
const showEditProfile = ref(false)

/* 标签数据 */
const activeTab = ref('analysis')
const tabs = [
  { key: 'analysis', label: '学情分析' },
  { key: 'library', label: '我的学习库' },
  { key: 'collect', label: '我的收藏' },
  { key: 'community', label: '我的社区' },
  { key: 'achievement', label: '我的成就' }
]

/* 动态数据 */
const stats = ref({})
const learningList = ref([])
const collectList = ref([])
const libraryList = ref([]) // 新增：学习库列表
const communityData = ref({})
const achievements = ref([])

/* 计算用户等级 - 基于学习时长 */
const userLevel = ref(1)
const calculateLevel = () => {
  const hours = user.learningStats?.total_learning_hours || 0
  if (hours >= 500) userLevel.value = 10
  else if (hours >= 300) userLevel.value = 8
  else if (hours >= 150) userLevel.value = 6
  else if (hours >= 80) userLevel.value = 5
  else if (hours >= 40) userLevel.value = 4
  else if (hours >= 20) userLevel.value = 3
  else if (hours >= 10) userLevel.value = 2
  else userLevel.value = 1
}

/* 方法 */

// 跳转到课程
const goToCourse = (courseId) => {
  router.push(`/course/${courseId}`)
}

const goToBehaviorAnalysis = () => {
  router.push('/personal/learning-analysis/behavior')
}

const goToCommunity = () => {
  router.push('/community')
}

// 从学习库移除
const removeFromLibrary = async (courseId) => {
  if (!confirm('确定要从学习库中移除该课程吗？这将取消报名。')) return
  
  try {
    const token = getToken()
    console.log(`🗑️ 移除课程 ${courseId}，调用接口: ${API_BASE}/api/personal/library/${courseId}/toggle`)

    const res = await fetch(`${API_BASE}/api/personal/library/${courseId}/toggle`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await res.json()
    
    console.log('📦 移除响应:', data)
    
    if (data.success) {
      alert(data.message || '已从学习库中移除')
      loadLibraryCourses() // 重新加载学习库
    } else {
      throw new Error(data.message || '移除失败')
    }
  } catch (error) {
    console.error('从学习库移除失败:', error)
    alert('移除失败：' + error.message)
  }
}

// 从收藏中移除
const removeFromFavorites = async (courseId) => {
  if (!confirm('确定要取消收藏该课程吗？')) return
  
  try {
    const token = getToken()

    const res = await fetch(`${API_BASE}/api/personal/favorites/${courseId}/toggle`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await res.json()
    
    if (data.success) {
      alert('已取消收藏')
      loadCollectCourses() // 重新加载收藏列表
    } else {
      throw new Error(data.message || '取消收藏失败')
    }
  } catch (error) {
    console.error('取消收藏失败:', error)
    alert('取消收藏失败：' + error.message)
  }
}

// 加载学习库课程
const loadLibraryCourses = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      libraryList.value = []
      return
    }
    
    console.log('📚 加载学习库课程，调用接口:', `${API_BASE}/api/personal/library`)

    const res = await fetch(`${API_BASE}/api/personal/library`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await res.json()
    
    console.log('📦 学习库响应数据:', data)
    
    if (data.success) {
      libraryList.value = data.data.map(course => ({
        id: course.course_id,
        title: course.course_name,
        description: course.course_desc,
        progress: course.progress || 0,
        add_time: course.enroll_time ? new Date(course.enroll_time).toLocaleDateString() : '未知时间',
        // 处理封面图片
        bg: course.cover_img 
          ? (course.cover_img.startsWith('http')
              ? `url(${course.cover_img})`
              : `url(${API_BASE}${course.cover_img})`)
          : 'linear-gradient(135deg, #a8edea, #fed6e3)'
      }))
      console.log(`✅ 加载到 ${libraryList.value.length} 门课程`)
    } else {
      console.warn('获取学习库课程失败:', data.message)
      libraryList.value = []
    }
  } catch (error) {
    console.error('❌ 加载学习库课程失败:', error)
    libraryList.value = []
  }
}

// 加载收藏课程
const loadCollectCourses = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      collectList.value = []
      return
    }
    
    console.log('❤️ 加载收藏课程，调用接口:', `${API_BASE}/api/personal/favorites`)

    const res = await fetch(`${API_BASE}/api/personal/favorites`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    // 检查响应状态
    if (!res.ok) {
      console.error(`❌ 收藏接口返回错误状态: ${res.status} ${res.statusText}`)
      collectList.value = []
      return
    }
    
    const data = await res.json()
    
    console.log('📦 收藏接口响应数据:', data)
    console.log('📦 响应数据结构检查:');
    console.log('- data.success:', data.success);
    console.log('- data.data 类型:', typeof data.data);
    console.log('- data.data 值:', data.data);
    
    if (data.success) {
      // 确保 data.data 是数组
      const courses = Array.isArray(data.data) ? data.data : []
      console.log(`✅ 找到 ${courses.length} 门收藏课程`)
      
      // 调试：查看第一门课程的字段
      if (courses.length > 0) {
        console.log('📋 第一门课程字段:', Object.keys(courses[0]))
        console.log('📋 第一门课程详情:', courses[0])
      }
      
      collectList.value = courses.map(course => {
        // 提取课程信息，处理可能的字段名不同情况
        const courseInfo = {
          id: course.course_id || course.id,
          title: course.course_name || course.title || '未命名课程',
          description: course.course_desc || course.description || course.course_desc || '暂无描述',
          progress: course.progress || 0,
          collect_time: course.enroll_time 
            ? new Date(course.enroll_time).toLocaleDateString()
            : (course.updated_at 
                ? new Date(course.updated_at).toLocaleDateString()
                : '未知时间'),
          // 处理封面图片
          bg: getCourseCover(course)
        }
        
        console.log('📝 课程信息处理结果:', courseInfo)
        return courseInfo
      })
      
      console.log(`✅ 成功加载 ${collectList.value.length} 门收藏课程到界面`)
    } else {
      console.warn('获取收藏课程失败:', data.message)
      collectList.value = []
    }
  } catch (error) {
    console.error('❌ 加载收藏课程失败:', error)
    collectList.value = []
  }
}

// 辅助函数：获取课程封面
const getCourseCover = (course) => {
  const API_BASE = 'http://localhost:4000'
  
  // 尝试多种可能的封面字段
  let coverImg = course.cover_img || course.image || course.bg_image
  
  if (coverImg) {
    // 处理相对路径和绝对路径
    if (coverImg.startsWith('http')) {
      return `url(${coverImg})`
    } else if (coverImg.startsWith('/')) {
      return `url(${API_BASE}${coverImg})`
    } else {
      return `url(${API_BASE}/uploads/${coverImg})`
    }
  }
  
  // 使用默认渐变背景
  return 'linear-gradient(135deg,#ffecd2,#fcb69f)'
}

// 加载已获取的成就
const loadAchievements = async () => {
  try {
    const token = getToken()
    console.log('🏆 加载成就，调用接口:', `${API_BASE}/api/personal/achievements`)
    const res = await fetch(`${API_BASE}/api/personal/achievements`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    })

    if (!res.ok) {
      console.warn('成就接口返回错误状态:', res.status)
      achievements.value = []
      return
    }

    const data = await res.json()
    if (data && data.success && Array.isArray(data.data)) {
      achievements.value = data.data.map(a => ({
        id: a.id || a.achievement_id || a.key,
        title: a.title || a.name || a.label,
        description: a.description || a.desc || '',
        icon: a.icon || a.icon_class || 'fas fa-trophy'
      }))
      console.log(`🏆 加载到 ${achievements.value.length} 个成就`)
    } else {
      achievements.value = []
    }
  } catch (error) {
    console.error('加载成就失败:', error)
    achievements.value = []
  }
}

// 加载用户的学习列表（在个人中心显示）
const loadLearningList = async () => {
  try {
    const token = getToken()
    console.log('📘 加载我的学习列表，调用接口:', `${API_BASE}/api/personal/my-courses`)
    const res = await fetch(`${API_BASE}/api/personal/my-courses`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    })

    if (!res.ok) {
      console.warn('我的课程接口返回错误状态:', res.status)
      learningList.value = []
      return
    }

    const data = await res.json()
    if (data && data.success && Array.isArray(data.data)) {
      learningList.value = data.data.map(c => ({
        id: c.course_id || c.id,
        title: c.course_name || c.title || c.name,
        desc: c.course_desc || c.description || '',
        progress: c.progress || c.completion_rate || 0,
        add_time: c.enroll_time ? new Date(c.enroll_time).toLocaleDateString() : (c.add_time ? new Date(c.add_time).toLocaleDateString() : '未知时间'),
        bg: c.cover_img ? (c.cover_img.startsWith('http') ? `url(${c.cover_img})` : `url(${API_BASE}${c.cover_img})`) : 'linear-gradient(135deg,#a8edea,#fed6e3)'
      }))
      console.log(`📘 加载到 ${learningList.value.length} 个学习项`)
    } else {
      learningList.value = []
    }
  } catch (error) {
    console.error('加载我的学习列表失败:', error)
    learningList.value = []
  }
}

onMounted(async () => {
  console.log('🎓 学生个人中心加载中...')
  
  // 检查用户认证状态
  if (!user.checkAuth()) {
    console.log('用户未登录，请先登录')
    return
  }

  try {
    // 获取用户信息
    if (!user.userId) {
      console.log('📝 获取用户信息...')
      await user.fetchUserProfile()
      console.log('✅ 用户信息获取完成:', user.userName)
    }
    
    // 加载学习统计
    console.log('📊 获取学习统计...')
    await user.fetchLearningStats()
    console.log('✅ 学习统计获取完成:', user.learningStats)
    
    // 计算用户等级
    calculateLevel()
    
    // 加载学习库课程
    console.log('📚 加载学习库课程...')
    await loadLibraryCourses()
    
    // 加载收藏课程
    console.log('❤️ 加载收藏课程...')
    await loadCollectCourses()
    
    // 加载成就
    console.log('🏆 加载成就...')
    await loadAchievements()

    // 加载我的学习列表
    console.log('📘 加载我的学习列表...')
    await loadLearningList()
    
    console.log('✅ 学生数据加载完成')
    
    // 调试信息：检查本地存储
    console.log('🔍 调试信息:');
    console.log('- 用户ID:', user.userId);
    console.log('- 用户Token:', localStorage.getItem('token') ? '存在' : '不存在');
    console.log('- 学习库课程数:', libraryList.value.length);
    console.log('- 收藏课程数:', collectList.value.length);
    
  } catch (error) {
    console.error('❌ 加载学生数据失败:', error)
    // 设置默认数据避免页面空白
    learningList.value = []
    collectList.value = []
    libraryList.value = []
    achievements.value = []
  }
})

// 头像更新处理
const handleAvatarUpdate = (avatarUrl) => {
  user.updateAvatar(avatarUrl)
}

// 个人资料更新处理
const handleProfileUpdate = async (profileData) => {
  try {
    await user.updateProfile(profileData)
    alert('个人资料更新成功')
  } catch (error) {
    alert('更新个人资料失败：' + error.message)
  }
}
</script>

<style src="../assets/student.css"></style>