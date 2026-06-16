<template>
  <div class="register-page">
    <div class="bg-glow glow-1"></div>
    <div class="bg-glow glow-2"></div>

    <div class="glass-container">
      <div class="brand">
        <div class="logo serif-text">栖</div>
        <h1 class="serif-text">新学者注册</h1>
        <p>开启你的专属学习之旅</p>
      </div>

      <el-form :model="regForm" class="custom-form" size="large">
        <el-form-item>
          <el-input 
            v-model="regForm.username" 
            placeholder="请设置学号 / 账号" 
            class="elegant-input"
          />
        </el-form-item>
        <el-form-item>
          <el-input 
            v-model="regForm.password" 
            type="password" 
            placeholder="请设置密码" 
            show-password 
            class="elegant-input"
          />
        </el-form-item>
        <el-form-item>
          <el-input 
            v-model="regForm.confirmPassword" 
            type="password" 
            placeholder="请再次确认密码" 
            show-password 
            class="elegant-input"
          />
        </el-form-item>
        
        <el-button type="primary" class="submit-btn" @click="handleRegister" :loading="loading">
          立即注册
        </el-button>

        <div class="footer-links">
          <span class="hint-text">已有账号？</span>
          <el-button link class="nav-link" @click="router.push('/login')">返回登录</el-button>
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
const regForm = ref({ username: '', password: '', confirmPassword: '' })

const handleRegister = async () => {
  if (!regForm.value.username || !regForm.value.password) {
    ElMessage.warning('请填写完整的账号与密码')
    return
  }
  if (regForm.value.password !== regForm.value.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致，请检查')
    return
  }

  loading.value = true
  try {
    const res = await axios.post('http://47.99.85.173:3000/api/register', {
      username: regForm.value.username,
      password: regForm.value.password
    })
    
    if (res.data.success) {
      ElMessage({ message: res.data.message, type: 'success' })
      // 注册成功后，延迟 1 秒跳转到登录页
      setTimeout(() => {
        router.push('/login')
      }, 1000)
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '注册失败，请检查网络')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  height: 100vh;
  background-color: var(--paper-cream);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.bg-glow { position: absolute; border-radius: 50%; filter: blur(80px); z-index: 0; }
.glow-1 { width: 400px; height: 400px; background: rgba(106, 176, 133, 0.2); top: -100px; left: -100px; }
.glow-2 { width: 500px; height: 500px; background: rgba(197, 164, 126, 0.15); bottom: -150px; right: -100px; }

.glass-container {
  position: relative; z-index: 1;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  padding: 50px 40px; border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
  width: 380px;
}

.brand { text-align: center; margin-bottom: 30px; }
.logo {
  background: var(--primary-green); color: white; width: 50px; height: 50px;
  line-height: 50px; border-radius: 14px; font-size: 24px; margin: 0 auto 12px;
  box-shadow: 0 8px 16px rgba(106, 176, 133, 0.3);
}
.brand h1 { color: var(--deep-green); margin: 0; font-size: 24px; letter-spacing: 2px; }
.brand p { color: #8fa799; font-size: 14px; margin-top: 8px; }

:deep(.elegant-input .el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.8); border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02) !important; padding: 4px 15px;
}
:deep(.elegant-input .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--primary-green) !important;
}

.submit-btn { width: 100%; height: 48px; font-size: 16px; margin-top: 10px; }

.footer-links {
  margin-top: 20px; text-align: center; font-size: 14px;
}
.hint-text { color: #8fa799; }
.nav-link { color: var(--primary-green); font-weight: bold; margin-left: 5px; }
</style>