<template>
  <div class="personal-center-router">
    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <p>正在跳转到个人中心...</p>
    </div>
    <div v-else-if="error" class="error">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button @click="retry" class="retry-btn">重试</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  await routeToCorrectCenter()
})

// 解码JWT token的简单函数
function decodeJWT(token) {
  try {
    if (!token) return null
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
    return JSON.parse(jsonPayload)
  } catch (err) {
    console.error('解码JWT失败:', err)
    return null
  }
}

async function routeToCorrectCenter() {
  try {
    loading.value = true
    error.value = ''
    
    console.log('🚀 PersonalCenterRouter开始执行...')
    
    // 直接从localStorage获取用户信息
    const userStr = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    
    if (!token) {
      console.log('❌ 没有token，跳转到登录页')
      router.push('/login')
      return
    }
    
    let finalRole = 'learner'
    
    // 方法1: 从localStorage获取
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        finalRole = user.role || 'learner'
        console.log('📦 从localStorage获取的角色:', finalRole)
      } catch (e) {
        console.error('解析localStorage用户信息失败:', e)
      }
    }
    
    // 方法2: 如果localStorage中没有，解码token
    if (finalRole === 'learner') {
      try {
        const decoded = decodeJWT(token)
        if (decoded) {
          finalRole = decoded.role || 'learner'
          console.log('🎯 从token解码的角色:', finalRole)
        }
      } catch (e) {
        console.error('解码token失败:', e)
      }
    }
    
    console.log('🎯 最终确定的用户角色:', finalRole)
    
    // 等待一小段时间确保路由系统就绪
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 根据角色跳转
    if (finalRole === 'instructor' || finalRole === 'teacher') {
      console.log('🚀 跳转到教师中心')
      router.replace('/personal/teacher')
    } else {
      console.log('🚀 跳转到学生中心')
      router.replace('/personal/student')
    }
    
  } catch (err) {
    console.error('❌ 路由到个人中心失败:', err)
    error.value = err.message || '加载失败，请重试'
    loading.value = false
  }
}

function retry() {
  routeToCorrectCenter()
}
</script>

<style scoped>
.personal-center-router {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f5f7fa;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.loading i {
  font-size: 2rem;
  color: #409eff;
  margin-bottom: 1rem;
}

.error i {
  font-size: 2rem;
  color: #f56c6c;
  margin-bottom: 1rem;
}

.loading p, .error p {
  margin: 0.5rem 0;
  color: #666;
}

.retry-btn {
  background: #409eff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 1rem;
}

.retry-btn:hover {
  background: #66b1ff;
}
</style>