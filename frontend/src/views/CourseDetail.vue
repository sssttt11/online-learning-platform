<!-- 视频详情页 -->
<template>
  <CourseDetailView
    :course="course"
    :instructor="instructor"
    :chapters="chapters"
    :reviews="reviews"
    :related-courses="relatedCourses"
    :course-overview="courseOverview"
    :learning-objectives="learningObjectives"
    :course-features="courseFeatures"
    :active-tab="activeTab"
    :is-favorite="isFavorite"
    :is-enrolled="isEnrolled"
    :is-toggling-library="isTogglingLibrary"
    :new-rating="newRating"
    :new-review-content="newReviewContent"
    :is-submitting="isSubmitting"
    @update:active-tab="activeTab = $event"
    @toggle-chapter="toggleChapter"
    @go-to-first-video="handleGoToFirstVideo"
    @go-to-video="handleGoToVideo"
    @toggle-favorite="toggleFavorite"         
    @enroll-course="handleEnrollCourse"    
    @update:new-rating="newRating = $event"
    @update:new-review-content="newReviewContent = $event"
    @handle-submit-review="handleSubmitReview"
  />
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CourseDetailView from '@/components/layout/CourseDetailView.vue'
import { 
  getCourseDetail, 
  getCourseChapters,
  getCourseReviews,
  getRelatedCourses,
  submitCourseReview
} from '@/api/courseVideo'

const route = useRoute()
const router = useRouter()
const activeTab = ref('overview')
const isFavorite = ref(false)
const isEnrolled = ref(false)
const isTogglingLibrary = ref(false)

const API_BASE = 'http://localhost:4000' // 添加 API_BASE 常量

const course = ref({
  id: null,
  title: '',
  description: '',
  rating: 0,
  reviewCount: 0,
  studentCount: '0',
  duration: 0,
  difficulty: '',
  categoryName: ''
})

const instructor = ref({
  name: '',
  title: '',
  intro: '',
  avatar: ''
})

const chapters = ref([])
const reviews = ref([])
const relatedCourses = ref([])

// 课程扩展信息
const courseOverview = ref('')
const learningObjectives = ref([])
const courseFeatures = ref([])

// 新评价表单
const newRating = ref(5)
const newReviewContent = ref('')
const isSubmitting = ref(false)

const toggleChapter = (chapterId) => {
  const chapter = chapters.value.find(ch => ch.id === chapterId)
  if (chapter) {
    chapter.isOpen = !chapter.isOpen
  }
}

// 报名课程
// 修改 handleEnrollCourse 函数，添加更多调试信息
const handleEnrollCourse = async () => {
  if (!course.value.id) return
  
  isTogglingLibrary.value = true
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      alert('请先登录后再操作')
      router.push('/login')
      return
    }
    
    // 调用新的报名接口
    const url = `${API_BASE}/api/personal/library/${course.value.id}/enroll`
    
    console.log('🚀 发送报名请求:', url)
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await res.json()
    
    console.log('📦 报名响应:', data)
    
    if (data.success) {
      // 直接使用后端返回的 is_enrolled 字段
      isEnrolled.value = data.data?.is_enrolled ?? true
      
      alert(data.message || '报名成功！')
      
      console.log(`✅ 报名状态更新为: 已报名`)
      console.log(`📊 当前章节数据:`, chapters.value)
      console.log(`📊 章节数量:`, chapters.value.length)
    } else {
      alert(data.message || '报名失败')
    }
  } catch (error) {
    console.error('🔥 报名失败:', error)
    alert('报名失败：' + error.message)
  } finally {
    isTogglingLibrary.value = false
  }
}

// 检查课程状态（报名和收藏）
const checkCourseStatus = async (courseId) => {
  if (!courseId) return
  
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      isFavorite.value = false
      isEnrolled.value = false
      return
    }
    
    console.log('🔍 检查课程状态:', courseId)
    
    // 调用检查状态的接口（应该同时返回报名和收藏状态）
    const url = `${API_BASE}/api/personal/library/${courseId}/status`
    
    const res = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!res.ok) {
      console.warn('课程状态接口不可用:', res.status)
      isFavorite.value = false
      isEnrolled.value = false
      return
    }
    
    const data = await res.json()
    
    console.log('📊 课程状态响应:', data)
    
    if (data.success) {
      // 根据后端返回的字段名设置状态
      isEnrolled.value = data.data?.is_enrolled || false
      isFavorite.value = data.data?.is_favorite || false
      
      console.log(`📋 课程状态: 报名=${isEnrolled.value ? '是' : '否'}, 收藏=${isFavorite.value ? '是' : '否'}`)
    } else {
      console.warn('获取课程状态失败:', data.message)
      isFavorite.value = false
      isEnrolled.value = false
    }
  } catch (error) {
    console.warn('⚠️ 获取课程状态失败:', error)
    isFavorite.value = false
    isEnrolled.value = false
  }
}

// 修改 loadCourseData 函数，添加章节数据调试
const loadCourseData = async () => {
  const courseId = route.params.courseId || route.params.id
  if (!courseId) return

  try {
    // 获取课程详情和章节信息
    const [courseRes, chaptersRes] = await Promise.all([
      getCourseDetail(courseId),
      getCourseChapters(courseId)
    ])

    const c = (courseRes && courseRes.data) || courseRes || {}
    console.log('🔔 后端课程原始数据:', c)
    course.value = {
      id: c.course_id,
      title: c.course_name || '未命名课程',
      description: c.course_desc || '',
      // 兼容后端字段 cover_img 或 image，保持与 CourseCard 使用的 `image` 字段一致
      image: c.cover_img ? (c.cover_img.startsWith('http') ? c.cover_img : `${API_BASE}${c.cover_img}`) : (c.image || c.cover || ''),
      rating: c.rating || 0,
      reviewCount: c.rating_count || 0,
      studentCount: String(c.student_count || 0),
      duration: c.course_duration || 0,
      difficulty: c.difficulty_level || '初级',
      categoryName: c.category_name || '未分类'
    }
    console.log('🔔 计算后前端 course.image:', course.value.image)

    // 解析章节信息
    const rawChapters = (chaptersRes && chaptersRes.data) || chaptersRes || []
    console.log('📋 原始章节数据:', rawChapters)
    
    chapters.value = rawChapters.map((ch, index) => {
      const videos = ch.videos || []
      const chapterData = {
        id: ch.chapter_id,
        title: ch.chapter_title || `第${index + 1}章`,
        lessonCount: videos.length,
        isOpen: index === 0, // 默认打开第一章
        lessons: videos.map(v => ({
          id: v.video_id,
          title: v.video_title || `视频${index + 1}`,
          duration: Math.round((v.duration_seconds || 0) / 60) || 0
        }))
      }
      console.log(`📝 章节${index + 1}处理结果:`, chapterData)
      return chapterData
    })
    
    console.log(`✅ 最终章节数据:`, chapters.value)
    console.log(`📊 章节数量:`, chapters.value.length)

    // 统一检查课程状态（报名和收藏）
    await checkCourseStatus(courseId)
    
    console.log(`🔍 状态检查完成: 报名=${isEnrolled.value}, 收藏=${isFavorite.value}`)

    
    // 加载课程评价
    try {
      const reviewsRes = await getCourseReviews(courseId, 10)
      const reviewsData = (reviewsRes && reviewsRes.data) || reviewsRes || []
      reviews.value = (Array.isArray(reviewsData) ? reviewsData : reviewsData.data || []).map(r => ({
        id: r.comment_id,
        name: r.user_name,
        job: r.occupation || '学员',
        avatar: r.user_name ? r.user_name.charAt(0) : '用',
        content: r.comment_content,
        rating: r.rating || 5
      }))
    } catch (err) {
      console.warn('获取课程评价失败:', err)
    }

    // 加载相关课程推荐
    try {
      const relatedRes = await getRelatedCourses(courseId, 4)
      const relatedData = (relatedRes && relatedRes.data) || relatedRes || []
      const courses = Array.isArray(relatedData) ? relatedData : relatedData.data || []
      relatedCourses.value = courses.map(rc => ({
        id: rc.course_id,
        title: rc.course_name,
        description: rc.course_desc,
        instructor: rc.teacher_name || '未知讲师',
        students: String(rc.student_count || 0),
          rating: rc.rating || 0,
          difficulty: rc.difficulty_level || '初级',
          // 与首页 CourseCard 保持一致：提供原始图片 URL（不包裹 `url(...)`），让 CourseCard 处理样式与回退
          image: rc.cover_img
            ? (rc.cover_img.startsWith('http') ? rc.cover_img : `${API_BASE}${rc.cover_img}`)
            : (rc.image || rc.cover || '')
      }))
    } catch (err) {
      console.warn('获取相关课程失败:', err)
    }
  } catch (error) {
    console.error('加载课程详情失败:', error)
  }
}

// 跳转到第一个视频（已报名才能访问）
const handleGoToFirstVideo = () => {
  if (!isEnrolled.value) {
    alert('请先报名课程才能开始学习')
    return
  }
  
  if (!course.value.id || !chapters.value.length) return
  const firstChapter = chapters.value[0]
  const firstLesson = firstChapter.lessons && firstChapter.lessons[0]
  if (!firstLesson) return

  router.push(`/course/${course.value.id}/video/${firstLesson.id}`)
}

// 跳转到指定视频（已报名才能访问）
const handleGoToVideo = (videoId) => {
  if (!isEnrolled.value) {
    alert('请先报名课程才能学习视频')
    return
  }
  
  if (!course.value.id || !videoId) return
  router.push(`/course/${course.value.id}/video/${videoId}`)
}

const toggleFavorite = async () => {
  if (!course.value.id) return
  
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      alert('请先登录后再收藏')
      router.push('/login')
      return
    }
    
    const targetStatus = !isFavorite.value
    
    console.log(`❤️ 切换收藏状态: 课程ID=${course.value.id}, 目标状态=${targetStatus}`)
    
    // 调用收藏接口
    const res = await fetch(`${API_BASE}/api/personal/favorites/${course.value.id}/toggle`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        isFavorite: targetStatus
      })
    })
    
    const data = await res.json()
    console.log('📦 收藏响应:', data)
    
    if (data.success) {
      // 更新前端状态
      isFavorite.value = data.data?.is_favorite ?? targetStatus
      console.log(`✅ 收藏状态更新为: ${isFavorite.value ? '已收藏' : '未收藏'}`)
      
      // 显示提示信息
      alert(isFavorite.value ? '已添加到收藏' : '已取消收藏')
    } else {
      // 如果收藏失败
      alert(data.message || '操作失败')
    }
    
  } catch (error) {
    console.error('更新收藏状态失败:', error)
    alert('操作失败：' + error.message)
  }
}

// 提交课程评价
const handleSubmitReview = async () => {
  if (!course.value.id || !newReviewContent.value.trim()) return
  
  isSubmitting.value = true
  try {
    await submitCourseReview(course.value.id, newRating.value, newReviewContent.value.trim())
    
    // 清空表单
    newRating.value = 5
    newReviewContent.value = ''
    
    // 重新加载评价列表
    const reviewsRes = await getCourseReviews(course.value.id, 10)
    const reviewsData = (reviewsRes && reviewsRes.data) || reviewsRes || []
    reviews.value = (Array.isArray(reviewsData) ? reviewsData : reviewsData.data || []).map(r => ({
      id: r.comment_id,
      name: r.user_name,
      job: r.occupation || '学员',
      avatar: r.user_name ? r.user_name.charAt(0) : '用',
      content: r.comment_content,
      rating: r.rating || 5
    }))
    
    alert('评价提交成功！')
  } catch (error) {
    console.error('提交评价失败:', error)
    if (error.response?.status === 401) {
      alert('请先登录后再发表评价')
    } else {
      alert('评价提交失败，请稍后重试')
    }
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadCourseData()
})

watch(
  () => route.params.courseId,
  () => {
    isFavorite.value = false
    isEnrolled.value = false
    loadCourseData()
  }
)
</script>