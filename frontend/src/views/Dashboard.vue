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
          
          <button class="profile-btn" @click="router.push('/profile')">个人中心</button>
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
              <p class="teacher">讲师：{{ course.teacher_name || '特邀导师' }}</p>
              <div class="card-footer">
                <span class="students">{{ course.id * 12 + 58 }} 人在学</span>
                <el-button type="primary" size="small" plain>开始学习</el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </main>

    <div>
      <div class="ai-fab" @click="aiChatVisible = !aiChatVisible">
        🤖
      </div>

      <transition name="fade-slide">
        <div v-show="aiChatVisible" class="ai-chat-window">
          <div class="ai-header">
            <span>✨ 栖学 AI 向导</span>
            <span class="close-ai" @click="aiChatVisible = false">✖</span>
          </div>
          
          <div class="ai-body" ref="chatScrollRef">
            <div 
              v-for="(msg, index) in chatMessages" 
              :key="index" 
              :class="['chat-bubble', msg.role === 'ai' ? 'ai' : 'user']"
            >
              {{ msg.content }}
            </div>
            <div v-if="aiThinking" class="chat-bubble ai typing-indicator">
              <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </div>
          </div>

          <div class="ai-footer">
            <el-input 
              v-model="aiInput" 
              placeholder="需要推荐课程吗？问问 AI..." 
              @keyup.enter="sendAiMessage"
            >
              <template #append>
                <el-button @click="sendAiMessage" style="background: var(--primary-green); color: white; border: none; height: 100%;">发送</el-button>
              </template>
            </el-input>
          </div>
        </div>
      </transition>
    </div>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue' // 增加了 nextTick
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const currentUser = ref({ username: '学者' })
const courseList = ref([])

// 获取课程数据的函数
const fetchCourses = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/courses')
    if (res.data.success) {
      courseList.value = res.data.data
    }
  } catch (error) {
    ElMessage.error('无法获取课程列表，请检查后端是否运行')
  }
}

// ================== 🌟 AI 助教聊天逻辑 ==================
const aiChatVisible = ref(false)
const aiInput = ref('')
const aiThinking = ref(false)
const chatScrollRef = ref(null)

// 初始问候语改为了更符合首页的语境
const chatMessages = ref([
  { role: 'ai', content: '你好呀！我是栖学平台的全局 AI 向导 🌿。不知道学什么课好，或者遇到了使用问题，都可以随时问我！' }
])

const scrollToBottom = () => {
  if (chatScrollRef.value) {
    chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight
  }
}

const sendAiMessage = async () => {
  const userText = aiInput.value.trim()
  if (!userText || aiThinking.value) return

  // 1. 本地展示用户的消息
  chatMessages.value.push({ role: 'user', content: userText })
  aiInput.value = ''
  aiThinking.value = true
  nextTick(() => scrollToBottom())

  // 2. 发送给后端 AI 接口
  try {
    const res = await axios.post('http://localhost:3000/api/chat', { message: userText })
    if (res.data.success) {
      chatMessages.value.push({ role: 'ai', content: res.data.reply })
    } else {
      chatMessages.value.push({ role: 'ai', content: '哎呀，我好像开小差了，能再问一遍吗？' })
    }
  } catch (error) {
    chatMessages.value.push({ role: 'ai', content: '网络连接似乎有点问题，联系不到我的大脑服务器啦。' })
  } finally {
    aiThinking.value = false
    nextTick(() => scrollToBottom())
  }
}
// =======================================================

onMounted(() => {
  const user = localStorage.getItem('user')
  if (user) {
    currentUser.value = JSON.parse(user)
  } else {
    router.push('/login')
  }
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
/* 原本的页面样式 */
.dashboard-layout { min-height: 100vh; background-color: var(--paper-cream); }
.navbar { background: rgba(253, 250, 245, 0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); height: 70px; position: sticky; top: 0; z-index: 100; border-bottom: 1px solid rgba(106, 176, 133, 0.15); }
.nav-content { max-width: 1200px; margin: 0 auto; height: 100%; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; }
.nav-logo { font-size: 24px; font-weight: 700; color: var(--deep-green); letter-spacing: 2px; }
.user-info { display: flex; align-items: center; gap: 15px; }
.greeting { color: var(--deep-green); font-size: 14px; }
.avatar { background-color: var(--primary-green); color: white; font-weight: bold; }
.logout-btn { color: #8fa799; }
.logout-btn:hover { color: var(--primary-green); }
.main-content { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }

.welcome-banner { background: linear-gradient(135deg, #ffffff 0%, var(--light-mint) 100%); padding: 40px; border-radius: 24px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: center; box-shadow: var(--shadow-soft); border: 1px solid rgba(255,255,255,0.6); }
.banner-text h2 { margin: 0; color: var(--deep-green); font-size: 28px; }
.banner-text p { color: #8fa799; margin-top: 12px; font-size: 16px; }
.banner-decoration { font-size: 60px; opacity: 0.8; }
.section-header { margin-bottom: 24px; }
.section-header h3 { color: var(--deep-green); font-size: 22px; margin: 0; position: relative; display: inline-block; }
.section-header h3::after { content: ''; position: absolute; bottom: -6px; left: 0; width: 40%; height: 3px; background-color: var(--primary-green); border-radius: 2px; }

.course-card { cursor: pointer; overflow: hidden; background-color: #ffffff; border-radius: 16px; border: none; transition: transform 0.3s, box-shadow 0.3s; margin-bottom: 20px;}
.course-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(106, 176, 133, 0.15) !important; }
.img-wrapper { position: relative; width: 100%; height: 180px; overflow: hidden; }
.course-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
.course-card:hover .course-img { transform: scale(1.05); }
.course-tag { position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.9); color: var(--primary-green); padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; backdrop-filter: blur(4px); }
.course-info { padding: 20px; }
.course-info h4 { margin: 0 0 10px; font-size: 18px; color: var(--text-main); }
.text-ellipsis { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.teacher { font-size: 13px; color: #8fa799; margin-bottom: 20px; }
.card-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f0f5f2; padding-top: 16px; }
.students { font-size: 13px; color: var(--primary-green); }

.community-btn { display: flex; align-items: center; gap: 6px; background-color: #eef7f2; border: 1px solid #6ab085; color: #3d5a49 !important; -webkit-text-fill-color: #3d5a49 !important; border-radius: 20px; padding: 8px 24px; font-size: 15px; font-weight: bold; letter-spacing: 1px; cursor: pointer; box-shadow: 0 4px 12px rgba(106, 176, 133, 0.15); transition: all 0.3s ease; margin-right: 20px; }
.community-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(106, 176, 133, 0.3); background-color: #e0ede5; color: #3d5a49 !important; }
.community-btn:active { transform: translateY(0); }
.profile-btn { background: transparent; border: 1px solid transparent; color: var(--text-main); padding: 6px 14px; border-radius: 16px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.3s ease; }
.profile-btn:hover { background-color: var(--light-mint); border-color: rgba(106, 176, 133, 0.4); color: var(--primary-green); transform: translateY(-1px); }
.profile-btn:active { transform: translateY(0); }

/* ================= 🌟 引入 AI 悬浮窗样式 ================= */
.ai-fab {
  position: fixed;
  bottom: 40px;
  right: 40px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var(--primary-green);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(106, 176, 133, 0.4);
  z-index: 1000;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.ai-fab:hover {
  transform: scale(1.1) translateY(-5px);
  box-shadow: 0 12px 32px rgba(106, 176, 133, 0.6);
}

.ai-chat-window {
  position: fixed;
  bottom: 110px;
  right: 40px;
  width: 340px;
  height: 520px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(106, 176, 133, 0.2);
}

.ai-header {
  background: linear-gradient(135deg, #eef7f2 0%, #e0ede5 100%);
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(106, 176, 133, 0.1);
  color: var(--deep-green);
  font-weight: bold;
  font-size: 15px;
}
.close-ai {
  cursor: pointer;
  color: #8fa799;
  font-size: 16px;
  transition: color 0.2s;
}
.close-ai:hover { color: var(--primary-green); }

.ai-body {
  flex: 1;
  padding: 20px 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
  background: var(--paper-cream);
  scroll-behavior: smooth;
}

.chat-bubble {
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}
.chat-bubble.ai {
  background: white;
  color: var(--text-main);
  align-self: flex-start;
  border: 1px solid #e0ede5;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.03);
}
.chat-bubble.user {
  background: var(--primary-green);
  color: white;
  align-self: flex-end;
  border-bottom-right-radius: 4px;
  box-shadow: 0 4px 12px rgba(106, 176, 133, 0.2);
}

.ai-footer {
  padding: 15px;
  background: white;
  border-top: 1px solid #e0ede5;
}
:deep(.ai-footer .el-input__wrapper) {
  border-radius: 20px 0 0 20px !important;
  box-shadow: 0 0 0 1px #e0ede5 inset;
}
:deep(.ai-footer .el-input-group__append) {
  border-radius: 0 20px 20px 0 !important;
  background: var(--primary-green);
  border: none;
  overflow: hidden;
}

.typing-indicator { display: flex; gap: 4px; padding: 16px !important; }
.typing-indicator .dot { width: 6px; height: 6px; background-color: #8fa799; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
.typing-indicator .dot:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator .dot:nth-child(2) { animation-delay: -0.16s; }
@keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(20px) scale(0.95); }
</style>