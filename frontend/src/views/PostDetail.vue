<template>
  <div class="post-detail-page">
    <header class="navbar">
      <div class="nav-content">
        <el-button link @click="router.back()" class="back-btn">← 返回社区大厅</el-button>
        <div class="nav-logo serif-text">栖学课堂</div>
      </div>
    </header>

    <main class="main-container" v-if="post">
      <article class="post-article">
        <h1 class="serif-text title">{{ post.title }}</h1>
        <div class="author-info">
          <el-avatar :size="40" class="avatar">{{ post.username.charAt(0) }}</el-avatar>
          <div class="meta">
            <div class="name">{{ post.username }}</div>
            <div class="time">{{ new Date(post.created_at).toLocaleString() }}</div>
          </div>
        </div>
        <div class="content">{{ post.content }}</div>
      </article>

      <section class="comments-section">
        <h3 class="serif-text section-title">探讨与回复 ({{ comments.length }})</h3>
        
        <div class="comment-input-box">
          <el-input
            v-model="newComment"
            type="textarea"
            :rows="3"
            placeholder="写下你的见解..."
            class="elegant-textarea"
          />
          <div class="action-row">
            <el-button type="primary" @click="submitComment" :loading="submitting">发表回复</el-button>
          </div>
        </div>

        <div class="comment-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <el-avatar :size="32" class="avatar">{{ comment.username.charAt(0) }}</el-avatar>
            <div class="comment-body">
              <div class="comment-meta">
                <span class="name">{{ comment.username }}</span>
                <span class="time">{{ new Date(comment.created_at).toLocaleString() }}</span>
              </div>
              <div class="comment-content">{{ comment.content }}</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const post = ref(null)
const comments = ref([])

const newComment = ref('')
const submitting = ref(false)
const currentUser = ref(null)

const loadPostData = async () => {
  try {
    const res = await axios.get(`http://localhost:3000/api/posts/${route.params.id}`)
    if (res.data.success) {
      post.value = res.data.post
      comments.value = res.data.comments
    }
  } catch (error) {
    ElMessage.error('加载帖子失败')
    router.push('/community')
  }
}

const submitComment = async () => {
  if (!newComment.value.trim()) return ElMessage.warning('回复内容不能为空')
  
  submitting.value = true
  try {
    const res = await axios.post('http://localhost:3000/api/comments', {
      post_id: post.value.id,
      user_id: currentUser.value.id,
      content: newComment.value
    })
    if (res.data.success) {
      ElMessage.success('回复成功！')
      newComment.value = ''
      loadPostData() // 重新拉取评论列表
    }
  } catch (error) {
    ElMessage.error('回复失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  const user = localStorage.getItem('user')
  if (user) {
    currentUser.value = JSON.parse(user)
    loadPostData()
  } else {
    router.push('/login')
  }
})
</script>

<style scoped>
.post-detail-page { min-height: 100vh; background-color: var(--paper-cream); }
.navbar { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px); height: 64px; border-bottom: 1px solid rgba(106, 176, 133, 0.15); position: sticky; top: 0; z-index: 10;}
.nav-content { max-width: 800px; margin: 0 auto; height: 100%; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; }
.nav-logo { font-size: 20px; font-weight: bold; color: var(--deep-green); }
.back-btn { color: #8fa799; font-size: 15px; }

.main-container { max-width: 800px; margin: 40px auto; padding: 0 20px; }

/* 帖子正文 */
.post-article { background: #fff; padding: 40px; border-radius: 20px; box-shadow: var(--shadow-soft); margin-bottom: 30px; }
.title { margin: 0 0 20px 0; font-size: 32px; color: var(--deep-green); line-height: 1.4; }
.author-info { display: flex; align-items: center; gap: 15px; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #f0f5f2; }
.avatar { background-color: var(--primary-green); color: white; font-weight: bold; }
.meta .name { font-weight: bold; color: var(--text-main); font-size: 16px; }
.meta .time { color: #8fa799; font-size: 13px; margin-top: 4px; }
.content { font-size: 16px; line-height: 1.8; color: var(--text-main); white-space: pre-wrap; }

/* 评论区 */
.comments-section { background: #fff; padding: 40px; border-radius: 20px; box-shadow: var(--shadow-soft); }
.section-title { margin-top: 0; color: var(--deep-green); border-bottom: 2px solid var(--light-mint); padding-bottom: 10px; margin-bottom: 20px;}
.comment-input-box { margin-bottom: 40px; }
.action-row { display: flex; justify-content: flex-end; margin-top: 15px; }

.comment-list { display: flex; flex-direction: column; gap: 20px; }
.comment-item { display: flex; gap: 15px; padding-bottom: 20px; border-bottom: 1px solid #f0f5f2; }
.comment-item:last-child { border-bottom: none; }
.comment-body { flex: 1; }
.comment-meta { margin-bottom: 8px; }
.comment-meta .name { font-weight: bold; color: var(--text-main); margin-right: 10px; font-size: 14px;}
.comment-meta .time { color: #8fa799; font-size: 12px; }
.comment-content { font-size: 15px; line-height: 1.6; color: var(--text-main); white-space: pre-wrap; }

:deep(.elegant-textarea .el-textarea__inner) { background-color: var(--paper-cream); border: 1px solid #e0ede5; border-radius: 12px; padding: 15px; }
:deep(.elegant-textarea .el-textarea__inner:focus) { border-color: var(--primary-green); box-shadow: 0 0 0 1px var(--primary-green); }
</style>