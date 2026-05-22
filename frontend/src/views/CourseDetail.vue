<template>
  <div class="detail-page">
    <div class="top-nav">
      <el-button link @click="router.back()" class="back-btn">
        <i class="el-icon-back"></i> ← 返回大厅
      </el-button>
      <span class="logo serif-text">栖学课堂</span>
    </div>

    <main class="course-container" v-if="course">
      <div class="video-section">
        <div class="player-wrapper">
          <video 
            class="styled-player" 
            controls 
            :src="course.video_url || 'https://www.w3schools.com/html/mov_bbb.mp4'" 
            :poster="course.cover_image">
            您的浏览器不支持视频播放。
          </video>
        </div>
        
        <div class="info-section">
          <h1 class="serif-text">{{ course.title }}</h1>
          <div class="meta-tags">
            <span class="tag">{{ course.category }}</span>
            <span class="teacher">主讲：{{ course.teacher_id }} 号导师</span>
          </div>
          <p class="description">{{ course.description }}</p>
        </div>
      </div>

      <aside class="sidebar">
        <el-card class="progress-card">
          <h3 class="serif-text">学习进度</h3>
          <el-progress :percentage="0" color="#6ab085" />
          <p class="encouragement">千里之行，始于足下。点击播放开始你的学习吧！</p>
          
          <el-button 
            type="primary" 
            class="action-btn" 
            plain 
            @click="dialogVisible = true"
            :disabled="isSubmitted"
          >
            {{ isSubmitted ? '作业已提交 (待批阅)' : '撰写课程作业' }}
          </el-button>
        </el-card>
      </aside>
    </main>

    <el-dialog
      v-model="dialogVisible"
      title="✍️ 课程作业"
      width="500px"
      class="elegant-dialog"
      :show-close="false"
    >
      <div class="dialog-content">
        <p class="dialog-subtitle serif-text">请在下方书写你的学习心得与作业解答：</p>
        <el-input
          v-model="assignmentContent"
          type="textarea"
          :rows="6"
          placeholder="在此留下你的思考..."
          class="elegant-textarea"
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">先存草稿</el-button>
          <el-button type="primary" @click="submitAssignment" :loading="submitting">
            郑重提交
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const course = ref(null)
const currentUser = ref(null)

// 作业相关的响应式变量
const dialogVisible = ref(false)
const assignmentContent = ref('')
const submitting = ref(false)
const isSubmitted = ref(false)

onMounted(async () => {
  const user = localStorage.getItem('user')
  if (user) {
    currentUser.value = JSON.parse(user)
  }

  const courseId = route.params.id
  try {
    const res = await axios.get(`http://localhost:3000/api/courses/${courseId}`)
    if (res.data.success) {
      course.value = res.data.data
    }
  } catch (error) {
    ElMessage.error('加载课程信息失败')
    router.push('/dashboard')
  }
})

// 提交作业的核心逻辑
const submitAssignment = async () => {
  if (!assignmentContent.value.trim()) {
    ElMessage.warning('作业内容不能是一张白纸哦')
    return
  }

  submitting.value = true
  try {
    const payload = {
      course_id: course.value.id,
      student_id: currentUser.value.id,
      content: assignmentContent.value
    }

    const res = await axios.post('http://localhost:3000/api/assignments', payload)
    
    if (res.data.success) {
      ElMessage({ message: res.data.message, type: 'success' })
      dialogVisible.value = false
      isSubmitted.value = true
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background-color: var(--paper-cream);
}

.top-nav {
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(106, 176, 133, 0.1);
}

.back-btn { color: #8fa799; font-size: 16px; }
.back-btn:hover { color: var(--primary-green); }

.logo {
  color: var(--deep-green);
  font-size: 20px;
  font-weight: bold;
}

.course-container {
  max-width: 1200px;
  margin: 40px auto;
  padding: 0 20px;
  display: grid;
  grid-template-columns: 2.5fr 1fr;
  gap: 30px;
}

.player-wrapper {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(106, 176, 133, 0.15);
  background-color: #000;
  line-height: 0;
}
.styled-player { width: 100%; max-height: 500px; outline: none; }

.info-section {
  margin-top: 30px;
  padding: 20px;
  background: #fff;
  border-radius: 16px;
  box-shadow: var(--shadow-soft);
}
.info-section h1 {
  margin: 0 0 15px;
  color: var(--deep-green);
  font-size: 28px;
}
.meta-tags {
  display: flex; gap: 15px; align-items: center; margin-bottom: 20px;
}
.tag {
  background: var(--light-mint); color: var(--primary-green);
  padding: 4px 12px; border-radius: 12px; font-size: 14px;
}
.teacher { color: #8fa799; font-size: 14px; }
.description { color: var(--text-main); line-height: 1.8; }

.sidebar { position: sticky; top: 80px; }
.progress-card { padding: 10px; text-align: center; }
.progress-card h3 { color: var(--deep-green); margin-top: 0; }
.encouragement { color: #8fa799; font-size: 14px; margin: 20px 0; }
.action-btn { width: 100%; }

/* 优雅的弹窗与文本框样式 */
:deep(.elegant-dialog) {
  border-radius: 20px;
  overflow: hidden;
}
:deep(.elegant-dialog .el-dialog__header) {
  background-color: var(--light-mint);
  margin-right: 0;
  padding: 20px;
  border-bottom: 1px solid rgba(106, 176, 133, 0.1);
}
:deep(.elegant-dialog .el-dialog__title) {
  color: var(--deep-green);
  font-family: 'Noto Serif SC', serif;
  font-weight: bold;
}
.dialog-subtitle {
  color: #8fa799;
  margin-top: 0;
  margin-bottom: 15px;
}
:deep(.elegant-textarea .el-textarea__inner) {
  background-color: var(--paper-cream);
  border: 1px solid #e0ede5;
  border-radius: 12px;
  padding: 15px;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-main);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
}
:deep(.elegant-textarea .el-textarea__inner:focus) {
  border-color: var(--primary-green);
  box-shadow: 0 0 0 1px var(--primary-green);
}
</style>