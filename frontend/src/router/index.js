// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import CourseVideo from '../views/CourseVideo.vue'
import CourseDetail from '../views/CourseDetail.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Home from '@/views/Home.vue' 
import Community from '../views/Community.vue'
import StudyPair from '../views/StudyPair.vue'
import StudyRoom from '../views/StudyRoom.vue'
import StudentCenter from '../views/StudentCenter.vue'
import TeacherCenter from '../views/TeacherCenter.vue'
import PersonalCenterRouter from '../views/PersonalCenterRouter.vue'
import TeacherAnalysis from '../views/TeacherAnalysis.vue' // 新增导入

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/search',
    name: 'Search',
    component: Home
  },
  {
    path: '/course/:courseId',
    name: 'CourseDetail',
    component: CourseDetail
  },
  {
    path: '/course/:courseId/video/:videoId',
    name: 'CourseVideo',
    component: CourseVideo
  },
  {
    path: '/community',
    name: 'Community',
    component: Community
  },
  {
    path: '/community/teams/:teamId',
    name: 'StudyPair',
    component: StudyPair,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/community/rooms/:roomId',
    name: 'StudyRoom',
    component: StudyRoom,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/personal',
    name: 'PersonalCenterRouter',
    component: PersonalCenterRouter,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/personal/student',
    name: 'StudentCenter',
    component: StudentCenter,
    meta: {
      requiresAuth: true,
      title: '学生个人中心',
      role: 'learner'
    }
  },
  {
    path: '/personal/teacher',
    name: 'TeacherCenter',
    component: TeacherCenter,
    meta: {
      requiresAuth: true,
      title: '教师个人中心',
      role: 'instructor'
    }
  },
  // 学情分析路由 - 修正路径，确保与访问路径一致
  {
    path: '/student/behavior',
    name: 'StudentBehaviorAnalysis',
    component: () => import('@/views/StudentBehaviorAnalysis.vue'),
    meta: {
      requiresAuth: true,
      title: '学习行为分析',
      role: 'learner'
    }
  },
  // 教师学情分析页面 - 新增
  {
    path: '/teacher/analysis',
    name: 'TeacherAnalysis',
    component: TeacherAnalysis, // 使用直接导入，避免懒加载问题
    meta: {
      requiresAuth: true,
      title: '教学数据分析',
      role: 'instructor'
    }
  },
  // 保持原有路径作为别名，确保兼容性
  {
    path: '/personal/learning-analysis/behavior',
    name: 'LearningBehaviorAnalysis',
    redirect: '/student/behavior'
  },
  // 添加课程列表页面的路由（修正之前的警告）
  {
    path: '/courses',
    name: 'Courses',
    redirect: '/', // 暂时重定向到首页，或者可以创建一个专门的课程列表页
    meta: {
      requiresAuth: false
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const publicPaths = ['/', '/login', '/register', '/courses', '/search']
  const isPublic = publicPaths.includes(to.path)
  const token = localStorage.getItem('token')
  
  console.log(`🚀 路由跳转: ${from.path} -> ${to.path}`)
  console.log(`🔑 Token状态: ${token ? '已登录' : '未登录'}`)
  
  // 如果是公开页面，直接放行
  if (isPublic) {
    return next()
  }

  // 如果需要认证但没有 token，跳转到登录页
  if (!token) {
    console.log('❌ 未授权访问，跳转到登录页')
    return next({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }

  // 获取用户角色 - 修正键名
  const getUserRole = () => {
    try {
      // 方法1: 从localStorage获取用户信息（正确的键名）
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        console.log('📦 从localStorage获取的用户角色:', user.role)
        return user.role || 'learner'
      }
      
      // 方法2: 如果localStorage中没有，尝试解码token获取
      console.log('🔍 尝试从token解码获取角色...')
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join(''))
      const decoded = JSON.parse(jsonPayload)
      
      console.log('🎯 从token解码的角色:', decoded.role)
      return decoded.role || 'learner'
      
    } catch (error) {
      console.error('❌ 获取用户角色失败:', error)
      return 'learner'
    }
  }

  const userRole = getUserRole()
  console.log(`🎯 当前用户角色: ${userRole}`)
  console.log(`🎯 目标页面要求的角色: ${to.meta.role || '无要求'}`)
  
  // 检查角色权限
  if (to.meta.role && to.meta.role !== userRole) {
    console.log(`🚫 权限不足: 需要${to.meta.role}角色，当前是${userRole}`)
    
    // 根据用户角色重定向到对应的个人中心
    if (userRole === 'instructor' || userRole === 'teacher') {
      console.log('🔄 重定向到教师中心')
      return next('/personal/teacher')
    } else {
      console.log('🔄 重定向到学生中心')
      return next('/personal/student')
    }
  }

  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 墨知课堂`
  } else {
    document.title = '墨知课堂'
  }

  console.log('✅ 路由放行')
  next()
})

// 添加路由错误处理
router.onError((error) => {
  console.error('路由错误:', error)
  
  // 如果是组件加载失败，可以重试或显示错误页面
  const pattern = /Loading chunk (\d)+ failed/g
  const isChunkLoadError = error.message.match(pattern)
  
  if (isChunkLoadError) {
    window.location.reload()
  }
})

export default router