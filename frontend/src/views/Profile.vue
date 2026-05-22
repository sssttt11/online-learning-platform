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
              <el-avatar :size="80" class="elegant-avatar">{{ userInfo.username?.[0]?.toUpperCase() }}</el-avatar>
              <h3 class="serif-text">{{ userInfo.username }}</h3>
              <el-tag size="small" effect="plain" type="success">{{ userInfo.grade }}</el-tag>
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
          <div class="section-title">
            <h3 class="serif-text">我的书斋（已选课程）</h3>
          </div>

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
                    <span class="progress-label">已学进度：</span>
                    <el-progress :percentage="course.progress" color="#6ab085" />
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
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const userInfo = ref({})
const enrolledCourses = ref([])

// 修改基本资料表单
const editForm = ref({ username: '', grade: '' })
const updatingProfile = ref(false)

// 修改密码表单
const pwdDialogVisible = ref(false)
const pwdForm = ref({ oldPassword: '', newPassword: '' })
const updatingPwd = ref(false)

// 从后端拉取个人主页的完整数据
const loadProfileData = async () => {
  const localUser = JSON.parse(localStorage.getItem('user'))
  if (!localUser) {
    router.push('/login')
    return
  }

  try {
    const res = await axios.get(`http://localhost:3000/api/user/profile/${localUser.id}`)
    if (res.data.success) {
      userInfo.value = res.data.user
      enrolledCourses.value = res.data.enrolledCourses
      
      // 给编辑表单赋初始值
      editForm.value.username = res.data.user.username
      editForm.value.grade = res.data.user.grade
    }
  } catch (error) {
    ElMessage.error('加载个人资料失败')
  }
}

// 提交基本信息修改
const handleUpdateProfile = async () => {
  if (!editForm.value.username.trim()) {
    ElMessage.warning('用户名不能为空')
    return
  }

  updatingProfile.value = true
  try {
    const res = await axios.put(`http://localhost:3000/api/user/profile/${userInfo.value.id}`, editForm.value)
    if (res.data.success) {
      ElMessage.success('资料更新成功！')
      
      // 更新本地存储的缓存名字
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

// 提交密码修改
const handleUpdatePassword = async () => {
  if (!pwdForm.value.oldPassword || !pwdForm.value.newPassword) {
    ElMessage.warning('请填写完整的密码信息')
    return
  }

  updatingPwd.value = true
  try {
    const res = await axios.put(`http://localhost:3000/api/user/password/${userInfo.value.id}`, pwdForm.value)
    if (res.data.success) {
      ElMessage.success('密码修改成功，请重新登录')
      pwdDialogVisible.value = false
      
      // 密码改了之后强行退出，让其重新登录一次确保安全性
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

/* 左侧卡片 */
.info-card { padding: 10px; background: #fff; }
.avatar-box { text-align: center; padding: 10px 0; }
.elegant-avatar { background-color: var(--primary-green); font-size: 32px; margin-bottom: 15px; font-weight: bold;}
.avatar-box h3 { margin: 0 0 10px 0; color: var(--deep-green); font-size: 20px; }

/* 右侧列表 */
.section-title h3 { color: var(--deep-green); margin-top: 0; font-size: 22px; margin-bottom: 25px;}
.empty-state { text-align: center; padding: 60px; color: #8fa799; background: #fff; border-radius: 16px;}

.mini-course-card { background: #fff; }
.course-cover { width: 100%; height: 130px; object-fit: cover; }
.course-detail { padding: 15px; }
.course-detail h4 { margin: 0 0 12px 0; color: var(--text-main); font-size: 16px; }
.text-ellipsis { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.progress-box { margin: 10px 0; }
.progress-label { font-size: 12px; color: #8fa799; display: block; margin-bottom: 5px; }

/* 弹窗样式 */
:deep(.elegant-dialog) { border-radius: 20px; overflow: hidden; }
:deep(.elegant-dialog .el-dialog__header) { background-color: var(--light-mint); margin-right: 0; padding: 20px; }
</style>