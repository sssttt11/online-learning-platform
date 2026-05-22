<template>
  <div class="dashboard-layout">
    <header class="navbar">
      <div class="nav-content">
        <div class="nav-logo serif-text">栖学课堂</div>
        <div class="user-info">
          <button class="community-btn" @click="router.push('/community')">
            <span class="icon">🌿</span> 探索学习社区
          </button>

          <span class="greeting">欢迎你，{{ currentUser.username }}</span>
          <el-avatar :size="36" class="avatar" style="cursor: pointer;" @click="router.push('/profile')">
            {{ currentUser.username.charAt(0).toUpperCase() }}
          </el-avatar>
          
          <button class="profile-btn" @click="router.push('/profile')">
            个人中心
          </button>

          <el-button link class="logout-btn" @click="logout">退出</el-button>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="welcome-banner">
        <div class="banner-text">
          <h2 class="serif-text">在静谧的时光里，探索新知。</h2>
          <p>今天是与栖学相伴的又一天，继续你的学习之旅吧。</p>
        </div>
        <div class="banner-decoration">🌿</div>
      </div>

      <div class="section-header">
        <h3 class="serif-text">最新好课</h3>
      </div>

      <el-row :gutter="24">
        <el-col :span="6" v-for="course in courseList" :key="course.id">
          <el-card :body-style="{ padding: '0px' }" class="course-card" @click="goToCourse(course.id)">
            <div class="img-wrapper">
              <img :src="course.cover_image" class="course-img" alt="课程封面" />
              <div class="course-tag">{{ course.category }}</div>
            </div>
            <div class="course-info">
              <h4 class="text-ellipsis">{{ course.title }}</h4>
              <p class="teacher">讲师：{{ course.teacher }}</p>
              <div class="card-footer">
                <span class="students">{{ course.students }} 人在学</span>
                <el-button type="primary" size="small" plain>开始学习</el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const currentUser = ref({ username: '学者' })

// 将原来的假数据替换为空数组，等待后端填满它
const courseList = ref([])

// 获取课程数据的函数
const fetchCourses = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/courses')
    if (res.data.success) {
      // 将后端返回的真实数据赋值给页面变量
      courseList.value = res.data.data
    }
  } catch (error) {
    ElMessage.error('无法获取课程列表，请检查后端是否运行')
  }
}

onMounted(() => {
  // 1. 检查用户是否已登录 (读取本地缓存的用户信息)
  const user = localStorage.getItem('user')
  if (user) {
    currentUser.value = JSON.parse(user)
  } else {
    // 如果没登录，踢回登录页
    router.push('/login')
  }

  // 2. 页面一加载，就去请求课程数据
  fetchCourses()
})

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}
const goToCourse = (id) => {
  router.push(`/course/${id}`)
}
</script>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
}

/* 导航栏玻璃态 */
.navbar {
  background: rgba(253, 250, 245, 0.85); /* 偏米白色的磨砂 */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  height: 70px;
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(106, 176, 133, 0.15);
}

.nav-content {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.nav-logo {
  font-size: 24px;
  font-weight: 700;
  color: var(--deep-green);
  letter-spacing: 2px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.greeting {
  color: var(--deep-green);
  font-size: 14px;
}

.avatar {
  background-color: var(--primary-green);
  color: white;
  font-weight: bold;
}

.logout-btn {
  color: #8fa799;
}
.logout-btn:hover {
  color: var(--primary-green);
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* 欢迎横幅 */
.welcome-banner {
  background: linear-gradient(135deg, #ffffff 0%, var(--light-mint) 100%);
  padding: 40px;
  border-radius: 24px;
  margin-bottom: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-soft);
  border: 1px solid rgba(255,255,255,0.6);
}

.banner-text h2 { 
  margin: 0; 
  color: var(--deep-green); 
  font-size: 28px;
}
.banner-text p { 
  color: #8fa799; 
  margin-top: 12px; 
  font-size: 16px;
}
.banner-decoration {
  font-size: 60px;
  opacity: 0.8;
}

.section-header { 
  margin-bottom: 24px; 
}
.section-header h3 {
  color: var(--deep-green);
  font-size: 22px;
  margin: 0;
  position: relative;
  display: inline-block;
}
.section-header h3::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 0;
  width: 40%;
  height: 3px;
  background-color: var(--primary-green);
  border-radius: 2px;
}

/* 课程卡片精细化 */
.course-card {
  cursor: pointer;
  overflow: hidden;
  background-color: #ffffff;
}
.course-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(106, 176, 133, 0.15) !important;
}

.img-wrapper {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
}
.course-img { 
  width: 100%; 
  height: 100%; 
  object-fit: cover;
  transition: transform 0.5s ease;
}
.course-card:hover .course-img {
  transform: scale(1.05);
}

.course-tag {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255,255,255,0.9);
  color: var(--primary-green);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  backdrop-filter: blur(4px);
}

.course-info { 
  padding: 20px; 
}
.course-info h4 { 
  margin: 0 0 10px; 
  font-size: 18px; 
  color: var(--text-main);
}
.text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.teacher { 
  font-size: 13px; 
  color: #8fa799; 
  margin-bottom: 20px; 
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f0f5f2;
  padding-top: 16px;
}
.students { 
  font-size: 13px; 
  color: var(--primary-green); 
}
/* 专属的高级社区按钮样式 (增强对比度版) */
/* 专属的高级社区按钮样式 (深色文字版，绝对清晰) */
.community-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #eef7f2; /* 极浅的薄荷绿底色 */
  border: 1px solid #6ab085; /* 增加一圈主色调的边框 */
  color: #3d5a49 !important; /* 强制使用深墨绿色文字 */
  -webkit-text-fill-color: #3d5a49 !important; 
  border-radius: 20px;
  padding: 8px 24px;
  font-size: 15px;
  font-weight: bold;
  letter-spacing: 1px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(106, 176, 133, 0.15); /* 柔和的阴影 */
  transition: all 0.3s ease;
  margin-right: 20px;
}

.community-btn .icon {
  font-size: 18px;
}

.community-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(106, 176, 133, 0.3);
  background-color: #e0ede5; /* 鼠标悬停时底色稍微加深一点点 */
  color: #3d5a49 !important; 
}

.community-btn:active {
  transform: translateY(0);
}
/* 专属的个人中心“幽灵”按钮样式 */
.profile-btn {
  background: transparent;
  border: 1px solid transparent; /* 初始状态没有边框 */
  color: var(--text-main);
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.profile-btn:hover {
  background-color: var(--light-mint); /* 悬停时浮现极浅的薄荷绿 */
  border-color: rgba(106, 176, 133, 0.4); /* 浮现柔和的边框 */
  color: var(--primary-green); /* 文字变绿 */
  transform: translateY(-1px);
}

.profile-btn:active {
  transform: translateY(0);
}
</style>