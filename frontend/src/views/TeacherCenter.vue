<!-- frontend/src/views/TeacherCenter.vue -->
<template>
  <div class="teacher-center-wrapper">
    <div class="teacher-center">
      <!-- 教师头部 -->
      <div class="container">
        <div class="profile-header">
          <!-- 背景装饰 -->
          <div class="profile-bg-decoration">
            <div class="decoration-circle circle-1"></div>
            <div class="decoration-circle circle-2"></div>
            <div class="decoration-circle circle-3"></div>
          </div>
          
          <!-- 左侧头像区域 -->
          <div class="profile-left">
            <div class="profile-avatar" @click="showAvatar = true">
              <img v-if="user.avatarUrl" :src="user.avatarUrl" alt="教师头像" />
              <span v-else>{{ user.userName?.charAt(0) || '教' }}</span>
              <div class="online-indicator"></div>
              <div class="avatar-edit-overlay">
                <i class="fas fa-camera"></i>
              </div>
            </div>
            <div class="user-level">
              <i class="fas fa-chalkboard-teacher"></i>
              <span>认证教师</span>
            </div>
          </div>

          <!-- 右侧信息区域 -->
          <div class="profile-info">
            <div class="profile-name-row">
              <h1>{{ user.userName || '教师' }}</h1>
              <div class="user-badges">
                <span class="badge badge-teacher"><i class="fas fa-award"></i> 优秀讲师</span>
                <span class="badge badge-verified"><i class="fas fa-check-circle"></i> 已认证</span>
              </div>
            </div>
            
            <div class="user-title">{{ teacherStats.title || 'Python高级工程师 · 全栈开发专家' }}</div>
            
            <div class="profile-bio-wrapper">
              <span class="quote-mark quote-left">"</span>
              <p class="profile-bio">{{ teacherStats.description || '专注于编程教育和软件开发，拥有丰富的教学经验，致力于帮助每一位学生成长' }}</p>
              <span class="quote-mark quote-right">"</span>
            </div>

            <!-- 快捷统计 -->
            <div class="profile-quick-stats">
              <div class="quick-stat">
                <i class="fas fa-book-open"></i>
                <span class="stat-num">{{ teacherStats.courses?.total || 0 }}</span>
                <span class="stat-unit">门课程</span>
              </div>
              <div class="quick-stat">
                <i class="fas fa-users"></i>
                <span class="stat-num">{{ teacherStats.students?.total || 0 }}</span>
                <span class="stat-unit">名学生</span>
              </div>
              <div class="quick-stat">
                <i class="fas fa-star"></i>
                <span class="stat-num">{{ teacherStats.rating?.average || '0.0' }}</span>
                <span class="stat-unit">评分</span>
              </div>
              <div class="quick-stat">
                <i class="fas fa-heart"></i>
                <span class="stat-num">{{ Math.round((teacherStats.rating?.average || 0) * 20) }}%</span>
                <span class="stat-unit">满意度</span>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <button class="edit-profile-btn" @click="showEditProfile = true" title="编辑个人资料">
            <i class="fas fa-user-edit"></i>
          </button>
          <button class="settings-btn" @click="showSettings = true" title="账户设置">
            <i class="fas fa-cog"></i>
          </button>
        </div>
      </div>

      <!-- 标签页导航 -->
      <div class="container">
        <div class="tabs">
          <div 
            v-for="t in tabs" 
            :key="t.key" 
            class="tab" 
            :class="{ active: activeTab === t.key }" 
            @click="activeTab = t.key"
          >
            <i :class="t.icon"></i>
            <span>{{ t.label }}</span>
          </div>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="container">
        <!-- 1. 课程管理 -->
        <section v-if="activeTab === 'courses'" class="content-section">
          <div class="section-header">
            <div class="section-title">
              <i class="fas fa-graduation-cap"></i>
              <span>我的课程</span>
            </div>
            <div class="section-actions">
              <button class="more-btn">
                查看全部 <i class="fas fa-chevron-right"></i>
              </button>
              <button class="btn btn-primary" @click="createNewCourse">
                <i class="fas fa-plus"></i> 创建新课程
              </button>
            </div>
          </div>
          
          <div class="courses-grid" v-if="teacherCourses.length">
            <div v-for="c in teacherCourses" :key="c.course_id" class="course-card">
              <div class="course-card-header">
                <div class="course-info">
                  <h3 class="course-title">{{ c.course_name }}</h3>
                  <span class="course-category">{{ c.difficulty }}</span>
                </div>
                <span class="status-badge" :class="c.status === 'published' ? 'status-active' : 'status-draft'">
                  <i :class="c.status === 'published' ? 'fas fa-check-circle' : 'fas fa-edit'"></i>
                  {{ c.status === 'published' ? '已发布' : '草稿' }}
                </span>
              </div>
              
              <div class="course-stats-row">
                <div class="course-stat">
                  <div class="course-stat-icon"><i class="fas fa-user-graduate"></i></div>
                  <div class="course-stat-info">
                    <div class="course-stat-value">{{ c.student_count || 0 }}</div>
                    <div class="course-stat-label">学生</div>
                  </div>
                </div>
                <div class="course-stat">
                  <div class="course-stat-icon star"><i class="fas fa-star"></i></div>
                  <div class="course-stat-info">
                    <div class="course-stat-value">{{ c.avg_rating || '0.0' }}</div>
                    <div class="course-stat-label">评分</div>
                  </div>
                </div>
                <div class="course-stat">
                  <div class="course-stat-icon comment"><i class="fas fa-comment-dots"></i></div>
                  <div class="course-stat-info">
                    <div class="course-stat-value">{{ c.review_count || 0 }}</div>
                    <div class="course-stat-label">评价</div>
                  </div>
                </div>
              </div>
              
              <div class="course-card-actions">
                <button class="action-btn outline"><i class="fas fa-edit"></i> 编辑</button>
                <button class="action-btn outline"><i class="fas fa-chart-line"></i> 数据</button>
                <button class="action-btn outline"><i class="fas fa-cog"></i> 设置</button>
              </div>
            </div>
          </div>
          
          <!-- 空状态 -->
          <div v-else class="empty-state">
            <div class="empty-icon"><i class="fas fa-book-open"></i></div>
            <p>还没有创建任何课程</p>
            <span class="empty-hint">开始创建您的第一门课程，分享您的知识吧！</span>
            <button class="btn btn-primary" @click="createNewCourse">
              <i class="fas fa-plus"></i> 创建课程
            </button>
          </div>
        </section>

        <!-- 2. 学生管理 -->
        <section v-if="activeTab === 'students'" class="content-section">
          <div class="section-header">
            <div class="section-title">
              <i class="fas fa-users"></i>
              <span>学生管理</span>
            </div>
            <button class="more-btn">
              查看全部 <i class="fas fa-chevron-right"></i>
            </button>
          </div>
          
          <div class="students-table-wrapper" v-if="students.length">
            <table class="students-table">
              <thead>
                <tr>
                  <th>学生信息</th>
                  <th>课程</th>
                  <th>学习进度</th>
                  <th>最后学习</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in students" :key="s.name">
                  <td>
                    <div class="student-info">
                      <div class="student-avatar">{{ s.ab }}</div>
                      <div class="student-details">
                        <div class="student-name">{{ s.name }}</div>
                        <div class="student-email">{{ s.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td><span class="course-tag">{{ s.course }}</span></td>
                  <td>
                    <div class="progress-cell">
                      <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: s.progress + '%' }"></div>
                      </div>
                      <span class="progress-text">{{ s.progress }}%</span>
                    </div>
                  </td>
                  <td><span class="time-text">{{ s.last }}</span></td>
                  <td>
                    <span class="status-badge" :class="s.status === '活跃' ? 'status-active' : 'status-warning'">
                      {{ s.status }}
                    </span>
                  </td>
                  <td>
                    <button class="action-btn primary small">
                      <i class="fas fa-comment"></i> 联系
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- 空状态 -->
          <div v-else class="empty-state">
            <div class="empty-icon"><i class="fas fa-user-graduate"></i></div>
            <p>暂无学生数据</p>
            <span class="empty-hint">当有学生报名您的课程后，这里会显示学生信息</span>
          </div>
        </section>

        <!-- 3. 数据统计 -->
        <section v-if="activeTab === 'analytics'" class="content-section">
          <div class="section-header">
            <div class="section-title">
              <i class="fas fa-chart-pie"></i>
              <span>教学数据概览</span>
            </div>
            <button class="more-btn" @click="goToTeacherAnalysis">
              查看详情 <i class="fas fa-chevron-right"></i>
            </button>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card revenue">
              <div class="stat-card-icon"><i class="fas fa-coins"></i></div>
              <div class="stat-card-content">
                <div class="stat-card-value">¥{{ teacherStats.revenue?.total || 0 }}</div>
                <div class="stat-card-label">总收入</div>
              </div>
              <div class="stat-card-trend up">
                <i class="fas fa-arrow-up"></i> 12%
              </div>
            </div>
            <div class="stat-card students">
              <div class="stat-card-icon"><i class="fas fa-user-friends"></i></div>
              <div class="stat-card-content">
                <div class="stat-card-value">{{ teacherStats.students?.total || 0 }}</div>
                <div class="stat-card-label">活跃学生</div>
              </div>
              <div class="stat-card-trend up">
                <i class="fas fa-arrow-up"></i> 8%
              </div>
            </div>
            <div class="stat-card rating">
              <div class="stat-card-icon"><i class="fas fa-star"></i></div>
              <div class="stat-card-content">
                <div class="stat-card-value">{{ teacherStats.rating?.average || '0.0' }}</div>
                <div class="stat-card-label">平均评分</div>
              </div>
              <div class="stat-card-trend stable">
                <i class="fas fa-minus"></i> 稳定
              </div>
            </div>
            <div class="stat-card reviews">
              <div class="stat-card-icon"><i class="fas fa-comments"></i></div>
              <div class="stat-card-content">
                <div class="stat-card-value">{{ teacherStats.rating?.total_reviews || 0 }}</div>
                <div class="stat-card-label">评价总数</div>
              </div>
              <div class="stat-card-trend up">
                <i class="fas fa-arrow-up"></i> 15%
              </div>
            </div>
          </div>
          
          <!-- 分析入口卡片 -->
          <div class="analysis-entry" @click="goToTeacherAnalysis">
            <div class="analysis-icon">
              <i class="fas fa-chart-bar"></i>
            </div>
            <div class="analysis-content">
              <h3>查看详细学情分析</h3>
              <p>深入了解学生知识掌握分布、学习行为分析、课程完成率等详细数据</p>
              <div class="analysis-features">
                <span><i class="fas fa-check"></i> 知识掌握分布</span>
                <span><i class="fas fa-check"></i> 学习行为词云</span>
                <span><i class="fas fa-check"></i> 课程完成率</span>
              </div>
            </div>
            <div class="analysis-arrow">
              <i class="fas fa-arrow-right"></i>
            </div>
          </div>
        </section>
      </div>

      <!-- 页脚 -->
      <footer class="footer">
        <div class="container">
          <div class="footer-content">
            <div class="footer-section">
              <h3>关于 墨知课堂</h3>
              <p>AI赋能的个性化在线教育平台，致力于让每个人都能享受优质教育资源。</p>
            </div>
            <div class="footer-section">
              <h3>教师资源</h3>
              <ul class="footer-links">
                <li><a href="#">教学指南</a></li>
                <li><a href="#">课程制作</a></li>
                <li><a href="#">数据分析</a></li>
                <li><a href="#">教师社区</a></li>
              </ul>
            </div>
            <div class="footer-section">
              <h3>联系我们</h3>
              <ul class="footer-links">
                <li><a href="#">教师支持</a></li>
                <li><a href="#">合作咨询</a></li>
                <li><a href="#">意见反馈</a></li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <p>&copy; 2025 墨知课堂 AI+在线教育平台. 保留所有权利.</p>
          </div>
        </div>
      </footer>
    </div>

    <!-- 弹窗组件 -->
    <AvatarModal v-model="showAvatar" @avatar-updated="handleAvatarUpdate" />
    <SettingsModal v-model="showSettings" />
    <EditProfileModal 
      v-model="showEditProfile"
      :user-name="user.userName"
      :email="user.email"
      :user-intro="user.userIntro"
      @save="handleProfileUpdate"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user.js'
import AvatarModal from '../components/AvatarModal.vue'
import SettingsModal from '../components/SettingsModal.vue'
import EditProfileModal from '../components/EditProfileModal.vue'
import {
  apiTeacherStats,
  apiTeacherCourses,
  apiTeacherStudents
} from '../api/teacher.js'

/* ---------- 基础 UI 状态 ---------- */
const router = useRouter()
const activeTab = ref('courses')
const showAvatar = ref(false)
const showSettings = ref(false)
const showEditProfile = ref(false)

/* 顶部导航标签 */
const tabs = [
  { key: 'courses', label: '课程管理', icon: 'fas fa-book' },
  { key: 'students', label: '学生管理', icon: 'fas fa-users' },
  { key: 'analytics', label: '数据统计', icon: 'fas fa-chart-line' }
]

/* 教师个人信息 */
const user = useUserStore()

/* ---------- 业务数据 ---------- */
const teacherStats = ref({})
const teacherCourses = ref([])
const students = ref([])

/* ---------- 初始化 ---------- */
onMounted(async () => {
  console.log('🎓 教师中心加载中...')
  
  try {
    if (!user.userId) {
      console.log('📝 获取用户信息...')
      await user.fetchUserProfile()
      console.log('✅ 用户信息获取完成:', user.userName)
    }

    console.log('📊 获取教学统计数据...')
    const statRes = await apiTeacherStats()
    teacherStats.value = statRes.data ?? {}
    console.log('✅ 教学统计:', teacherStats.value)

    console.log('📚 获取课程列表...')
    const courseRes = await apiTeacherCourses()
    teacherCourses.value = Array.isArray(courseRes.data)
      ? courseRes.data
      : (courseRes.data && courseRes.data.list) || []
    console.log('✅ 课程列表:', teacherCourses.value)

    if (teacherCourses.value.length) {
      console.log('👥 获取学生列表...')
      const firstId = teacherCourses.value[0].course_id
      const stuRes = await apiTeacherStudents(firstId)
      students.value = (stuRes.data && stuRes.data.list) || stuRes.data || []
      console.log('✅ 学生列表:', students.value)
    }
    
    console.log('🎉 教师中心数据加载完成！')
  } catch (error) {
    console.error('❌ 教师中心数据加载失败:', error)
    teacherStats.value = {
      total_courses: 0,
      total_students: 0,
      average_rating: '0.0',
      completion_rate: '0'
    }
    teacherCourses.value = []
    students.value = []
  }
})

/* ---------- 事件处理 ---------- */
function createNewCourse() {
  router.push('/teacher/course-create')
}

function goToTeacherAnalysis() {
  router.push('/teacher/analysis')
}

async function loadStudents(courseId) {
  students.value = (await apiTeacherStudents(courseId)).data.list
}

const handleAvatarUpdate = (avatarUrl) => {
  user.updateAvatar(avatarUrl)
}

const handleProfileUpdate = async (profileData) => {
  try {
    await user.updateProfile(profileData)
    alert('个人资料更新成功')
  } catch (error) {
    alert('更新个人资料失败：' + error.message)
  }
}
</script>


<style scoped>
/* ===== 基础变量 ===== */
:root {
  --primary: #1a73e8;
  --primary-light: #e8f0fe;
  --primary-dark: #0d5bb9;
  --secondary: #34a853;
  --secondary-light: #e6f4ea;
  --warning: #f9ab00;
  --danger: #ea4335;
  --dark: #202124;
  --light: #f8f9fa;
  --gray: #5f6368;
  --gray-light: #80868b;
  --border: #dadce0;
  --shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  --shadow-hover: 0 8px 30px rgba(0, 0, 0, 0.12);
  --radius: 16px;
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ===== 基础布局 ===== */
.teacher-center-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #f5f7fa 100%);
}

.teacher-center {
  padding-bottom: 40px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

/* ===== 头部区域 ===== */
.profile-header {
  background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
  border-radius: 24px;
  padding: 40px;
  margin: 30px 0;
  box-shadow: 0 10px 40px rgba(26, 115, 232, 0.1);
  display: flex;
  align-items: flex-start;
  gap: 35px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(26, 115, 232, 0.08);
}

.profile-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: linear-gradient(90deg, #1a73e8, #ff9800, #34a853, #ea4335);
  background-size: 300% 100%;
  animation: gradientMove 4s ease infinite;
}

@keyframes gradientMove {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* 背景装饰 */
.profile-bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.05;
}

.circle-1 {
  width: 350px;
  height: 350px;
  background: linear-gradient(135deg, #1a73e8, #6c8ef5);
  top: -120px;
  right: -80px;
  animation: float 8s ease-in-out infinite;
}

.circle-2 {
  width: 250px;
  height: 250px;
  background: linear-gradient(135deg, #ff9800, #ffb74d);
  bottom: -100px;
  left: 15%;
  animation: float 6s ease-in-out infinite reverse;
}

.circle-3 {
  width: 180px;
  height: 180px;
  background: linear-gradient(135deg, #34a853, #66bb6a);
  top: 40%;
  right: 25%;
  animation: float 7s ease-in-out infinite 1s;
}

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-20px) scale(1.05); }
}

/* 左侧头像 */
.profile-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
  z-index: 1;
}

.profile-avatar {
  width: 130px;
  height: 130px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a73e8, #ff9800, #34a853);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2.8rem;
  font-weight: bold;
  position: relative;
  cursor: pointer;
  overflow: hidden;
  border: 5px solid white;
  box-shadow: 0 8px 30px rgba(26, 115, 232, 0.25),
              0 0 0 4px rgba(255, 152, 0, 0.15);
  transition: var(--transition);
}

.profile-avatar:hover {
  transform: scale(1.08);
  box-shadow: 0 12px 40px rgba(26, 115, 232, 0.35),
              0 0 0 6px rgba(255, 152, 0, 0.2);
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.online-indicator {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 18px;
  height: 18px;
  background: #22c55e;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.4);
  animation: pulse-online 2s infinite;
}

@keyframes pulse-online {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
}

.avatar-edit-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(26, 115, 232, 0.9), rgba(255, 152, 0, 0.9));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: var(--transition);
  font-size: 1.5rem;
}

.profile-avatar:hover .avatar-edit-overlay {
  opacity: 1;
}

.user-level {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #ff9800, #f57c00);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 700;
  box-shadow: 0 4px 15px rgba(255, 152, 0, 0.35);
}

.user-level i {
  font-size: 1rem;
}

/* 右侧信息 */
.profile-info {
  flex: 1;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.profile-name-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.profile-info h1 {
  font-size: 2.2rem;
  color: var(--dark);
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #1a73e8, #ff9800);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.user-badges {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.badge-teacher {
  background: linear-gradient(135deg, #fff3e0, #ffe0b2);
  color: #e65100;
}

.badge-verified {
  background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
  color: #2e7d32;
}

.badge i {
  font-size: 0.8rem;
}

.user-title {
  font-size: 1.15rem;
  color: #1a73e8;
  margin-bottom: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-title::before {
  content: '👨‍🏫';
  font-size: 1.1rem;
}

/* 个性签名 */
.profile-bio-wrapper {
  position: relative;
  margin: 20px 0;
  padding: 0 30px;
}

.quote-mark {
  position: absolute;
  font-size: 4rem;
  font-family: Georgia, serif;
  color: #1a73e8;
  opacity: 0.12;
  line-height: 1;
  user-select: none;
}

.quote-left {
  top: -10px;
  left: 0;
}

.quote-right {
  bottom: -30px;
  right: 0;
}

.profile-bio {
  color: var(--gray);
  position: relative;
  padding: 18px 24px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-left: 4px solid;
  border-image: linear-gradient(180deg, #1a73e8, #ff9800) 1;
  font-size: 1rem;
  line-height: 1.8;
  font-style: italic;
  margin: 0;
}

/* 快捷统计 */
.profile-quick-stats {
  display: flex;
  gap: 20px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px dashed var(--border);
  flex-wrap: wrap;
}

.quick-stat {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  background: white;
  border-radius: 14px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.06);
  transition: var(--transition);
  cursor: default;
}

.quick-stat:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(26, 115, 232, 0.15);
}

.quick-stat i {
  font-size: 1.2rem;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}

.quick-stat:nth-child(1) i {
  color: #1a73e8;
  background: #e8f0fe;
}

.quick-stat:nth-child(2) i {
  color: #34a853;
  background: #e6f4ea;
}

.quick-stat:nth-child(3) i {
  color: #f9ab00;
  background: #fef7e0;
}

.quick-stat:nth-child(4) i {
  color: #ea4335;
  background: #fce8e6;
}

.quick-stat .stat-num {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--dark);
}

.quick-stat .stat-unit {
  font-size: 0.85rem;
  color: var(--gray-light);
  font-weight: 500;
}

/* 操作按钮 */
.settings-btn, .edit-profile-btn {
  position: absolute;
  top: 24px;
  background: white;
  color: var(--gray);
  border: 1px solid var(--border);
  border-radius: 50%;
  width: 46px;
  height: 46px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
  z-index: 10;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08);
}

.settings-btn {
  right: 24px;
}

.edit-profile-btn {
  right: 80px;
}

.settings-btn:hover, .edit-profile-btn:hover {
  background: linear-gradient(135deg, #1a73e8, #ff9800);
  color: white;
  border-color: transparent;
  transform: rotate(15deg) scale(1.1);
}

/* ===== 标签页 ===== */
.tabs {
  display: flex;
  background: white;
  border-radius: 18px;
  padding: 10px;
  margin-bottom: 30px;
  box-shadow: var(--shadow);
  border: 1px solid rgba(26, 115, 232, 0.08);
}

.tab {
  flex: 1;
  text-align: center;
  padding: 16px 20px;
  cursor: pointer;
  border-radius: 12px;
  transition: var(--transition);
  font-weight: 600;
  color: var(--gray);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.tab i {
  font-size: 1.1rem;
}

.tab:hover {
  color: #1a73e8;
  background: #e8f0fe;
}

.tab.active {
  background: linear-gradient(135deg, #1a73e8, #0d5bb9);
  color: white;
  box-shadow: 0 6px 20px rgba(26, 115, 232, 0.35);
}

/* ===== 内容区域 ===== */
.content-section {
  background: white;
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 30px;
  box-shadow: var(--shadow);
  border: 1px solid rgba(255, 255, 255, 0.5);
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f5f7fa;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--dark);
}

.section-title i {
  color: #1a73e8;
  font-size: 1.3rem;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

/* 按钮样式 */
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: var(--transition);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
}

.btn-primary {
  background: linear-gradient(135deg, #1a73e8, #0d5bb9);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #0d5bb9, #1a73e8);
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(26, 115, 232, 0.4);
}

.more-btn {
  background: #e8f0fe;
  border: 1px solid #e8f0fe;
  color: #1a73e8;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: var(--transition);
  padding: 10px 18px;
  border-radius: 10px;
  font-weight: 600;
}

.more-btn:hover {
  background: #1a73e8;
  color: white;
  transform: translateX(3px);
  box-shadow: 0 4px 15px rgba(26, 115, 232, 0.3);
}


/* ===== 课程卡片 ===== */
.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
}

.course-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
  border-radius: 18px;
  overflow: hidden;
  transition: var(--transition);
  border: 1px solid rgba(26, 115, 232, 0.08);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.course-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 15px 40px rgba(26, 115, 232, 0.15);
  border-color: rgba(26, 115, 232, 0.2);
}

.course-card-header {
  padding: 24px;
  background: linear-gradient(135deg, #f8faff 0%, #eef2ff 100%);
  border-bottom: 1px solid rgba(26, 115, 232, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.course-info {
  flex: 1;
  min-width: 0;
}

.course-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--dark);
  margin-bottom: 10px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-category {
  display: inline-block;
  background: linear-gradient(135deg, #e8f0fe, #d4e4fc);
  color: #1a73e8;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
}

.status-active {
  background: linear-gradient(135deg, #34a853, #2e7d32);
  color: white;
}

.status-draft {
  background: linear-gradient(135deg, #f9ab00, #f57c00);
  color: white;
}

.status-warning {
  background: linear-gradient(135deg, #f9ab00, #f57c00);
  color: white;
}

.course-stats-row {
  display: flex;
  justify-content: space-around;
  padding: 20px;
  background: white;
}

.course-stat {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 12px;
  transition: var(--transition);
}

.course-stat:hover {
  background: #f8faff;
}

.course-stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e8f0fe;
  color: #1a73e8;
  font-size: 1rem;
}

.course-stat-icon.star {
  background: #fef7e0;
  color: #f9ab00;
}

.course-stat-icon.comment {
  background: #e6f4ea;
  color: #34a853;
}

.course-stat-info {
  text-align: left;
}

.course-stat-value {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--dark);
}

.course-stat-label {
  font-size: 0.8rem;
  color: var(--gray-light);
  font-weight: 500;
}

.course-card-actions {
  display: flex;
  gap: 10px;
  padding: 18px 20px;
  background: #f8faff;
}

.action-btn {
  flex: 1;
  padding: 10px 14px;
  border: none;
  border-radius: 10px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: var(--transition);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.action-btn.outline {
  background: white;
  color: var(--gray);
  border: 1px solid var(--border);
}

.action-btn.outline:hover {
  background: #1a73e8;
  color: white;
  border-color: #1a73e8;
  transform: translateY(-2px);
}

.action-btn.primary {
  background: linear-gradient(135deg, #1a73e8, #0d5bb9);
  color: white;
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(26, 115, 232, 0.35);
}

.action-btn.small {
  padding: 8px 14px;
  font-size: 0.8rem;
}

/* ===== 空状态 ===== */
.empty-state {
  text-align: center;
  padding: 60px 40px;
  background: linear-gradient(135deg, #f8faff 0%, #eef2ff 100%);
  border-radius: 18px;
  border: 2px dashed rgba(26, 115, 232, 0.2);
}

.empty-icon {
  width: 90px;
  height: 90px;
  background: linear-gradient(135deg, #e8f0fe, #d4e4fc);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
}

.empty-icon i {
  font-size: 2.5rem;
  color: #1a73e8;
}

.empty-state p {
  font-size: 1.2rem;
  color: var(--dark);
  margin-bottom: 10px;
  font-weight: 600;
}

.empty-hint {
  font-size: 0.95rem;
  color: var(--gray);
  margin-bottom: 28px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
}

/* ===== 学生表格 ===== */
.students-table-wrapper {
  overflow-x: auto;
  border-radius: 14px;
  border: 1px solid rgba(26, 115, 232, 0.08);
}

.students-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.students-table th {
  background: linear-gradient(135deg, #f8faff 0%, #eef2ff 100%);
  color: var(--dark);
  font-weight: 700;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 18px 16px;
  text-align: left;
  border-bottom: 2px solid rgba(26, 115, 232, 0.1);
}

.students-table td {
  padding: 16px;
  border-bottom: 1px solid #f0f4f8;
  transition: var(--transition);
}

.students-table tr:hover td {
  background: #f8faff;
}

.students-table tr:last-child td {
  border-bottom: none;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

.student-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a73e8, #6c8ef5);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.95rem;
  flex-shrink: 0;
}

.student-details {
  min-width: 0;
}

.student-name {
  font-weight: 600;
  color: var(--dark);
  margin-bottom: 3px;
}

.student-email {
  font-size: 0.8rem;
  color: var(--gray-light);
}

.course-tag {
  display: inline-block;
  background: #e8f0fe;
  color: #1a73e8;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  width: 100px;
  height: 8px;
  background: #e8f0fe;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1a73e8, #34a853);
  border-radius: 4px;
  transition: width 0.6s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--dark);
  min-width: 40px;
}

.time-text {
  font-size: 0.9rem;
  color: var(--gray);
}

/* ===== 数据统计卡片 ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 18px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(26, 115, 232, 0.08);
  transition: var(--transition);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
}

.stat-card.revenue::before { background: linear-gradient(180deg, #f9ab00, #ff8c00); }
.stat-card.students::before { background: linear-gradient(180deg, #1a73e8, #6c8ef5); }
.stat-card.rating::before { background: linear-gradient(180deg, #34a853, #66bb6a); }
.stat-card.reviews::before { background: linear-gradient(180deg, #ea4335, #ff6b6b); }

.stat-card-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
}

.stat-card.revenue .stat-card-icon {
  background: #fef7e0;
  color: #f9ab00;
}

.stat-card.students .stat-card-icon {
  background: #e8f0fe;
  color: #1a73e8;
}

.stat-card.rating .stat-card-icon {
  background: #e6f4ea;
  color: #34a853;
}

.stat-card.reviews .stat-card-icon {
  background: #fce8e6;
  color: #ea4335;
}

.stat-card-content {
  flex: 1;
}

.stat-card-value {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--dark);
  margin-bottom: 4px;
}

.stat-card-label {
  font-size: 0.9rem;
  color: var(--gray);
  font-weight: 500;
}

.stat-card-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
}

.stat-card-trend.up {
  background: #e6f4ea;
  color: #34a853;
}

.stat-card-trend.stable {
  background: #f5f5f5;
  color: var(--gray);
}

/* ===== 分析入口卡片 ===== */
.analysis-entry {
  background: linear-gradient(135deg, #f8faff 0%, #eef2ff 100%);
  border-radius: 18px;
  padding: 28px;
  display: flex;
  align-items: center;
  gap: 24px;
  cursor: pointer;
  transition: var(--transition);
  border: 2px solid rgba(26, 115, 232, 0.1);
}

.analysis-entry:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(26, 115, 232, 0.15);
  border-color: #1a73e8;
}

.analysis-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #1a73e8, #0d5bb9);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 8px 25px rgba(26, 115, 232, 0.3);
}

.analysis-icon i {
  font-size: 2rem;
  color: white;
}

.analysis-content {
  flex: 1;
}

.analysis-content h3 {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--dark);
  margin-bottom: 10px;
}

.analysis-content p {
  color: var(--gray);
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 14px;
}

.analysis-features {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.analysis-features span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #1a73e8;
  font-weight: 500;
}

.analysis-features i {
  font-size: 0.75rem;
}

.analysis-arrow {
  width: 50px;
  height: 50px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1a73e8;
  font-size: 1.2rem;
  transition: var(--transition);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.analysis-entry:hover .analysis-arrow {
  background: #1a73e8;
  color: white;
  transform: translateX(8px);
}


/* ===== 页脚 ===== */
.footer {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  padding: 60px 0 30px;
  margin-top: 60px;
  position: relative;
  overflow: hidden;
}

.footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #1a73e8, #ff9800, #34a853, #ea4335);
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
  margin-bottom: 40px;
}

.footer-section h3 {
  font-size: 1.2rem;
  margin-bottom: 20px;
  color: white;
  font-weight: 700;
  position: relative;
  padding-bottom: 12px;
}

.footer-section h3::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40px;
  height: 3px;
  background: #1a73e8;
  border-radius: 2px;
}

.footer-section > p {
  color: #bdc1c6;
  line-height: 1.7;
  font-size: 0.95rem;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li {
  margin-bottom: 12px;
}

.footer-links a {
  color: #bdc1c6;
  text-decoration: none;
  transition: var(--transition);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
}

.footer-links a:hover {
  color: white;
  transform: translateX(8px);
}

.footer-links a::before {
  content: '→';
  opacity: 0;
  transition: var(--transition);
}

.footer-links a:hover::before {
  opacity: 1;
}

.footer-bottom {
  text-align: center;
  padding-top: 30px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: #9aa0a6;
  font-size: 0.9rem;
}

/* ===== 响应式设计 ===== */
@media (max-width: 1024px) {
  .container {
    padding: 0 20px;
  }
  
  .profile-header {
    padding: 30px;
    gap: 28px;
  }
  
  .profile-avatar {
    width: 110px;
    height: 110px;
    font-size: 2.4rem;
  }
  
  .profile-info h1 {
    font-size: 1.9rem;
  }
  
  .courses-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }
  
  .profile-header {
    flex-direction: column;
    text-align: center;
    padding: 30px 20px;
    gap: 24px;
  }
  
  .profile-left {
    width: 100%;
  }
  
  .profile-avatar {
    width: 100px;
    height: 100px;
    font-size: 2rem;
  }
  
  .profile-name-row {
    justify-content: center;
    flex-direction: column;
    gap: 12px;
  }
  
  .profile-info h1 {
    font-size: 1.6rem;
  }
  
  .user-badges {
    justify-content: center;
  }
  
  .user-title {
    justify-content: center;
  }
  
  .profile-bio-wrapper {
    padding: 0 16px;
  }
  
  .quote-mark {
    font-size: 3rem;
  }
  
  .profile-quick-stats {
    justify-content: center;
    gap: 12px;
  }
  
  .quick-stat {
    padding: 10px 14px;
  }
  
  .quick-stat .stat-num {
    font-size: 1.2rem;
  }
  
  .decoration-circle {
    display: none;
  }
  
  .settings-btn, .edit-profile-btn {
    position: relative;
    top: 0;
    right: 0;
    display: inline-flex;
    margin: 5px;
  }
  
  .tabs {
    flex-wrap: wrap;
    padding: 8px;
    gap: 8px;
  }
  
  .tab {
    flex: 1 0 calc(50% - 8px);
    padding: 14px;
    font-size: 0.9rem;
  }
  
  .tab span {
    display: none;
  }
  
  .tab i {
    font-size: 1.3rem;
  }
  
  .content-section {
    padding: 24px 18px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .section-actions {
    width: 100%;
    flex-direction: column;
    gap: 10px;
  }
  
  .section-actions .btn,
  .section-actions .more-btn {
    width: 100%;
    justify-content: center;
  }
  
  .courses-grid {
    grid-template-columns: 1fr;
  }
  
  .course-stats-row {
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .course-card-actions {
    flex-direction: column;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stat-card {
    padding: 18px;
  }
  
  .stat-card-value {
    font-size: 1.5rem;
  }
  
  .analysis-entry {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .analysis-features {
    justify-content: center;
  }
  
  .analysis-arrow {
    display: none;
  }
  
  .students-table th,
  .students-table td {
    padding: 12px 10px;
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .profile-header {
    padding: 24px 16px;
    margin: 20px 0;
  }
  
  .profile-avatar {
    width: 90px;
    height: 90px;
    font-size: 1.8rem;
  }
  
  .profile-info h1 {
    font-size: 1.4rem;
  }
  
  .user-title {
    font-size: 1rem;
  }
  
  .profile-quick-stats {
    flex-direction: column;
    align-items: center;
  }
  
  .quick-stat {
    width: 100%;
    max-width: 200px;
    justify-content: center;
  }
  
  .tab {
    flex: 1 0 100%;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .stat-card-trend {
    position: static;
  }
  
  .footer-content {
    grid-template-columns: 1fr;
  }
}

/* ===== 滚动条美化 ===== */
.teacher-center-wrapper::-webkit-scrollbar {
  width: 8px;
}

.teacher-center-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.teacher-center-wrapper::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #1a73e8, #ff9800);
  border-radius: 4px;
}

.teacher-center-wrapper::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #0d5bb9, #f57c00);
}
</style>
