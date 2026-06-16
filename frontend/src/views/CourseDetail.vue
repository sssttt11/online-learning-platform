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

        <div v-else>
          <div class="player-wrapper">
            <iframe 
              v-if="isBilibiliVideo"
              class="styled-player bilibili-iframe"
              :src="bilibiliEmbedUrl" 
              scrolling="no" 
              border="0" 
              frameborder="no" 
              framespacing="0" 
              allowfullscreen="true"
              referrerpolicy="no-referrer">
            </iframe>
            <video 
              v-else
              ref="videoPlayerRef"
              class="styled-player" 
              controls 
              :src="activeVideoUrl" 
              :poster="course.cover_image"
              @ended="markChapterCompleted">
              您的浏览器不支持视频播放。
            </video>
          </div>
          
          <div class="action-bar" v-if="isEnrolled && currentChapter" style="margin-top: 15px; display: flex; justify-content: flex-end;">
            <el-button 
              v-if="completedChapters.includes(currentChapter.id)" 
              type="success" plain disabled round size="small">
              <i class="el-icon-check"></i> 本讲已学完
            </el-button>
            <el-button 
              v-else 
              type="primary" round size="small" @click="markChapterCompleted" :loading="markingProgress">
              ✅ 标记本讲为已学完
            </el-button>
          </div>
        </div>
        
        <div class="info-section">
          <h1 class="serif-text">{{ currentChapter ? currentChapter.title : course.title }}</h1>
          <div class="meta-tags">
            <span class="tag">{{ course.category }}</span>
            <span class="teacher">主讲：{{ course.teacher_name || '特邀导师' }}</span>
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
                <i v-if="completedChapters.includes(chapter.id)" class="el-icon-check" style="color: #6ab085; margin-left: 10px;"></i>
                <i v-else-if="currentChapter && currentChapter.id === chapter.id" class="el-icon-video-play play-icon"></i>
              </div>
            </div>
            <div v-else class="mini-empty" style="padding: 40px 0;">请先选修本门课程</div>
          </el-tab-pane>

          <el-tab-pane label="📋 研读向导" name="guide">
            <div class="progress-card">
              <h3 class="serif-text">学习进度</h3>
              <el-progress :percentage="isEnrolled ? courseProgress : 0" color="#6ab085" :stroke-width="12" />
              <p class="encouragement" style="margin-top: 15px;">
                {{ isEnrolled ? `已完成 ${completedChapters.length} / ${chapterList.length} 讲` : '选修课程后即可记录学习进度' }}
              </p>
              <el-button type="primary" class="action-btn" plain @click="dialogVisible = true" :disabled="isSubmitted || !isEnrolled">
                {{ !isEnrolled ? '请先选修课程' : (isSubmitted ? '作业已提交 (待批阅)' : '撰写课程作业') }}
              </el-button>
            </div>
          </el-tab-pane>

          <el-tab-pane label="💬 课程评价" name="comments">
            <div class="notes-panel">
              <div class="note-input-area" v-if="isEnrolled">
                <div style="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                  <span style="font-size: 13px; color: #8fa799;">课程打分:</span>
                  <el-rate v-model="newRating" :colors="['#8fa799', '#6ab085', '#ff9900']"></el-rate>
                </div>
                <el-input v-model="newCommentContent" type="textarea" :rows="3" placeholder="这门课对你有帮助吗？写下你的评价吧..." class="elegant-textarea small-text" />
                <div class="note-action-row">
                  <el-button type="primary" size="small" @click="submitCourseComment" :loading="submittingComment">发表评价</el-button>
                </div>
              </div>
              <div v-else class="mini-empty" style="padding: 20px 0; border-bottom: 1px solid #f0f5f2;">请先选修本门课程，方可进行评价</div>

              <div class="comments-list">
                <div v-if="courseComments.length === 0" class="mini-empty">暂无评价，快来抢第一条热评吧 🌿</div>
                <div v-for="comment in courseComments" :key="comment.id" class="comment-item">
                  <div class="comment-header">
                    <span class="comment-author">{{ comment.username }}</span>
                    <el-rate :model-value="comment.rating" disabled size="small" />
                  </div>
                  <p class="comment-text">{{ comment.content }}</p>
                  <span class="comment-time">{{ new Date(comment.created_at).toLocaleString() }}</span>
                </div>
              </div>
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
                <div v-if="noteList.length === 0" class="mini-empty">暂无随堂笔记，随时写下灵感吧 🌿</div>
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

    <div v-if="isEnrolled">
      <div class="ai-fab" @click="aiChatVisible = !aiChatVisible">
        🤖
      </div>

      <transition name="fade-slide">
        <div v-show="aiChatVisible" class="ai-chat-window">
          <div class="ai-header">
            <span>✨ 栖学 AI 助教</span>
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
              placeholder="向 AI 提问..." 
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

const chapterList = ref([])
const currentChapter = ref(null)

// ================== 🌟 新增：学习进度控制变量 ==================
const completedChapters = ref([]) 
const markingProgress = ref(false)

const courseProgress = computed(() => {
  if (chapterList.value.length === 0) return 0
  const percent = (completedChapters.value.length / chapterList.value.length) * 100
  return Math.round(percent)
})

const fetchProgress = async () => {
  try {
    const res = await axios.get('http://47.99.85.173:3000/api/progress', {
      params: { user_id: currentUser.value.id, course_id: course.value.id }
    })
    if (res.data.success) {
      completedChapters.value = res.data.data
    }
  } catch (error) { console.error('获取进度失败', error) }
}

const markChapterCompleted = async () => {
  if (!currentChapter.value) return
  markingProgress.value = true
  try {
    const res = await axios.post('http://47.99.85.173:3000/api/progress', {
      user_id: currentUser.value.id,
      course_id: course.value.id,
      chapter_id: currentChapter.value.id
    })
    if (res.data.success) {
      ElMessage.success(res.data.message)
      fetchProgress() 
    }
  } catch (error) {
    ElMessage.error('网络繁忙，打卡失败')
  } finally {
    markingProgress.value = false
  }
}
// =========================================================

const activeVideoUrl = computed(() => {
  if (currentChapter.value && currentChapter.value.video_url) {
    return currentChapter.value.video_url
  }
  return course.value?.video_url || 'https://www.w3schools.com/html/mov_bbb.mp4'
})

const isBilibiliVideo = computed(() => {
  if (!activeVideoUrl.value) return false
  return activeVideoUrl.value.includes('bilibili.com') || activeVideoUrl.value.includes('b23.tv')
})

const bilibiliEmbedUrl = computed(() => {
  if (!activeVideoUrl.value) return ''
  const bvMatch = activeVideoUrl.value.match(/(BV[a-zA-Z0-9]+)/)
  const pMatch = activeVideoUrl.value.match(/p=(\d+)/)
  const p = pMatch ? pMatch[1] : 1
  if (bvMatch && bvMatch[1]) {
    const bvid = bvMatch[1]
    return `https://player.bilibili.com/player.html?isOutside=true&bvid=${bvid}&page=${p}&autoplay=0`
  }
  return activeVideoUrl.value
})

const playChapter = (chapter) => {
  currentChapter.value = chapter
  nextTick(() => {
    if (!isBilibiliVideo.value && videoPlayerRef.value) {
      videoPlayerRef.value.play()
    }
    ElMessage({ message: `正在播放：${chapter.title}`, type: 'success', duration: 1500 })
  })
}

const isEnrolled = ref(false)
const enrolling = ref(false)
const dialogVisible = ref(false)
const assignmentContent = ref('')
const submitting = ref(false)
const isSubmitted = ref(false)

const noteList = ref([])
const newNoteContent = ref('')
const savingNote = ref(false)

const courseComments = ref([])
const newCommentContent = ref('')
const newRating = ref(5)
const submittingComment = ref(false)

const aiChatVisible = ref(false)
const aiInput = ref('')
const aiThinking = ref(false)
const chatScrollRef = ref(null)

const chatMessages = ref([
  { role: 'ai', content: '你好呀！我是栖学课堂专属 AI 助教 🌿。学习上遇到什么问题，或者没听懂的地方，都可以问我哦！' }
])

const scrollToBottom = () => {
  if (chatScrollRef.value) {
    chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight
  }
}

const sendAiMessage = async () => {
  const userText = aiInput.value.trim()
  if (!userText || aiThinking.value) return

  chatMessages.value.push({ role: 'user', content: userText })
  aiInput.value = ''
  aiThinking.value = true
  nextTick(() => scrollToBottom())

  try {
    const res = await axios.post('http://47.99.85.173:3000/api/chat', { message: userText })
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

onMounted(async () => {
  const user = localStorage.getItem('user')
  if (!user) {
    router.push('/login')
    return
  }
  currentUser.value = JSON.parse(user)
  const courseId = route.params.id
  
  try {
    const res = await axios.get(`http://47.99.85.173:3000/api/courses/${courseId}`)
    if (res.data.success) { course.value = res.data.data }
  } catch (error) {
    router.push('/dashboard')
    return
  }

  try {
    const chapRes = await axios.get(`http://47.99.85.173:3000/api/courses/${courseId}/chapters`)
    if (chapRes.data.success && chapRes.data.data.length > 0) {
      chapterList.value = chapRes.data.data
      currentChapter.value = chapterList.value[0] 
      activeTab.value = 'chapters' 
    }
  } catch (error) {}

  await checkEnrollmentStatus(courseId)
  if (isEnrolled.value) { 
    fetchTimelineNotes() 
    fetchProgress() // 🌟 拉取进度
  }
  fetchCourseComments()
})

const checkEnrollmentStatus = async (courseId) => {
  try {
    const res = await axios.get('http://47.99.85.173:3000/api/enrollments/check', {
      params: { student_id: currentUser.value.id, course_id: courseId }
    })
    if (res.data.success) { isEnrolled.value = res.data.isEnrolled }
  } catch (error) {}
}

const handleEnroll = async () => {
  enrolling.value = true
  try {
    const res = await axios.post('http://47.99.85.173:3000/api/enrollments', {
      student_id: currentUser.value.id,
      course_id: course.value.id
    })
    if (res.data.success) {
      ElMessage.success(res.data.message)
      isEnrolled.value = true
      fetchTimelineNotes()
      fetchProgress() // 🌟 选课后拉取进度
    }
  } catch (error) {} finally { enrolling.value = false }
}

const fetchCourseComments = async () => {
  try {
    const res = await axios.get(`http://47.99.85.173:3000/api/courses/${course.value.id}/comments`)
    if (res.data.success) { courseComments.value = res.data.data }
  } catch (error) {}
}

const submitCourseComment = async () => {
  if (!newCommentContent.value.trim()) return ElMessage.warning('请写下你的评价内容哦')
  submittingComment.value = true
  try {
    const res = await axios.post(`http://47.99.85.173:3000/api/courses/${course.value.id}/comments`, {
      user_id: currentUser.value.id, content: newCommentContent.value, rating: newRating.value
    })
    if (res.data.success) {
      ElMessage.success('发布评价成功！'); newCommentContent.value = ''; newRating.value = 5; fetchCourseComments() 
    }
  } catch (error) { ElMessage.error('发布评价失败') } finally { submittingComment.value = false }
}

const fetchTimelineNotes = async () => {
  try {
    const res = await axios.get('http://47.99.85.173:3000/api/notes', { params: { user_id: currentUser.value.id, course_id: course.value.id } })
    if (res.data.success) { noteList.value = res.data.data }
  } catch (error) {}
}

const saveTimelineNote = async () => {
  if (!newNoteContent.value.trim()) return ElMessage.warning('总要写点什么再装进时光胶囊吧')
  let currentSeconds = 0
  if (!isBilibiliVideo.value && videoPlayerRef.value) { currentSeconds = videoPlayerRef.value.currentTime }
  savingNote.value = true
  try {
    const res = await axios.post('http://47.99.85.173:3000/api/notes', {
      user_id: currentUser.value.id, course_id: course.value.id,
      content: newNoteContent.value, timestamp_secs: currentSeconds
    })
    if (res.data.success) {
      ElMessage.success(isBilibiliVideo.value ? '笔记已保存' : res.data.message); newNoteContent.value = ''; fetchTimelineNotes()
    }
  } catch (error) {} finally { savingNote.value = false }
}

const seekToTimestamp = (seconds) => {
  if (isBilibiliVideo.value) { return ElMessage.warning('B站视频由于跨域限制，暂不支持时间轴穿梭哦') }
  if (videoPlayerRef.value) {
    videoPlayerRef.value.currentTime = seconds; videoPlayerRef.value.play(); ElMessage({ message: `已为你穿梭至 ${formatSeconds(seconds)}`, type: 'success', duration: 1000 })
  }
}

const formatSeconds = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60); const secs = Math.floor(totalSeconds % 60); return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const submitAssignment = async () => {
  if (!assignmentContent.value.trim()) return ElMessage.warning('作业内容不能是一张白纸')
  submitting.value = true
  try {
    const res = await axios.post('http://47.99.85.173:3000/api/assignments', {
      course_id: course.value.id, student_id: currentUser.value.id, content: assignmentContent.value
    })
    if (res.data.success) { dialogVisible.value = false; isSubmitted.value = true }
  } catch (error) {} finally { submitting.value = false }
}
</script>

<style scoped>
.detail-page { min-height: 100vh; background-color: var(--paper-cream); }
.top-nav { height: 60px; display: flex; justify-content: space-between; align-items: center; padding: 0 40px; background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(106, 176, 133, 0.1); }
.back-btn { color: #8fa799; font-size: 16px; }
.back-btn:hover { color: var(--primary-green); }
.logo { color: var(--deep-green); font-size: 20px; font-weight: bold; }
.course-container { max-width: 1200px; margin: 40px auto; padding: 0 20px; display: grid; grid-template-columns: 2.5fr 1fr; gap: 30px; }

.player-wrapper { border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(106, 176, 133, 0.15); background-color: #000; line-height: 0; }
.styled-player { width: 100%; max-height: 500px; outline: none; }
.bilibili-iframe { width: 100%; height: 500px; background-color: #000; } 

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

.chapters-panel { display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto; padding-right: 5px; }
.chapter-item { display: flex; align-items: center; padding: 15px; border-radius: 12px; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; background: var(--paper-cream); }
.chapter-item:hover { transform: translateX(5px); border-color: #e0ede5; }
.chapter-item.is-playing { background: var(--light-mint); border-color: rgba(106, 176, 133, 0.4); }
.chapter-num { font-size: 12px; color: #8fa799; background: #fff; padding: 2px 8px; border-radius: 8px; margin-right: 12px; }
.is-playing .chapter-num { background: var(--primary-green); color: #fff; }
.chapter-title { flex: 1; font-size: 14px; color: var(--text-main); font-weight: 500; }
.is-playing .chapter-title { color: var(--primary-green); font-weight: bold; }
.play-icon { color: var(--primary-green); font-size: 18px; margin-left: 10px; }

.notes-panel { display: flex; flex-direction: column; gap: 25px; text-align: left; }
.note-input-area { background: var(--paper-cream); padding: 15px; border-radius: 12px; border: 1px solid #e0ede5; }
.note-action-row { display: flex; justify-content: flex-end; margin-top: 10px; }
.notes-timeline, .comments-list { display: flex; flex-direction: column; gap: 15px; max-height: 350px; overflow-y: auto; padding-right: 5px; }
.mini-empty { text-align: center; color: #8fa799; font-size: 13px; padding: 20px 0; }

.timeline-item { border-left: 2px solid var(--light-mint); padding-left: 15px; position: relative; margin-left: 5px; }
.timeline-item::before { content: ''; position: absolute; width: 8px; height: 8px; background: var(--primary-green); border-radius: 50%; left: -5px; top: 5px; }
.time-badge { background: var(--light-mint); color: var(--primary-green); font-size: 12px; font-weight: bold; padding: 2px 8px; border-radius: 10px; cursor: pointer; transition: background 0.2s; }
.time-badge:hover { background: var(--primary-green); color: white; }
.note-text { color: var(--text-main); font-size: 14px; line-height: 1.5; margin: 6px 0 0 0; }

.comment-item { padding: 12px; background: #fff; border: 1px solid #f0f5f2; border-radius: 12px; transition: background 0.2s; }
.comment-item:hover { background: #fafdfa; }
.comment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.comment-author { font-size: 13px; font-weight: bold; color: var(--deep-green); }
.comment-text { font-size: 14px; color: var(--text-main); margin: 0 0 8px 0; line-height: 1.5; }
.comment-time { font-size: 12px; color: #a4babb; }

:deep(.elegant-dialog) { border-radius: 20px; overflow: hidden; }
:deep(.elegant-dialog .el-dialog__header) { background-color: var(--light-mint); margin-right: 0; padding: 20px; border-bottom: 1px solid rgba(106, 176, 133, 0.1); }
:deep(.elegant-dialog .el-dialog__title) { color: var(--deep-green); font-weight: bold; }
.dialog-subtitle { color: #8fa799; margin-top: 0; margin-bottom: 15px; }
:deep(.elegant-textarea .el-textarea__inner) { background-color: var(--paper-cream); border: 1px solid #e0ede5; border-radius: 12px; padding: 15px; font-size: 14px; line-height: 1.6; color: var(--text-main); box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
:deep(.elegant-textarea .el-textarea__inner:focus) { border-color: var(--primary-green); box-shadow: 0 0 0 1px var(--primary-green); }
.small-text :deep(.el-textarea__inner) { padding: 10px; font-size: 13px; background: #fff; }

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