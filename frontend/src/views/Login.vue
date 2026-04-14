<template>
  <div class="auth-page">
    <div class="auth-container" :class="{ 'panel-expanded': panelExpanded }">
      <!-- Left Panel -->
      <div class="left-panel">
        <div class="brand-section">
          <div class="logo-area">
            <span class="logo-icon">🎓</span>
            <span class="logo-text">墨知课堂</span>
          </div>
          <h1 class="slogan-title">开启您的学习之旅</h1>
          <p class="slogan-desc">专业的在线教育平台，汇聚优质课程资源，助您成就更好的自己</p>
          
          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-top">
                <div class="stat-icon" aria-hidden="true">
                  <!-- simplified users icon (flat) -->
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-2.5 3-4 7-4s7 1.5 7 4v1H2v-1z" fill="#ffffff"/>
                  </svg>
                </div>
                <div class="stat-key">活跃学员</div>
              </div>
              <div class="stat-val">10万+</div>
            </div>

            <div class="stat-box">
              <div class="stat-top">
                <div class="stat-icon" aria-hidden="true">
                  <!-- simplified book icon (flat) -->
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M4 5h12v13H4zM20 5h-1v13h1a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z" fill="#ffffff"/>
                  </svg>
                </div>
                <div class="stat-key">精品课程</div>
              </div>
              <div class="stat-val">5000+</div>
            </div>

            <div class="stat-box">
              <div class="stat-top">
                <div class="stat-icon" aria-hidden="true">
                  <!-- simplified star icon (flat) -->
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M12 2l2.6 6.6L21 9l-5 3.6L17 19l-5-3-5 3 1-6.4L3 9l6.4-.4L12 2z" fill="#ffffff"/>
                  </svg>
                </div>
                <div class="stat-key">用户评分</div>
              </div>
              <div class="stat-val">4.9</div>
            </div>
          </div>

          <div class="testimonial-card">
            <p class="quote">"在墨知课堂学习让我的职业生涯有了质的飞跃，感谢平台提供的优质教育资源！"</p>
            <div class="user-profile">
              <div class="avatar-circle">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" />
              </div>
              <div class="user-details">
                <div class="user-name">张小雨</div>
                <div class="user-role">资深用户</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel -->
      <div class="right-panel" :class="{ expanded: panelExpanded }" @focusin="panelExpanded = true" @focusout="onPanelFocusOut">
        <div class="auth-card-inner">
          <h1 class="auth-title">课程中心</h1>
          <p class="auth-subtitle">使用用户名和密码登录 / 注册</p>

          <div class="auth-tabs">
            <div
              class="auth-tab"
              :class="{ active: activeTab === 'login' }"
              @click="onTabClick('login')"
            >
              登录
            </div>
            <div
              class="auth-tab"
              :class="{ active: activeTab === 'register' }"
              @click="onTabClick('register')"
            >
              注册
            </div>
          </div>

          <!-- 登录表单 -->
          <form v-if="activeTab === 'login'" class="auth-form" @submit.prevent="handleLogin">
            <div class="form-group">
              <label>用户名</label>
              <input
                v-model="loginForm.username"
                type="text"
                placeholder="请输入用户名"
                required
              />
            </div>

            <div class="form-group">
              <label>密码</label>
              <input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                required
              />
            </div>

            <div v-if="error" class="error-msg">{{ error }}</div>

            <button class="btn-primary" type="submit" :disabled="loading">
              {{ loading ? '登录中...' : '登录' }}
            </button>
          </form>

          <!-- 注册表单 -->
          <form v-else class="auth-form" @submit.prevent="handleRegister">
            <div class="form-group">
              <label>用户名</label>
              <input
                v-model="registerForm.user_name"
                type="text"
                placeholder="请输入用户名"
                required
              />
            </div>

            <div class="form-group">
              <label>密码</label>
              <input
                v-model="registerForm.password"
                type="password"
                placeholder="请输入密码"
                required
              />
            </div>

            <div class="form-group">
              <label>身份</label>
              <div class="role-group">
                <label class="role-option">
                  <input type="radio" value="learner" v-model="registerForm.role" />
                  <span>我是学生</span>
                </label>
                <label class="role-option">
                  <input type="radio" value="instructor" v-model="registerForm.role" />
                  <span>我是老师</span>
                </label>
              </div>
            </div>

            <div v-if="error" class="error-msg">{{ error }}</div>

            <button class="btn-primary" type="submit" :disabled="loading">
              {{ loading ? '注册中...' : '注册并登录' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { login, register } from '@/api/auth'
// 注释掉有问题的导入
// import { useUserStore } from '../stores/user.js'

const router = useRouter()
const route = useRoute()
// const userStore = useUserStore()

const activeTab = ref(route.name === 'Register' || route.query.mode === 'register' ? 'register' : 'login')
const panelExpanded = ref(false)

const onTabClick = (tab) => {
  activeTab.value = tab
  panelExpanded.value = true
  setTimeout(() => (panelExpanded.value = false), 520)
}

const loginForm = ref({
  username: '',
  password: '',
})

const registerForm = ref({
  user_name: '',
  password: '',
  role: 'learner',
})

const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  if (!loginForm.value.username || !loginForm.value.password) return
  loading.value = true
  error.value = ''
   try {
    const res = await login({
      username: loginForm.value.username,
      password: loginForm.value.password,
    })
    const { user, token } = res.data

    // 确保用户信息中有role字段
    if (!user.role) {
      user.role = user.user_role || 'learner'
    }

    console.log('✅ 登录成功，用户信息:', user)
    console.log('✅ 用户角色:', user.role)

    // 存储到localStorage - 确保使用正确的键名
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))  // ✅ 正确的键名

    const redirect = route.query.redirect || '/'
    console.log('🚀 准备跳转到:', redirect)
    router.push(redirect)
  } catch (e) {
    console.error('登录错误:', e)
    error.value = e.response?.data?.message || '登录失败，请检查账号密码'
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  if (!registerForm.value.user_name || !registerForm.value.password) return
  loading.value = true
  error.value = ''
  try {
    const res = await register({
      user_name: registerForm.value.user_name,
      password: registerForm.value.password,
      role: registerForm.value.role,
    })

    const { user, token } = res.data
    
    // 确保用户信息中有role字段
    if (!user.role) {
      user.role = registerForm.value.role || 'learner'
    }

    console.log('注册成功，用户信息:', user)
    console.log('用户角色:', user.role)
    console.log('收到的 token:', token)

    // 存储到localStorage
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))

    const redirect = route.query.redirect || '/'
    console.log('注册后准备跳转到:', redirect)
    router.push(redirect)
  } catch (e) {
    console.error('注册错误:', e)
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
  background: #f5f7fa; /* 轻柔灰白背景，与白色表单搭配 */
  padding: 24px;
}

.auth-container {
  display: flex;
  width: 75%; /* 调整为更宽的容器，靠近示例长图布局 */
  max-width: 1200px;
  min-height: 620px;
  background: #ffffff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 18px 40px rgba(31, 41, 55, 0.08);
}

.left-panel {
  flex: 1; /* 左右 1:1 比例（左侧） */
  background: linear-gradient(180deg, rgba(234,246,255,0.95) 0%, rgba(215,240,255,0.95) 100%), url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><defs><linearGradient id='g' x1='0' x2='1'><stop offset='0' stop-color='%23eaf6ff'/><stop offset='1' stop-color='%23d7f0ff'/></linearGradient></defs><g fill='none' fill-rule='evenodd'><circle cx='650' cy='80' r='120' fill='%23ffffff' opacity='0.05'/><path d='M0 450 C200 350 400 550 800 400 L800 600 L0 600 Z' fill='%230b63a5' opacity='0.02'/></g></svg>") center/cover no-repeat; /* 叠加轻量 SVG 装饰背景 */
  padding: 72px 64px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: #073b6b; /* 深蓝色文字，与表单蓝色主色搭配 */
  position: relative;
}

.right-panel {
  flex: 1; /* 左右 1:1 比例（右侧） */
  background: #f2f5f7; /* 保持表单原有白色 */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 56px 64px;
  transition: transform 0.32s cubic-bezier(.2,.9,.2,1), box-shadow 0.32s ease;
}

.right-panel.expanded {
  transform: translateX(8px) scale(1.02);
  box-shadow: 0 30px 60px rgba(11,99,165,0.06);
  z-index: 3;
}

.auth-card-inner {
  width: 100%;
  max-width: 520px; /* 适当增大右侧表单卡片宽度以贴合示例 */
}

/* Left Panel Styles */
.brand-section {
  max-width: 480px;
  margin: 0 auto;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 26px;
  font-size: 22px;
  font-weight: 800;
}

.logo-text { color: #073b6b; }
.slogan-title {
  font-size: 40px;
  font-weight: 800;
  margin-bottom: 14px;
  line-height: 1.18;
  color: #043a6b;
}
.slogan-desc {
  font-size: 15px;
  opacity: 0.95;
  margin-bottom: 36px;
  line-height: 1.6;
  color: #0a4e79;
}
.stats-grid {
  display: flex;
  gap: 16px;
  margin-bottom: 34px;
}
.stat-box {
  background: rgba(11,99,165,0.06);
  padding: 10px 12px;
  border-radius: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
}
.stat-top { display:flex; align-items:center; gap:10px; }
.stat-key { font-size: 13px; opacity: 0.95; color: #0b63a5; white-space: nowrap; }
.stat-val {
  font-size: 18px;
  font-weight: 800;
  color: #0b63a5;
  margin-top: 4px;
}

/* 扁平图标样式：去掉圆形背景与阴影，仅保留浅色图标 */
.stat-icon { width:auto; height:auto; display:flex; align-items:center; justify-content:center; border-radius:0; background:transparent; box-shadow:none; padding:0; }
.stat-icon svg { width:20px; height:20px; display:block; }
/* 覆盖内联 SVG 的填充为浅色（重要）以实现扁平图标视觉 */
.stat-icon svg path { fill: rgba(11,99,165,0.90) !important; }
.testimonial-card {
  background: rgba(16,137,211,0.04);
  padding: 20px;
  border-radius: 12px;
}
.quote {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 14px;
  font-style: italic;
  color: #054f78;
}
.user-profile { gap: 10px; }

.avatar-circle { width:36px; height:36px; }

.user-name { font-size:13px; color:#07355a; }
.user-role { font-size:12px; color:rgba(7,45,75,0.85); }

/* 保留右侧表单原有风格，但可微调间距以匹配整体 */
.auth-title {
  text-align: center;
  font-weight: 900;
  font-size: 30px;
  color: rgb(16, 137, 211); /* 保留表单主色不变 */
  margin-bottom: 6px;
}

.auth-subtitle {
  text-align: center;
  font-size: 13px;
  color: #5f6368;
  margin-bottom: 20px;
}

.auth-tabs {
  display: flex;
  background: #f7f8f9;
  border-radius: 999px;
  padding: 8px;
  margin-bottom: 18px;
}

.auth-tab { flex:1; text-align:center; font-size:13px; padding:6px 0; border-radius:999px; cursor:pointer; color:#5f6368; }
.auth-tab.active { background:#fff; color:#1a73e8; font-weight:600; box-shadow:0 1px 3px rgba(60,64,67,0.06); }

.auth-form { display:flex; flex-direction:column; gap:14px; }
.form-group { display:flex; flex-direction:column; gap:6px; }
.form-group label { font-size:13px; color:#202124; }
.form-group input { width:100%; background:rgb(251,250,250); border:none; padding:15px 20px; border-radius:20px; margin-top:8px; box-shadow:#e7f5f1 0px 8px 10px -6px; border-inline:2px solid transparent; box-sizing:border-box; }
.form-group input:focus { outline:none; border-color:#1a73e8; box-shadow:0 0 0 1px rgba(26,115,232,0.08); }

.role-group { display:flex; gap:18px; align-items:center; }
.role-option { position:relative; display:inline-flex; align-items:center; cursor:pointer; }
.role-option input[type="radio"] { position: absolute; opacity: 0; width: 0; height: 0; }
.role-option span { display:inline-flex; align-items:center; gap:10px; padding:10px 18px; border-radius:999px; background:transparent; color:#5f6368; font-weight:700; letter-spacing:1px; text-transform:uppercase; font-size:13px; transition:all 0.18s ease; }
.role-option span::before { content: ""; display:inline-block; width:18px; height:18px; border-radius:50%; background: rgba(11,99,165,0.06); border:2px solid rgba(11,99,165,0.12); box-sizing: border-box; transition:all 0.18s ease; }
.role-option input[type="radio"]:focus + span { box-shadow: 0 6px 18px rgba(11,99,165,0.06); }
.role-option input[type="radio"]:checked + span { background: linear-gradient(90deg, rgba(11,99,165,0.06), rgba(18,177,209,0.04)); color: #0b63a5; }
.role-option input[type="radio"]:checked + span::before { background: linear-gradient(45deg, #0b63a5, #12b1d1); border-color: #0b63a5; box-shadow: 0 6px 18px rgba(11,99,165,0.12); }
.error-msg { color:#d93025; font-size:13px; }

.btn-primary { display:block; width:100%; font-weight:bold; background:linear-gradient(45deg, rgb(16, 137, 211) 0%, rgb(18, 177, 209) 100%); color:white; padding-block:15px; margin:20px auto; border-radius:20px; box-shadow:rgba(133,189,215,0.18) 0px 12px 18px -10px; border:none; transition:all 0.15s ease-in-out; cursor:pointer; }
.btn-primary:hover { transform:translateY(-2px); }
.btn-primary:active { transform:translateY(0); }
.btn-primary:disabled { opacity:0.7; cursor:default; }

@media (max-width: 900px) {
  .auth-container { flex-direction:column; width:95%; height:auto; }
  /* 在小屏上先显示表单（右侧） */
  .right-panel { order: -1; padding:28px; }
  .left-panel { padding:28px; }
}
</style>
