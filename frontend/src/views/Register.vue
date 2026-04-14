<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">注册新账号</h1>
      <p class="auth-subtitle">选择学生或老师身份，开启你的学习之旅</p>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>用户名</label>
          <input
            v-model="form.user_name"
            type="text"
            placeholder="请输入用户名"
            required
          />
        </div>

        <div class="form-group">
          <label>密码</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            required
          />
        </div>

        <div class="form-group">
          <label>身份</label>
          <div class="role-group">
            <label class="role-option">
              <input
                type="radio"
                value="learner"
                v-model="form.role"
              />
              <span>我是学生</span>
            </label>
            <label class="role-option">
              <input
                type="radio"
                value="instructor"
                v-model="form.role"
              />
              <span>我是老师</span>
            </label>
          </div>
        </div>

        <div v-if="error" class="error-msg">{{ error }}</div>

        <button class="btn-primary" type="submit" :disabled="loading">
          {{ loading ? '注册中...' : '注册并登录' }}
        </button>

        <div class="switch-link">
          已有账号？<router-link to="/login">去登录</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '@/api/auth'

const router = useRouter()

const form = ref({
  user_name: '',
  password: '',
  role: 'learner',
})

const loading = ref(false)
const error = ref('')

const handleSubmit = async () => {
  if (!form.value.user_name || !form.value.password) return
  loading.value = true
  error.value = ''
  try {
    const res = await register({
      user_name: form.value.user_name,
      password: form.value.password,
      role: form.value.role,
    })

    const { user, token } = res.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))

    router.push('/search')
  } catch (e) {
    error.value = e.response?.data?.message || '注册失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.auth-card {
  width: 380px;
  background: #fff;
  border-radius: 12px;
  padding: 30px 26px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.auth-title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 6px;
}

.auth-subtitle {
  font-size: 13px;
  color: #5f6368;
  margin-bottom: 20px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  color: #202124;
}

.form-group input {
  height: 36px;
  border-radius: 6px;
  border: 1px solid #dadce0;
  padding: 0 10px;
  font-size: 14px;
}

.form-group input:focus {
  outline: none;
  border-color: #1a73e8;
  box-shadow: 0 0 0 1px rgba(26, 115, 232, 0.2);
}

.role-group {
  display: flex;
  gap: 16px;
}

.role-option {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.error-msg {
  color: #d93025;
  font-size: 13px;
}

.btn-primary {
  margin-top: 4px;
  width: 100%;
  height: 38px;
  border: none;
  border-radius: 6px;
  background: #1a73e8;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: default;
}

.switch-link {
  margin-top: 10px;
  font-size: 13px;
  color: #5f6368;
}

.switch-link a {
  color: #1a73e8;
}
</style>
