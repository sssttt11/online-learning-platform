<template>
  <div class="community-page">
    <header class="navbar">
      <div class="nav-content">
        <div class="nav-logo serif-text" @click="router.push('/dashboard')" style="cursor: pointer;">栖学课堂</div>
        <el-button link @click="router.push('/dashboard')">← 返回课厅</el-button>
      </div>
    </header>

    <main class="main-container">
      <div class="page-header">
        <div>
          <h2 class="serif-text">栖学茶话会 🍵</h2>
          <p class="subtitle">在这里，分享你的思考，解答他人的疑惑。</p>
        </div>
        <el-button type="primary" class="post-btn" @click="dialogVisible = true">
          <i class="el-icon-edit"></i> 提笔发帖
        </el-button>
      </div>

      <div class="post-list" v-loading="loading">
        <el-card 
          v-for="post in postList" 
          :key="post.id" 
          class="post-card" 
          @click="router.push(`/post/${post.id}`)"
        >
          <h3 class="post-title serif-text">{{ post.title }}</h3>
          <p class="post-preview">{{ post.content }}</p>
          <div class="post-meta">
            <span class="author">
              <el-avatar :size="24" class="mini-avatar">{{ post.username.charAt(0) }}</el-avatar>
              {{ post.username }} <el-tag size="small" type="success" effect="plain" style="margin-left:5px">{{ post.grade || '学者' }}</el-tag>
            </span>
            <span class="comments-count">
              💬 {{ post.comment_count }} 条探讨
            </span>
          </div>
        </el-card>
        
        <div v-if="postList.length === 0 && !loading" class="empty-state">
          社区还在沉睡，快来发布第一篇探讨吧 🌿
        </div>
      </div>
    </main>

    <el-dialog v-model="dialogVisible" title="✍️ 提笔发帖" width="550px" class="elegant-dialog">
      <div class="dialog-content">
        <el-input v-model="postForm.title" placeholder="一句话概括你的探讨主题..." class="elegant-input mb-3" />
        <el-input
          v-model="postForm.content"
          type="textarea"
          :rows="8"
          placeholder="详细描述你的问题、心得或分享..."
          class="elegant-textarea"
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">将笔放下</el-button>
          <el-button type="primary" @click="submitPost" :loading="submitting">发布探讨</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const postList = ref([])
const loading = ref(false)

const dialogVisible = ref(false)
const submitting = ref(false)
const postForm = ref({ title: '', content: '' })
const currentUser = ref(null)

const fetchPosts = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:3000/api/posts')
    if (res.data.success) {
      postList.value = res.data.data
    }
  } catch (error) {
    ElMessage.error('获取社区列表失败')
  } finally {
    loading.value = false
  }
}

const submitPost = async () => {
  if (!postForm.value.title || !postForm.value.content) {
    return ElMessage.warning('标题和内容缺一不可哦')
  }
  submitting.value = true
  try {
    const res = await axios.post('http://localhost:3000/api/posts', {
      user_id: currentUser.value.id,
      title: postForm.value.title,
      content: postForm.value.content
    })
    if (res.data.success) {
      ElMessage.success('发布成功！')
      dialogVisible.value = false
      postForm.value = { title: '', content: '' }
      fetchPosts() // 刷新列表
    }
  } catch (error) {
    ElMessage.error('发布失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  const user = localStorage.getItem('user')
  if (user) {
    currentUser.value = JSON.parse(user)
    fetchPosts()
  } else {
    router.push('/login')
  }
})
</script>

<style scoped>
.community-page { min-height: 100vh; background-color: var(--light-mint); }
.navbar { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px); height: 64px; border-bottom: 1px solid rgba(106, 176, 133, 0.15); }
.nav-content { max-width: 1000px; margin: 0 auto; height: 100%; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; }
.nav-logo { font-size: 22px; font-weight: bold; color: var(--deep-green); }

.main-container { max-width: 800px; margin: 40px auto; padding: 0 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.page-header h2 { margin: 0 0 5px 0; color: var(--deep-green); font-size: 28px; }
.subtitle { color: #8fa799; margin: 0; font-size: 15px; }

.post-card { margin-bottom: 20px; border-radius: 16px; border: none; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
.post-card:hover { transform: translateY(-3px); box-shadow: 0 12px 24px rgba(106, 176, 133, 0.15) !important; }
.post-title { margin: 0 0 10px 0; font-size: 20px; color: var(--deep-green); }
.post-preview { color: var(--text-main); font-size: 15px; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 15px; }
.post-meta { display: flex; justify-content: space-between; align-items: center; color: #8fa799; font-size: 13px; border-top: 1px solid #f0f5f2; padding-top: 15px; }
.author { display: flex; align-items: center; gap: 8px; }
.mini-avatar { background-color: var(--primary-green); color: white; font-weight: bold; }
.empty-state { text-align: center; padding: 60px; color: #8fa799; }

.mb-3 { margin-bottom: 20px; }
:deep(.elegant-dialog) { border-radius: 20px; overflow: hidden; }
:deep(.elegant-dialog .el-dialog__header) { background-color: var(--light-mint); margin-right: 0; padding: 20px; border-bottom: 1px solid rgba(106,176,133,0.1); }
:deep(.elegant-textarea .el-textarea__inner), :deep(.elegant-input .el-input__wrapper) { background-color: var(--paper-cream); border: 1px solid #e0ede5; border-radius: 12px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
:deep(.elegant-textarea .el-textarea__inner:focus), :deep(.elegant-input .el-input__wrapper.is-focus) { border-color: var(--primary-green); box-shadow: 0 0 0 1px var(--primary-green); }
</style>