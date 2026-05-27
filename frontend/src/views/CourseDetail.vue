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
        
        <div v-if="!isEnrolled" class="enroll-banner">
          <div class="banner-content">
            <el-icon class="lock-icon"><Lock /></el-icon>
            <h2 class="serif-text">加入书斋，开启研读</h2>
            <p>你需要先选修此课程，才能解锁视频内容与互动权限。</p>
            <el-button type="primary" class="enroll-btn" @click="handleEnroll" :loading="enrolling">
              🌿 立即选修此课
            </el-button>
          </div>
        </div>

        <div v-else class="player-wrapper">
          <video 
            ref="videoPlayerRef"
            class="styled-player" 
            controls 
            :src="activeVideoUrl" 
            :poster="course.cover_image">
            您的浏览器不支持视频播放。
          </video>
        </div>
        
        <div class="info-section">
          <h1 class="serif-text">{{ currentChapter ? currentChapter.title : course.title }}</h1>
          <div class="meta-tags">
            <span class="tag">{{ course.category }}</span>
            <span class="teacher">主讲：{{ course.teacher_id }} 号导师</span>
          </div>
          <p class="description">{{ course.description }}</p>
        </div>
      </div>

      <aside class="sidebar">
        <el-tabs v-model="activeTab" class="elegant-tabs" type="border-card">
          
          <el-tab-pane label="📖 课程目录" name="chapters" v-if="chapterList.length > 0">
            <div class="chapters-panel" v-if="isEnrolled">
              <div 
                v-for="chapter in chapterList" 
                :key="chapter.id" 
                :class="['chapter-item', { 'is-playing': currentChapter && currentChapter.id === chapter.id }]"
                @click="playChapter(chapter)"
              >
                <div class="chapter-num">第{{ chapter.chapter_number }}讲</div>
                <div class="chapter-title">{{ chapter.title }}</div>
                <i class="el-icon-video-play play-icon" v-if="currentChapter && currentChapter.id === chapter.id"></i>
              </div>
            </div>
            <div v-else class="mini-empty" style="padding: 40px 0;">请先选修本门课程</div>
          </el-tab-pane>

          <el-tab-pane label="📋 研读向导" name="guide">
            <div class="progress-card">
              <h3 class="serif-text">学习进度</h3>
              <el-progress :percentage="isEnrolled ? 0 : 0" color="#6ab085" />
              <p class="encouragement">
                {{ isEnrolled ? '千里之行，始于足下。点击播放开始你的学习吧！' : '选修课程后即可记录学习进度' }}
              </p>
              
              <el-button type="primary" class="action-btn" plain @click="dialogVisible = true" :disabled="isSubmitted || !isEnrolled">
                {{ !isEnrolled ? '请先选修课程' : (isSubmitted ? '作业已提交 (待批阅)' : '撰写课程作业') }}
              </el-button>
            </div>
          </el-tab-pane>

          <el-tab-pane label="✍️ 随堂笔记" name="notes">
            <div class="notes-panel" v-if="isEnrolled">
              <div class="note-input-area">
                <el-input v-model="newNoteContent" type="textarea" :rows="3" placeholder="在播放时刻写下你的思考..." class="elegant-textarea small-text" />
                <div class="note-action-row">
                  <el-button type="primary" size="small" @click="saveTimelineNote" :loading="savingNote">捕捉当前时刻</el-button>
                </div>
              </div>

              <div class="notes-timeline">
                <div v-if="noteList.length === 0" class="mini-empty">暂无随堂笔记，看课时随时写下灵感吧 🌿</div>
                <div v-for="note in noteList" :key="note.id" class="timeline-item">
                  <span class="time-badge" @click="seekToTimestamp(note.timestamp_secs)">
                    ⏱️ {{ formatSeconds(note.timestamp_secs) }}
                  </span>
                  <p class="note-text">{{ note.content }}</p>
                </div>
              </div>
            </div>
            <div v-else class="mini-empty" style="padding: 40px 0;">请先选修本门课程</div>
          </el-tab-pane>

        </el-tabs>
      </aside>
    </main>

    <el-dialog v-model="dialogVisible" title="✍️ 课程作业" width="500px" class="elegant-dialog" :show-close="false">
      <div class="dialog-content">
        <p class="dialog-subtitle serif-text">请在下方书写你的学习心得与作业解答：</p>
        <el-input v-model="assignmentContent" type="textarea" :rows="6" placeholder="在此留下你的思考..." class="elegant-textarea" />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAssignment" :loading="submitting">郑重提交</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Lock } from '@element-plus/icons-vue'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const course = ref(null)
const currentUser = ref(null)

const activeTab = ref('guide')
const videoPlayerRef = ref(null)

// ================= 章节播放控制 =================
const chapterList = ref([])
const currentChapter = ref(null)

// 计算当前应该播放哪个视频源
const activeVideoUrl = computed(() => {
  if (currentChapter.value && currentChapter.value.video_url) {
    return currentChapter.value.video_url
  }
  return course.value?.video_url || 'https://www.w3schools.com/html/mov_bbb.mp4'
})

// 点击目录切集
const playChapter = (chapter) => {
  currentChapter.value = chapter
  // 等待 Vue 将新的 src 绑定到 video 标签后，执行播放
  nextTick(() => {
    if (videoPlayerRef.value) {
      videoPlayerRef.value.play()
      ElMessage({ message: `正在播放：${chapter.title}`, type: 'success', duration: 1500 })
    }
  })
}

// 选课与作业变量
const isEnrolled = ref(false)
const enrolling = ref(false)
const dialogVisible = ref(false)
const assignmentContent = ref('')
const submitting = ref(false)
const isSubmitted = ref(false)

// 笔记变量
const noteList = ref([])
const newNoteContent = ref('')
const savingNote = ref(false)

onMounted(async () => {
  const user = localStorage.getItem('user')
  if (!user) {
    router.push('/login')
    return
  }
  currentUser.value = JSON.parse(user)
  const courseId = route.params.id
  
  try {
    const res = await axios.get(`http://localhost:3000/api/courses/${courseId}`)
    if (res.data.success) { course.value = res.data.data }
  } catch (error) {
    router.push('/dashboard')
    return
  }

  // 加载章节目录
  try {
    const chapRes = await axios.get(`http://localhost:3000/api/courses/${courseId}/chapters`)
    if (chapRes.data.success && chapRes.data.data.length > 0) {
      chapterList.value = chapRes.data.data
      currentChapter.value = chapterList.value[0] // 默认选中第一集
      activeTab.value = 'chapters' // 如果有目录，优先展示目录 Tab
    }
  } catch (error) { console.error('加载章节失败', error) }

  await checkEnrollmentStatus(courseId)
  if (isEnrolled.value) { fetchTimelineNotes() }
})

const checkEnrollmentStatus = async (courseId) => {
  try {
    const res = await axios.get('http://localhost:3000/api/enrollments/check', {
      params: { student_id: currentUser.value.id, course_id: courseId }
    })
    if (res.data.success) { isEnrolled.value = res.data.isEnrolled }
  } catch (error) { console.error(error) }
}

const handleEnroll = async () => {
  enrolling.value = true
  try {
    const res = await axios.post('http://localhost:3000/api/enrollments', {
      student_id: currentUser.value.id,
      course_id: course.value.id
    })
    if (res.data.success) {
      ElMessage.success(res.data.message)
      isEnrolled.value = true
      fetchTimelineNotes()
    }
  } catch (error) {
    ElMessage.error('选课失败')
  } finally { enrolling.value = false }
}

// 笔记逻辑
const fetchTimelineNotes = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/notes', { params: { user_id: currentUser.value.id, course_id: course.value.id } })
    if (res.data.success) { noteList.value = res.data.data }
  } catch (error) {}
}

const saveTimelineNote = async () => {
  if (!newNoteContent.value.trim()) return ElMessage.warning('总要写点什么再装进时光胶囊吧')
  const currentSeconds = videoPlayerRef.value ? videoPlayerRef.value.currentTime : 0
  savingNote.value = true
  try {
    const res = await axios.post('http://localhost:3000/api/notes', {
      user_id: currentUser.value.id, course_id: course.value.id,
      content: newNoteContent.value, timestamp_secs: currentSeconds
    })
    if (res.data.success) {
      ElMessage.success(res.data.message)
      newNoteContent.value = ''
      fetchTimelineNotes()
    }
  } catch (error) {} finally { savingNote.value = false }
}

const seekToTimestamp = (seconds) => {
  if (videoPlayerRef.value) {
    videoPlayerRef.value.currentTime = seconds
    videoPlayerRef.value.play()
    ElMessage({ message: `已为你穿梭至 ${formatSeconds(seconds)}`, type: 'success', duration: 1000 })
  }
}

const formatSeconds = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60)
  const secs = Math.floor(totalSeconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const submitAssignment = async () => {
  if (!assignmentContent.value.trim()) return ElMessage.warning('作业内容不能是一张白纸')
  submitting.value = true
  try {
    const res = await axios.post('http://localhost:3000/api/assignments', {
      course_id: course.value.id, student_id: currentUser.value.id, content: assignmentContent.value
    })
    if (res.data.success) {
      dialogVisible.value = false
      isSubmitted.value = true
    }
  } catch (error) {} finally { submitting.value = false }
}
</script>

<style scoped>
/* 保持原有基础样式... */
.detail-page { min-height: 100vh; background-color: var(--paper-cream); }
.top-nav { height: 60px; display: flex; justify-content: space-between; align-items: center; padding: 0 40px; background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(106, 176, 133, 0.1); }
.back-btn { color: #8fa799; font-size: 16px; }
.back-btn:hover { color: var(--primary-green); }
.logo { color: var(--deep-green); font-size: 20px; font-weight: bold; }
.course-container { max-width: 1200px; margin: 40px auto; padding: 0 20px; display: grid; grid-template-columns: 2.5fr 1fr; gap: 30px; }

.player-wrapper { border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(106, 176, 133, 0.15); background-color: #000; line-height: 0; }
.styled-player { width: 100%; max-height: 500px; outline: none; }
.enroll-banner { background: linear-gradient(135deg, #eef7f2 0%, #e0ede5 100%); border-radius: 16px; height: 450px; display: flex; align-items: center; justify-content: center; box-shadow: 0 20px 40px rgba(106, 176, 133, 0.15); border: 1px solid rgba(106, 176, 133, 0.2); }
.banner-content { text-align: center; color: var(--deep-green); }
.lock-icon { font-size: 48px; color: var(--primary-green); margin-bottom: 15px; opacity: 0.8; }
.banner-content h2 { margin: 0 0 10px 0; font-size: 24px; }
.banner-content p { color: #8fa799; margin-bottom: 25px; }
.enroll-btn { padding: 12px 30px; font-size: 16px; border-radius: 20px; font-weight: bold; }

.info-section { margin-top: 30px; padding: 20px; background: #fff; border-radius: 16px; box-shadow: var(--shadow-soft); }
.info-section h1 { margin: 0 0 15px; color: var(--deep-green); font-size: 28px; }
.meta-tags { display: flex; gap: 15px; align-items: center; margin-bottom: 20px; }
.tag { background: var(--light-mint); color: var(--primary-green); padding: 4px 12px; border-radius: 12px; font-size: 14px; }
.teacher { color: #8fa799; font-size: 14px; }
.description { color: var(--text-main); line-height: 1.8; }

.sidebar { position: sticky; top: 80px; }
:deep(.elegant-tabs) { border: none; border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-soft); background: #fff; }
:deep(.elegant-tabs .el-tabs__item.is-active) { color: var(--primary-green) !important; background-color: #fff !important; font-weight: bold; border-top: 2px solid var(--primary-green) !important;}
.progress-card { padding: 10px 5px; text-align: center; }
.progress-card h3 { color: var(--deep-green); margin-top: 0; }
.encouragement { color: #8fa799; font-size: 13px; margin: 20px 0; line-height: 1.5; }
.action-btn { width: 100%; border-radius: 12px; }

/* 章节目录样式 */
.chapters-panel { display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto; padding-right: 5px; }
.chapter-item { display: flex; align-items: center; padding: 15px; border-radius: 12px; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; background: var(--paper-cream); }
.chapter-item:hover { transform: translateX(5px); border-color: #e0ede5; }
.chapter-item.is-playing { background: var(--light-mint); border-color: rgba(106, 176, 133, 0.4); }
.chapter-num { font-size: 12px; color: #8fa799; background: #fff; padding: 2px 8px; border-radius: 8px; margin-right: 12px; }
.is-playing .chapter-num { background: var(--primary-green); color: #fff; }
.chapter-title { flex: 1; font-size: 14px; color: var(--text-main); font-weight: 500; }
.is-playing .chapter-title { color: var(--primary-green); font-weight: bold; }
.play-icon { color: var(--primary-green); font-size: 18px; margin-left: 10px; }

/* 笔记面板样式 */
.notes-panel { display: flex; flex-direction: column; gap: 25px; text-align: left; }
.note-input-area { background: var(--paper-cream); padding: 15px; border-radius: 12px; border: 1px solid #e0ede5; }
.note-action-row { display: flex; justify-content: flex-end; margin-top: 10px; }
.notes-timeline { display: flex; flex-direction: column; gap: 15px; max-height: 300px; overflow-y: auto; padding-right: 5px; }
.mini-empty { text-align: center; color: #8fa799; font-size: 13px; padding: 20px 0; }
.timeline-item { border-left: 2px solid var(--light-mint); padding-left: 15px; position: relative; margin-left: 5px; }
.timeline-item::before { content: ''; position: absolute; width: 8px; height: 8px; background: var(--primary-green); border-radius: 50%; left: -5px; top: 5px; }
.time-badge { background: var(--light-mint); color: var(--primary-green); font-size: 12px; font-weight: bold; padding: 2px 8px; border-radius: 10px; cursor: pointer; transition: background 0.2s; }
.time-badge:hover { background: var(--primary-green); color: white; }
.note-text { color: var(--text-main); font-size: 14px; line-height: 1.5; margin: 6px 0 0 0; }

:deep(.elegant-dialog) { border-radius: 20px; overflow: hidden; }
:deep(.elegant-dialog .el-dialog__header) { background-color: var(--light-mint); margin-right: 0; padding: 20px; border-bottom: 1px solid rgba(106, 176, 133, 0.1); }
:deep(.elegant-dialog .el-dialog__title) { color: var(--deep-green); font-weight: bold; }
.dialog-subtitle { color: #8fa799; margin-top: 0; margin-bottom: 15px; }
:deep(.elegant-textarea .el-textarea__inner) { background-color: var(--paper-cream); border: 1px solid #e0ede5; border-radius: 12px; padding: 15px; font-size: 14px; line-height: 1.6; color: var(--text-main); box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
:deep(.elegant-textarea .el-textarea__inner:focus) { border-color: var(--primary-green); box-shadow: 0 0 0 1px var(--primary-green); }
.small-text :deep(.el-textarea__inner) { padding: 10px; font-size: 13px; background: #fff; }
</style>