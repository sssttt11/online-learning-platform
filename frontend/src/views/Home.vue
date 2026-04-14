<!-- 课程中心 首页 -->
<template>
  <HomeView
    :search-query="searchQuery"
    :search-results="searchResults"
    :is-loading="isLoading"
    :has-searched="hasSearched"
    :sort-by="sortBy"
    :popular-tags="popularTags"
    :featured-courses="featuredCourses"
    :recommended-courses="recommendedCourses"
    :sorted-results="sortedResults"
    :top-rated-courses="topRatedCourses"
    @update:sort-by="sortBy = $event"
    @search-by-tag="searchByTag"
    @clear-search="clearSearch"
    @perform-search="performSearch"
  />
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HomeView from '@/components/layout/HomeView.vue'
import { searchCourses, getAllCourses } from '@/api/courseVideo'

const route = useRoute()
const router = useRouter()

const searchQuery = ref('')
const searchResults = ref([])
const isLoading = ref(false)
const hasSearched = ref(false)
const sortBy = ref('relevance')

// 热门搜索标签
const popularTags = ref([
  '考公务员', '考研', '四六级', '教师资格证', 
  '会计师', '建造师', '法考', '医师资格'
])

// 精选课程数据（从后端动态获取）
const featuredCourses = ref([])

// 推荐课程数据（从后端加载）
const recommendedCourses = ref([])

// 5分课程数据（轮播图使用）
const topRatedCourses = ref([])

// 计算排序后的结果
const sortedResults = computed(() => {
  const results = [...searchResults.value]
  switch (sortBy.value) {
    case 'rating':
      return results.sort((a, b) => b.rating - a.rating)
    case 'students':
      return results.sort((a, b) => parseInt(b.students) - parseInt(a.students))
    case 'newest':
      return results.sort((a, b) => b.id - a.id)
    default:
      return results
  }
})

// 将后端数据转换为前端格式
const transformCourseData = (course) => {
  console.log(' 转换课程数据:', course)
  
  const transformed = {
    id: course.course_id,
    title: course.course_name,
    description: course.course_desc,
    instructor: course.teacher_name || '未知讲师',
    students: course.student_count ? `${course.student_count}` : '0',
    rating: course.avg_rating || course.rating || 4.5,
    difficulty: course.difficulty_level || '初级',
    cover_img: course.cover_img, // 轮播图需要这个字段
    image: course.cover_img 
      ? (course.cover_img.startsWith('http')
          ? course.cover_img
          : `http://localhost:4000${course.cover_img}`)
      : null
  }
  
  console.log(' 转换后的数据:', transformed)
  return transformed
}

// 执行搜索
const performSearch = async () => {
  if (!searchQuery.value.trim()) return

  isLoading.value = true
  hasSearched.value = true

  try {
    const res = await searchCourses(searchQuery.value.trim())
    console.log('🔍 搜索接口返回:', res)

    const courses = res.data || []
    console.log('📚 课程数组:', courses)

    searchResults.value = courses.map(transformCourseData)

    if (searchResults.value.length > 0) {
      const allRes = await getAllCourses()
      const allCourses = allRes.data || []
      recommendedCourses.value = allCourses
        .filter(c => !searchResults.value.some(sc => sc.id === c.course_id))
        .slice(0, 4)
        .map(transformCourseData)
    }
  } catch (error) {
    console.error('❌ 搜索课程失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 通过标签搜索
const searchByTag = (tag) => {
  searchQuery.value = tag
  performSearch()
}

// 清空搜索
const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  hasSearched.value = false
  loadAllCourses()
}

// 模拟课程数据（使用提供的真实URL）
const mockCourses = [
  {
    course_id: 1,
    course_name: '高等数学(上) - 3小时速成',
    course_desc: '超详细的高等数学上册速成课程，3小时掌握核心知识点，期末不挂科。',
    teacher_name: '李老师',
    student_count: 3420,
    avg_rating: 4.5,
    difficulty_level: 'beginner',
    cover_img: 'https://wuyingyunshang.oss-cn-shanghai.aliyuncs.com/mzcourse/%E8%AF%BE%E7%A8%8B%E5%B0%81%E9%9D%A2/%E9%AB%98%E6%95%B01.jpg'
  },
  {
    course_id: 2,
    course_name: '考公申论 - 高分技巧',
    course_desc: '公务员考试申论高分技巧，掌握写作要点，轻松应对申论考试。',
    teacher_name: '王老师',
    student_count: 2150,
    avg_rating: 4.8,
    difficulty_level: 'intermediate',
    cover_img: 'https://wuyingyunshang.oss-cn-shanghai.aliyuncs.com/mzcourse/%E8%AF%BE%E7%A8%8B%E5%B0%81%E9%9D%A2/%E8%80%83%E5%85%AC%E7%94%B3%E8%AE%BA.jpg'
  },
  {
    course_id: 3,
    course_name: '英语四级听力原文训练',
    course_desc: '专注于英语四级听力训练，通过原文分析提高听力理解能力。',
    teacher_name: '张老师',
    student_count: 1890,
    avg_rating: 4.6,
    difficulty_level: 'intermediate',
    cover_img: 'https://wuyingyunshang.oss-cn-shanghai.aliyuncs.com/mzcourse/%E8%8B%B1%E8%AF%AD1/%E5%B0%81%E9%9D%A2.jpeg'
  },
  {
    course_id: 4,
    course_name: '考公行测 - 数量关系专项',
    course_desc: '针对公务员考试行测数量关系部分的专项训练，快速提分。',
    teacher_name: '刘老师',
    student_count: 1650,
    avg_rating: 4.7,
    difficulty_level: 'intermediate',
    cover_img: 'https://wuyingyunshang.oss-cn-shanghai.aliyuncs.com/mzcourse/%E8%AF%BE%E7%A8%8B%E5%B0%81%E9%9D%A2/%E8%80%83%E5%85%AC%E8%A1%8C%E6%B5%8B1.jpg'
  },
  {
    course_id: 5,
    course_name: '高数微积分基础入门',
    course_desc: '从零开始学习微积分，适合初学者的高等数学入门课程。',
    teacher_name: '陈老师',
    student_count: 2940,
    avg_rating: 4.4,
    difficulty_level: 'beginner',
    cover_img: 'https://wuyingyunshang.oss-cn-shanghai.aliyuncs.com/mzcourse/%E8%AF%BE%E7%A8%8B%E5%B0%81%E9%9D%A2/%E9%AB%98%E6%95%B01.jpg'
  },
  {
    course_id: 6,
    course_name: '六级英语听力突破',
    course_desc: '英语六级听力专项训练，掌握听力技巧，轻松过六级。',
    teacher_name: '赵老师',
    student_count: 1420,
    avg_rating: 4.3,
    difficulty_level: 'intermediate',
    cover_img: 'https://wuyingyunshang.oss-cn-shanghai.aliyuncs.com/mzcourse/%E8%8B%B1%E8%AF%AD1/%E5%B0%81%E9%9D%A2.jpeg'
  }
]

// 加载所有课程（首页显示）
const loadAllCourses = async () => {
  console.log('🚀 开始加载课程数据...')
  isLoading.value = true
  try {
    // 优先使用后端数据，如果失败则使用模拟数据
    let courses = []
    try {
      console.log('📡 尝试获取后端数据...')
      const res = await getAllCourses()
      courses = res.data || []
      console.log('📊 后端返回课程数量:', courses.length)
    } catch (apiError) {
      console.log('📡 后端API暂不可用，使用模拟数据')
      courses = mockCourses
    }
    
    // 如果后端数据为空，也使用模拟数据
    if (courses.length === 0) {
      console.log('📦 使用模拟数据，课程数量:', mockCourses.length)
      courses = mockCourses
    }
    
    console.log('📚 最终使用的课程数据:', courses)
    
    // 筛选高评分课程用于轮播图（评分>=4.5的课程）
    const highRatedCourses = courses.filter(course => 
      course.avg_rating >= 4.5 || course.rating >= 4.5 || course.course_name.includes('速成')
    ).slice(0, 3)
    
    console.log('⭐ 高评分课程:', highRatedCourses)
    
    topRatedCourses.value = highRatedCourses.length > 0 
      ? highRatedCourses.map(transformCourseData)
      : courses.slice(0, 3).map(transformCourseData)
    
    featuredCourses.value = courses.slice(0, 6).map(transformCourseData)
    recommendedCourses.value = courses.length > 6 
      ? courses.slice(6, 14).map(transformCourseData)
      : courses.map(transformCourseData) // 如果课程不够，重复显示
      
    console.log('🎯 轮播图课程数量:', topRatedCourses.value.length)
    console.log('🌟 精选课程数量:', featuredCourses.value.length)
    console.log('💡 推荐课程数量:', recommendedCourses.value.length)
    
  } catch (error) {
    console.error('❌ 加载课程失败:', error)
    // 出错时使用模拟数据
    console.log('🔄 使用备用模拟数据')
    featuredCourses.value = mockCourses.slice(0, 6).map(transformCourseData)
    topRatedCourses.value = mockCourses.slice(0, 3).map(transformCourseData)
    recommendedCourses.value = []
  } finally {
    isLoading.value = false
    console.log('✅ 课程数据加载完成')
  }
}

// 初始化
onMounted(() => {
  if (route.query.q) {
    searchQuery.value = route.query.q
    performSearch()
  } else {
    loadAllCourses()
  }
})

// 监听路由参数中的 q 变化（来自全局导航搜索）
watch(
  () => route.query.q,
  (newQ) => {
    if (typeof newQ === 'string' && newQ.trim()) {
      searchQuery.value = newQ.trim()
      performSearch()
    } else if (!newQ) {
      clearSearch()
    }
  }
)
</script>

<style>
:root{
  --mz-primary: rgb(66,180,246);
  --mz-primary-dark: #12a7d9;
  /* 更柔和的垂直渐变背景，提供轻微层次感 */
  --page-bg: linear-gradient(180deg, #fbfdff 0%, #f6fbff 40%, #f2f8ff 100%);
  --page-hero-accent: rgba(66,180,246,0.06);
}

.search-results {
  background: var(--page-bg);
  /* 轻微内阴影让内容区悬浮感更好 */
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
}

.section-title { color: #073b6b; }

.courses-grid { gap: 22px; }

/* 兼容 CourseCard 的外层样式 */
.course-card .card-shell{ background: #f9fbfe; }

</style>