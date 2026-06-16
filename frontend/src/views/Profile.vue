<template>
  <div class="profile-page">
    <header class="navbar">
      <div class="nav-content">
        <div class="nav-logo serif-text" @click="router.push('/dashboard')" style="cursor: pointer;">栖学课堂</div>
        <el-button link @click="router.push('/dashboard')">返回课厅 ←</el-button>
      </div>
    </header>

    <main class="profile-container">
      <el-row :gutter="30">
        
        <el-col :span="8">
          <el-card class="info-card">
            <div class="avatar-box">
              <el-avatar :size="80" class="elegant-avatar">{{ userInfo.username?.[0]?.toUpperCase() || 'U' }}</el-avatar>
              <h3 class="serif-text">{{ userInfo.username || '加载中...' }}</h3>
              <el-tag size="small" effect="plain" type="success" v-if="userInfo.grade">{{ userInfo.grade }}</el-tag>
            </div>

            <el-divider />

            <el-form label-position="top" size="default">
              <el-form-item label="更改用户名">
                <el-input v-model="editForm.username" placeholder="请输入新用户名" />
              </el-form-item>
              <el-form-item label="当前年级">
                <el-select v-model="editForm.grade" style="width: 100%;">
                  <el-option label="大一 · 启航" value="大一" />
                  <el-option label="大二 · 探索" value="大二" />
                  <el-option label="大三 · 笃行" value="大三" />
                  <el-option label="大四 · 毕业" value="大四" />
                  <el-option label="研究生 · 深造" value="研究生" />
                </el-select>
              </el-form-item>
              <el-button type="primary" style="width: 100%;" @click="handleUpdateProfile" :loading="updatingProfile">
                保存基本资料
              </el-button>
            </el-form>

            <el-divider />
            
            <el-button type="danger" plain style="width: 100%;" @click="pwdDialogVisible = true">
              修改账户密码
            </el-button>
          </el-card>
        </el-col>

        <el-col :span="16">
          <el-tabs v-model="activeTab" class="elegant-tabs" type="border-card">
            
            <el-tab-pane label="📚 我的书斋" name="courses">
              <div v-if="enrolledCourses.length === 0" class="empty-state">
                <p>书斋空空如也，快去大厅挑选心仪的课程吧 🌿</p>
              </div>

              <el-row :gutter="20" v-else>
                <el-col :span="12" v-for="course in enrolledCourses" :key="course.id" style="margin-bottom: 20px;">
                  <el-card :body-style="{ padding: '0px' }" class="mini-course-card">
                    <img :src="course.cover_image" class="course-cover" />
                    <div class="course-detail">
                      <h4 class="text-ellipsis">{{ course.title }}</h4>
                      
                      <div class="progress-box">
                        <span class="progress-label">
                          已学进度：{{ course.completed_chapters || 0 }} / {{ course.total_chapters || 1 }} 讲
                        </span>
                        <el-progress 
                          :percentage="calculateProgress(course.completed_chapters, course.total_chapters)" 
                          :color="calculateProgress(course.completed_chapters, course.total_chapters) === 100 ? '#e6a23c' : '#6ab085'" 
                        />
                      </div>

                      <div style="text-align: right; margin-top: 10px;">
                        <el-button type="primary" size="small" plain @click="router.push(`/course/${course.id}`)">
                          继续研读
                        </el-button>
                      </div>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </el-tab-pane>

            <el-tab-pane label="✍️ 我的笔记" name="notes">
              <div v-if="myNotes.length === 0" class="empty-state">你还没有在视频中留下过时光笔记哦。</div>
              <div class="notes-timeline" v-else>
                <el-timeline style="padding-left: 0; margin-top: 10px;">
                  <el-timeline-item 
                    v-for="note in myNotes" 
                    :key="note.id" 
                    :timestamp="new Date(note.created_at).toLocaleString()" 
                    placement="top"
                    color="#6ab085"
                  >
                    <el-card shadow="hover" class="note-card">
                      <h4 style="margin: 0 0 10px 0; color: var(--primary-green);">来自《{{ note.course_title }}》</h4>
                      <p style="margin: 0; color: var(--text-main); line-height: 1.6;">{{ note.content }}</p>
                    </el-card>
                  </el-timeline-item>
                </el-timeline>
              </div>
            </el-tab-pane>

          </el-tabs>
        </el-col>
      </el-row>
    </main>

    <el-dialog v-model="pwdDialogVisible" title="🔐 修改账户密码" width="400px" class="elegant-dialog">
      <el-form label-position="top">
        <el-form-item label="原密码">
          <el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="请输入旧密码" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="请设置新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpdatePassword" :loading="updatingPwd">确认修改</el-button>
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
const userInfo = ref({})

// 右侧展示变量
const enrolledCourses = ref([])
const myNotes = ref([])
const activeTab = ref('courses')

// 修改基本资料表单
const editForm = ref({ username: '', grade: '' })
const updatingProfile = ref(false)

// 修改密码表单
const pwdDialogVisible = ref(false)
const pwdForm = ref({ oldPassword: '', newPassword: '' })
const updatingPwd = ref(false)

// 计算真实的百分比进度
const calculateProgress = (completed, total) => {
  if (!total || total === 0) return 0
  return Math.round((completed / total) * 100)
}

// 整合加载数据的逻辑
const loadProfileData = async () => {
  const localUser = JSON.parse(localStorage.getItem('user'))
  if (!localUser) {
    router.push('/login')
    return
  }

  // 1. 保留你原有的加载个人信息逻辑
  try {
    const res = await axios.get(`http://47.99.85.173:3000/api/user/profile/${localUser.id}`)
    if (res.data.success) {
      userInfo.value = res.data.user
      editForm.value.username = res.data.user.username
      editForm.value.grade = res.data.user.grade
    }
  } catch (error) {
    // 兜底：如果你的旧接口没写，就直接用本地缓存显示
    userInfo.value = localUser
    editForm.value.username = localUser.username
  }

  // 2. 拉取带有真实进度的课程列表（新接口）
  try {
    const courseRes = await axios.get(`http://47.99.85.173:3000/api/users/${localUser.id}/enrolled-courses`)
    if (courseRes.data.success) {
      enrolledCourses.value = courseRes.data.data
    }
  } catch (error) {}

  // 3. 拉取时光笔记（新接口）
  try {
    const noteRes = await axios.get(`http://47.99.85.173:3000/api/users/${localUser.id}/all-notes`)
    if (noteRes.data.success) {
      myNotes.value = noteRes.data.data
    }
  } catch (error) {}
}

// 保留你的提交基本信息修改
const handleUpdateProfile = async () => {
  if (!editForm.value.username.trim()) {
    return ElMessage.warning('用户名不能为空')
  }

  updatingProfile.value = true
  try {
    const res = await axios.put(`http://47.99.85.173:3000/api/user/profile/${userInfo.value.id || JSON.parse(localStorage.getItem('user')).id}`, editForm.value)
    if (res.data.success) {
      ElMessage.success('资料更新成功！')
      
      const localUser = JSON.parse(localStorage.getItem('user'))
      localUser.username = editForm.value.username
      localStorage.setItem('user', JSON.stringify(localUser))
      
      loadProfileData() // 刷新页面数据
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '更新失败')
  } finally {
    updatingProfile.value = false
  }
}

// 保留你的提交密码修改
const handleUpdatePassword = async () => {
  if (!pwdForm.value.oldPassword || !pwdForm.value.newPassword) {
    return ElMessage.warning('请填写完整的密码信息')
  }

  updatingPwd.value = true
  try {
    const res = await axios.put(`http://47.99.85.173:3000/api/user/password/${userInfo.value.id || JSON.parse(localStorage.getItem('user')).id}`, pwdForm.value)
    if (res.data.success) {
      ElMessage.success('密码修改成功，请重新登录')
      pwdDialogVisible.value = false
      localStorage.clear()
      router.push('/login')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '修改失败')
  } finally {
    updatingPwd.value = false
  }
}

onMounted(() => {
  loadProfileData()
})
</script>

<style scoped>
.profile-page { min-height: 100vh; background-color: var(--paper-cream); }

.navbar {
  background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px);
  height: 64px; border-bottom: 1px solid rgba(106, 176, 133, 0.15);
}
.nav-content {
  max-width: 1200px; margin: 0 auto; height: 100%;
  display: flex; justify-content: space-between; align-items: center; padding: 0 20px;
}
.nav-logo { font-size: 22px; font-weight: bold; color: var(--deep-green); }

.profile-container { max-width: 1200px; margin: 40px auto; padding: 0 20px; }

/* 左侧卡片 (完全保留原样) */
.info-card { padding: 10px; background: #fff; border-radius: 16px; border: none; box-shadow: var(--shadow-soft); }
.avatar-box { text-align: center; padding: 10px 0; }
.elegant-avatar { background-color: var(--primary-green); font-size: 32px; margin-bottom: 15px; font-weight: bold;}
.avatar-box h3 { margin: 0 0 10px 0; color: var(--deep-green); font-size: 20px; }

/* 右侧列表 (融入新样式) */
.empty-state { text-align: center; padding: 60px; color: #8fa799; background: #fff; border-radius: 16px;}
.mini-course-card { background: #fff; border-radius: 12px; transition: transform 0.3s, box-shadow 0.3s; border: 1px solid #f0f5f2; }
.mini-course-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(106, 176, 133, 0.1); }
.course-cover { width: 100%; height: 130px; object-fit: cover; border-top-left-radius: 12px; border-top-right-radius: 12px; }
.course-detail { padding: 15px; }
.course-detail h4 { margin: 0 0 12px 0; color: var(--text-main); font-size: 16px; }
.text-ellipsis { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.progress-box { margin: 10px 0; }
.progress-label { font-size: 12px; color: #8fa799; display: flex; justify-content: space-between; margin-bottom: 5px; }

/* 新增的面板样式 */
:deep(.elegant-tabs) { border: none; border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-soft); background: #fff; min-height: 500px; }
:deep(.elegant-tabs .el-tabs__item.is-active) { color: var(--primary-green) !important; font-weight: bold; border-top: 2px solid var(--primary-green) !important; }
.notes-timeline { padding: 20px; }
.note-card { border-radius: 12px; border: 1px solid #e0ede5; box-shadow: none; background: var(--paper-cream); }

/* 弹窗样式 (完全保留原样) */
:deep(.elegant-dialog) { border-radius: 20px; overflow: hidden; }
:deep(.elegant-dialog .el-dialog__header) { background-color: var(--light-mint); margin-right: 0; padding: 20px; }
</style>