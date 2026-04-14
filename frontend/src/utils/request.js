import axios from 'axios'

// 创建axios实例：统一走课程中心后端 server.js
// 当前后端实际运行地址为 http://localhost:4000，且挂载前缀为 /api
// 因此前端统一使用 baseURL = http://localhost:4000/api
// 各模块中的 url 只需要写成 /auth/...、/courses/...、/community/... 等即可。
const request = axios.create({
  baseURL: 'http://localhost:4000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 修复headers问题
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    
    console.log(`🚀 发送请求: ${config.method?.toUpperCase()} ${config.url}`)
    console.log(`   Token状态: ${token ? '已携带' : '未携带'}`)
    
    if (token) {
      // 正确设置Authorization头
      config.headers.Authorization = `Bearer ${token}`
      
      // 解码token查看内容
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(window.atob(base64));
        console.log('🔍 Token payload:', decoded);
        
        // 检查是否有userId
        if (!decoded.userId && !decoded.id) {
          console.warn('⚠️ Token中没有用户ID，可能需要重新登录');
        }
      } catch (e) {
        console.error('❌ 解码token失败:', e);
      }
    }
    
    return config
  }
)

// 响应拦截器 - 添加更多调试信息
request.interceptors.response.use(
  response => {
    console.log(`✅ 请求成功: ${response.config.url}`)
    console.log(`   状态码: ${response.status}`)
    
    // 如果是收藏相关请求，特别标记
    if (response.config.url.includes('/favorite')) {
      console.log(`   💖 收藏请求成功，响应数据:`, response.data)
    }
    
    return response.data
  },
  error => {
    console.error('❌ API请求错误:', error.message)
    console.error('   请求URL:', error.config?.url)
    console.error('   状态码:', error.response?.status)
    
    // 输出详细的错误信息
    if (error.response) {
      console.error('   错误响应数据:', error.response.data)
      console.error('   响应头:', error.response.headers)
    }
    
    if (error.code === 'ERR_NETWORK') {
      console.error('   💡 建议: 请确保后端服务已启动在端口4000')
      console.error('       执行命令: npm run dev (在backend目录下)')
    }
    
    // 如果是401错误，提示重新登录
    if (error.response?.status === 401) {
      console.error('   🔐 认证失败: Token无效或已过期，请重新登录')
      // 可选：自动清除token并跳转到登录页
      // localStorage.removeItem('token')
      // window.location.href = '/login'
    }
    
    // 如果是404错误，可能是路由不存在
    if (error.response?.status === 404) {
      console.error('   🔍 路由不存在: 请检查后端路由配置')
    }
    
    // 如果是500错误，是服务器内部错误
    if (error.response?.status === 500) {
      console.error('   🛠️ 服务器内部错误: 请查看后端控制台日志')
    }
    
    return Promise.reject(error)
  }
)

export default request