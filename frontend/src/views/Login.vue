<template>
  <div class="login-page">
    <div class="bg-glow glow-1"></div>
    <div class="bg-glow glow-2"></div>

    <div class="glass-container">
      <div class="brand">
        <div class="logo serif-text">栖</div>
        <h1 class="serif-text">栖学课堂</h1>
        <p>静心探索，遇见更好的自己</p>
      </div>

      <el-form :model="loginForm" class="custom-form" size="large">
        <el-form-item>
          <el-input 
            v-model="loginForm.username" 
            placeholder="请输入学号 / 账号" 
            class="elegant-input"
          />
        </el-form-item>
        <el-form-item>
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码" 
            show-password 
            class="elegant-input"
          />
        </el-form-item>
        <el-button type="primary" class="login-btn" @click="handleLogin" :loading="loading">
          进入课堂
        </el-button>
        <div style="margin-top: 20px; text-align: center; font-size: 14px;">
          <span style="color: #8fa799;">还没有账号？</span>
          <el-button link style="color: var(--primary-green); font-weight: bold;" @click="router.push('/register')">
            立即注册
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const loading = ref(false)
const loginForm = ref({ username: '', password: '' })

const handleLogin = async () => {
  if (!loginForm.value.username || !loginForm.value.password) {
    ElMessage.warning('请填写完整的账号与密码')
    return
  }
  loading.value = true
  try {
    const res = await axios.post('http://localhost:3000/api/login', loginForm.value)
    if (res.data.success) {
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      ElMessage({ message: '欢迎回来，栖学者', type: 'success', customClass: 'elegant-msg' })
      router.push('/dashboard')
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '连接服务器失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  background-color: var(--paper-cream);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

/* 模拟宣纸上晕染的水墨/水彩渐变 */
.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
}
.glow-1 {
  width: 400px;
  height: 400px;
  background: rgba(106, 176, 133, 0.2);
  top: -100px;
  left: -100px;
}
.glow-2 {
  width: 500px;
  height: 500px;
  background: rgba(197, 164, 126, 0.15); /* 淡淡的纸张金 */
  bottom: -150px;
  right: -100px;
}

.glass-container {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 50px 40px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
  width: 380px;
}

.brand {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  background: var(--primary-green);
  color: white;
  width: 56px;
  height: 56px;
  line-height: 56px;
  border-radius: 16px;
  font-size: 28px;
  margin: 0 auto 16px;
  box-shadow: 0 8px 16px rgba(106, 176, 133, 0.3);
}

.brand h1 {
  color: var(--deep-green);
  margin: 0;
  font-size: 28px;
  letter-spacing: 4px;
}

.brand p {
  color: #8fa799;
  font-size: 14px;
  margin-top: 8px;
  letter-spacing: 1px;
}

/* 输入框定制化，去掉生硬的边框 */
:deep(.elegant-input .el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02) !important;
  padding: 4px 15px;
}
:deep(.elegant-input .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--primary-green) !important;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  margin-top: 15px;
}
</style>