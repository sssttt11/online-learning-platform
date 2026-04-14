<!-- frontend/src/views/TeacherAnalysis.vue -->
<template>
  <div class="teacher-analysis-wrapper">
    <!-- 主内容区域 -->
    <main class="container" v-if="mounted">
      <!-- 页面标题和筛选 -->
      <section class="analysis-header">
        <div class="header-top">
          <button class="back-btn" @click="goBack">
            <i class="fas fa-arrow-left"></i> 返回教师中心
          </button>
          <h1>学情分析看板</h1>
          <div class="user-info">
            <div class="teacher-badge">教师</div>
            <div class="avatar">
              <span>{{ userName?.charAt(0) || 'T' }}</span>
            </div>
          </div>
        </div>
        <div class="class-info">
          <span><i class="fas fa-users"></i> 总学生数：{{ totalStudents || 0 }}人</span>
          <span><i class="fas fa-user-check"></i> 活跃学生：{{ activeStudents || 0 }}人</span>
          <span><i class="fas fa-play-circle"></i> 平均完播率：{{ avgCompletionRate || '0%' }}</span>
          <span><i class="fas fa-star"></i> 优秀学生：{{ excellentStudents || 0 }}人</span>
        </div>
        <div class="filter-section">
          <button 
            v-for="filter in filters" 
            :key="filter.key"
            class="filter-btn" 
            :class="{ active: currentFilter === filter.key }"
            @click="changeFilter(filter.key)"
          >
            {{ filter.label }}
          </button>
        </div>
      </section>

      <!-- 统计卡片 -->
      <section class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">学生平均专注时长</div>
          <div class="stat-value">{{ avgFocusDuration || '0' }}分钟</div>
          <div class="stat-trend">↑ 较上周提升15%</div>
          <div class="positive-feedback">
            <div class="feedback-title">🎉 教学亮点</div>
            <div class="feedback-content">学生专注度持续提升，说明您的课程内容吸引力强，教学方法有效。</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">整体完播率</div>
          <div class="stat-value">{{ avgCompletionRate || '0%' }}</div>
          <div class="stat-trend">↑ 较上月提升8%</div>
          <div class="positive-feedback">
            <div class="feedback-title">💡 优化建议</div>
            <div class="feedback-content">完播率持续上升，建议继续保持当前教学节奏和内容难度。</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">学生互动参与度</div>
          <div class="stat-value">{{ avgInteractionRate || '0%' }}</div>
          <div class="stat-trend">↑ 提升明显</div>
          <div class="positive-feedback">
            <div class="feedback-title">🌟 优秀表现</div>
            <div class="feedback-content">学生互动积极，课堂氛围活跃，说明您的互动设计非常成功。</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">知识掌握度</div>
          <div class="stat-value">{{ avgMasteryRate || '0%' }}</div>
          <div class="stat-trend">↑ 稳步提升</div>
          <div class="positive-feedback">
            <div class="feedback-title">📚 教学成果</div>
            <div class="feedback-content">学生知识掌握度持续提升，证明您的教学内容设计合理有效。</div>
          </div>
        </div>
      </section>

      <!-- 图表区域 -->
      <section class="charts-grid">
        <div class="chart-row">
          <!-- 知识掌握分布环状图 -->
          <div class="chart-container">
            <div class="chart-title">
              <i class="fas fa-chart-pie"></i> 学生知识掌握分布
            </div>
            <div v-if="chartLoaded" ref="masteryChartRef" class="chart"></div>
            <div v-else class="loading">正在加载图表...</div>
          </div>

          <!-- 学习行为词云图 -->
          <div class="chart-container">
            <div class="chart-title">
              <i class="fas fa-cloud"></i> 学习行为词云
            </div>
            <div v-if="chartLoaded" ref="wordCloudChartRef" class="chart"></div>
            <div v-else class="loading">正在加载图表...</div>
          </div>
        </div>

        <!-- 学习行为趋势图 -->
        <div class="chart-container">
          <div class="chart-title">
            <i class="fas fa-chart-line"></i> 学习行为趋势分析
          </div>
          <div v-if="chartLoaded" ref="trendChartRef" class="chart"></div>
          <div v-else class="loading">正在加载图表...</div>
        </div>
      </section>
    </main>

    <!-- 加载中状态 -->
    <div v-if="!mounted" class="loading-container">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>加载中...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user.js'
import * as echarts from 'echarts'
import 'echarts-wordcloud'
import {
  apiTeacherStats,
  apiTeacherCourses,
  apiMasteryDistribution,
  apiKnowledgeWordCloud,
  apiLearningTrend,
  apiTrendOverview
} from '../api/teacher.js'

const router = useRouter()
const userStore = useUserStore()

// 组件挂载状态
const mounted = ref(false)

// 数据状态
const userName = ref('')
const totalStudents = ref(0)
const activeStudents = ref(0)
const avgCompletionRate = ref('0%')
const excellentStudents = ref(0)
const avgFocusDuration = ref('0')
const avgInteractionRate = ref('0%')
const avgMasteryRate = ref('0%')

// 图表相关
const masteryChartRef = ref(null)
const wordCloudChartRef = ref(null)
const trendChartRef = ref(null)
let masteryChart = null
let wordCloudChart = null
let trendChart = null
const chartLoaded = ref(false)
const masteryData = ref([])
const wordCloudData = ref([])

// 趋势数据状态
const trendData = ref({
  weeks: [],
  completion: [],
  interaction: [],
  mastery: [],
  focusDuration: []
})

// 统计卡片数据状态
const statsData = ref({
  overall: {
    focusDuration: '24',
    completionRate: '78%',
    interactionRate: '82%',
    masteryRate: '76%'
  },
  'data-structure': {
    focusDuration: '25',
    completionRate: '82%',
    interactionRate: '80%',
    masteryRate: '79%'
  },
  algorithm: {
    focusDuration: '22',
    completionRate: '78%',
    interactionRate: '78%',
    masteryRate: '75%'
  },
  programming: {
    focusDuration: '27',
    completionRate: '85%',
    interactionRate: '86%',
    masteryRate: '82%'
  }
})


// 筛选器
const filters = ref([
  { key: 'overall', label: '总体教学风格' }
])
const currentFilter = ref('overall')

// 课程统计映射
const courseStatsMap = ref({})

// 初始化页面
onMounted(async () => {
  console.log('📊 学情分析页面加载中...')
  
  try {
    // 获取用户信息
    userName.value = userStore.userName || '教师'
    
    // 获取统计数据
    const statsRes = await apiTeacherStats()
    if (statsRes.success && statsRes.data) {
      totalStudents.value = statsRes.data.students?.total || 0
      activeStudents.value = Math.round(totalStudents.value * 0.8)
      excellentStudents.value = Math.round(totalStudents.value * 0.3)
    }


    // 加载课程筛选器
    await loadCourseFilters()
    
    // 获取趋势概览数据，初始化统计卡片
    const trendRes = await apiTrendOverview()
    if (trendRes.success && trendRes.data && trendRes.data.latest_stats) {
      updateStatsDataFromResponse(trendRes.data.latest_stats)
    }

    await fetchTrendData('overall')
    await loadChartData()
    await nextTick()
    
    mounted.value = true
    await nextTick()

    initCharts()
    chartLoaded.value = true
    
    console.log('✅ 学情分析页面加载完成')
  } catch (error) {
    console.error('❌ 学情分析页面加载失败:', error)
    mounted.value = true
  }
})


// 加载图表数据
async function loadChartData() {
  try {
    // 获取知识掌握分布数据
    const masteryRes = await apiMasteryDistribution()
    if (masteryRes.success && masteryRes.data) {
      masteryData.value = masteryRes.data
      console.log('📊 知识掌握分布数据:', masteryData.value)
    } else {
      // 使用模拟数据
      masteryData.value = [
        { value: 15, name: '精通掌握', itemStyle: { color: '#52c41a' } },
        { value: 18, name: '良好掌握', itemStyle: { color: '#1890ff' } },
        { value: 10, name: '中等掌握', itemStyle: { color: '#faad14' } },
        { value: 2, name: '需要提升', itemStyle: { color: '#ff7a45' } }
      ]
    }

    // 获取词云数据
    const wordCloudRes = await apiKnowledgeWordCloud()
    if (wordCloudRes.success && wordCloudRes.data) {
      wordCloudData.value = wordCloudRes.data
      console.log('☁️ 词云数据:', wordCloudData.value)
    } else {
      // 使用模拟数据
      wordCloudData.value = [
        { name: '专注', value: 100 }, { name: '暂停', value: 80 }, { name: '思考', value: 75 },
        { name: '回滚', value: 60 }, { name: '离开', value: 40 }, { name: '笔记', value: 85 },
        { name: '讨论', value: 70 }, { name: '提问', value: 65 }, { name: '倍速', value: 50 },
        { name: '复习', value: 90 }, { name: '理解', value: 88 }, { name: '困惑', value: 45 },
        { name: '练习', value: 82 }, { name: '掌握', value: 78 }, { name: '进步', value: 85 }
      ]
    }
  } catch (error) {
    console.error('获取图表数据失败:', error)
  }
}

// 初始化所有图表
function initCharts() {
  // 确保DOM元素存在
  if (!masteryChartRef.value || !wordCloudChartRef.value || !trendChartRef.value) {
    console.warn('图表DOM元素未找到，等待重新初始化...')
    setTimeout(initCharts, 100)
    return
  }
  
  initMasteryChart()
  initWordCloudChart()
  initTrendChart()
  
  // 添加窗口resize监听
  window.addEventListener('resize', handleResize)
  console.log('✅ 所有图表初始化完成')
}

// 初始化知识掌握分布环状图
function initMasteryChart() {
  try {
    if (!masteryChartRef.value) {
      console.error('masteryChartRef元素不存在')
      return
    }
    
    // 销毁旧实例
    if (masteryChart && !masteryChart.isDisposed()) {
      masteryChart.dispose()
    }
    
    masteryChart = echarts.init(masteryChartRef.value)
    
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{a}<br/>{b}: {c}人 ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: { fontSize: 12 }
      },
      series: [{
        name: '知识掌握分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}\n{c}人',
          fontSize: 12
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data: masteryData.value
      }]
    }
    
    masteryChart.setOption(option)
    console.log('✅ 知识掌握分布图初始化完成')
  } catch (error) {
    console.error('初始化知识掌握分布图失败:', error)
  }
}

// 初始化学习行为词云图
function initWordCloudChart() {
  try {
    if (!wordCloudChartRef.value) {
      console.error('wordCloudChartRef元素不存在')
      return
    }
    
    // 销毁旧实例
    if (wordCloudChart && !wordCloudChart.isDisposed()) {
      wordCloudChart.dispose()
    }
    
    wordCloudChart = echarts.init(wordCloudChartRef.value)
    
    const option = {
      tooltip: {
        show: true,
        formatter: function(params) {
          return `${params.name}: ${params.value}次`
        }
      },
      series: [{
        type: 'wordCloud',
        shape: 'circle',
        left: 'center',
        top: 'center',
        width: '90%',
        height: '90%',
        sizeRange: [14, 50],
        rotationRange: [-45, 45],
        rotationStep: 45,
        gridSize: 8,
        drawOutOfBound: false,
        textStyle: {
          fontFamily: 'Microsoft YaHei, sans-serif',
          fontWeight: 'bold',
          color: function() {
            const colors = [
              '#4a6cf7', '#6a5af9', '#52c41a', '#1890ff',
              '#faad14', '#f5222d', '#722ed1', '#13c2c2'
            ]
            return colors[Math.floor(Math.random() * colors.length)]
          }
        },
        emphasis: {
          focus: 'self',
          textStyle: {
            textShadowBlur: 10,
            textShadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        data: wordCloudData.value
      }]
    }
    
    wordCloudChart.setOption(option)
    console.log('✅ 词云图初始化完成')
  } catch (error) {
    console.error('初始化词云图失败:', error)
  }
}

// 获取趋势数据
async function fetchTrendData(type = 'overall') {
  try {
    console.log(`📈 正在获取${type}的趋势数据...`);
    const res = await apiLearningTrend(type)
    
    if (res.success && res.data) {
      trendData.value = res.data
      console.log('✅ 趋势数据获取成功:', trendData.value)
      
      // 更新趋势图表
      updateTrendChart()
      
      // 更新统计卡片数据
      updateStatsCards(type)
    } else {
      console.warn('❌ 获取趋势数据失败，使用备选数据')
      useFallbackTrendData(type)
    }
  } catch (error) {
    console.error('获取趋势数据失败:', error)
    useFallbackTrendData(type)
  }
}

// 获取课程趋势数据
async function fetchCourseTrendData(courseId, filterKey) {
  try {
    console.log(`📈 正在获取课程${courseId}的趋势数据...`);
    
    // 调用修改后的API，传递课程ID作为第二个参数
    const res = await apiLearningTrend('course', courseId);
    
    if (res.success && res.data) {
      trendData.value = res.data
      console.log('✅ 课程趋势数据获取成功:', trendData.value)
      
      // 更新趋势图表
      updateTrendChart()
      
      // 从趋势数据中获取最新一周的数据更新统计卡片
      updateCourseStatsFromTrendData(res.data, filterKey)
    } else {
      console.warn('❌ 获取课程趋势数据失败，使用备选数据')
      useFallbackTrendData(filterKey)
    }
  } catch (error) {
    console.error('获取课程趋势数据失败:', error)
    useFallbackTrendData(filterKey)
  }
}

// 从趋势数据更新课程统计
function updateCourseStatsFromTrendData(trendData, filterKey) {
  if (trendData && trendData.weeks && trendData.weeks.length > 0) {
    // 获取最新一周的数据
    const lastIndex = trendData.weeks.length - 1;
    
    // 确保数据存在
    const lastCompletion = trendData.completion && trendData.completion[lastIndex] 
      ? trendData.completion[lastIndex] 
      : 0;
    const lastInteraction = trendData.interaction && trendData.interaction[lastIndex] 
      ? trendData.interaction[lastIndex] 
      : 0;
    const lastMastery = trendData.mastery && trendData.mastery[lastIndex] 
      ? trendData.mastery[lastIndex] 
      : 0;
    const lastFocusDuration = trendData.focusDuration && trendData.focusDuration[lastIndex] 
      ? trendData.focusDuration[lastIndex] 
      : 0;
    
    // 更新显示值
    avgFocusDuration.value = Math.round(lastFocusDuration).toString();
    avgCompletionRate.value = Math.round(lastCompletion) + '%';
    avgInteractionRate.value = Math.round(lastInteraction) + '%';
    avgMasteryRate.value = Math.round(lastMastery) + '%';
    
    // 更新统计数据对象
    statsData.value[filterKey] = {
      focusDuration: Math.round(lastFocusDuration).toString(),
      completionRate: Math.round(lastCompletion) + '%',
      interactionRate: Math.round(lastInteraction) + '%',
      masteryRate: Math.round(lastMastery) + '%'
    };
    
    console.log(`📊 更新课程${filterKey}统计:`, statsData.value[filterKey]);
  } else {
    console.warn('趋势数据为空或格式不正确');
  }
}


// 更新统计卡片
function updateStatsCards(type) {
  const stats = statsData.value[type] || statsData.value.overall
  
  avgFocusDuration.value = stats.focusDuration
  avgCompletionRate.value = stats.completionRate
  avgInteractionRate.value = stats.interactionRate
  avgMasteryRate.value = stats.masteryRate
}

// 加载课程筛选器
async function loadCourseFilters() {
  try {
    // 获取教师的课程列表
    const coursesRes = await apiTeacherCourses()
    console.log('📚 获取到的课程列表:', coursesRes)
    
    if (coursesRes.success && coursesRes.data && coursesRes.data.length > 0) {
      // 动态添加课程筛选器
      const courseFilters = coursesRes.data.map(course => {
        const courseKey = `course-${course.course_id}`
        
        return {
          key: courseKey,
          label: course.course_name,
          courseId: course.course_id
        }
      })
      
      // 更新筛选器数组（保留"总体教学风格"）
      filters.value = [
        { key: 'overall', label: '总体教学风格' },
        ...courseFilters
      ]
      
      console.log('✅ 动态筛选器生成完成:', filters.value)
    } else {
      console.warn('⚠️ 未获取到课程数据，使用默认筛选器')
      // 保持原有的 overall 筛选器
      filters.value = [
        { key: 'overall', label: '总体教学风格' }
      ]
    }
  } catch (error) {
    console.error('加载课程筛选器失败:', error)
    filters.value = [
      { key: 'overall', label: '总体教学风格' }
    ]
  }
}

// 从响应更新统计数据
function updateStatsDataFromResponse(latestStats) {
  if (latestStats) {
    Object.keys(latestStats).forEach(type => {
      const stats = latestStats[type]
      if (stats) {
        // 更新总体数据
        if (type === 'overall') {
          statsData.value.overall = {
            focusDuration: Math.round(stats.focus_duration).toString(),
            completionRate: Math.round(stats.completion_rate) + '%',
            interactionRate: Math.round(stats.interaction_rate) + '%',
            masteryRate: Math.round(stats.mastery_rate) + '%'
          }
        }
        // 更新课程数据（如果前端有对应的课程筛选器）
        else if (type.startsWith('course-')) {
          statsData.value[type] = {
            focusDuration: Math.round(stats.focus_duration).toString(),
            completionRate: Math.round(stats.completion_rate) + '%',
            interactionRate: Math.round(stats.interaction_rate) + '%',
            masteryRate: Math.round(stats.mastery_rate) + '%'
          }
        }
      }
    })
    
    // 初始化显示总体数据
    updateStatsCards('overall')
  }
}


function changeFilter(filterKey) {
  console.log('切换筛选器:', filterKey);
  console.log('当前筛选器数组:', filters.value);
  currentFilter.value = filterKey;
  
  // 获取课程ID（如果是课程筛选器）
  const courseId = filterKey.startsWith('course-') 
    ? filterKey.replace('course-', '')
    : null;
  console.log('课程ID:', courseId);
  
  // 根据筛选器类型获取数据
  if (filterKey === 'overall') {
    console.log('获取总体数据...');
    fetchTrendData('overall');
  } else if (courseId) {
    console.log(`获取课程${courseId}的数据...`);
    fetchCourseTrendData(courseId, filterKey);
  }
  
  // 重新渲染趋势图
  setTimeout(() => {
    if (trendChart && !trendChart.isDisposed()) {
      console.log('重新初始化趋势图');
      trendChart.dispose();
      initTrendChart();
    }
  }, 100);
}

// 初始化趋势图函数
function initTrendChart() {
  try {
    if (!trendChartRef.value) {
      console.error('trendChartRef元素不存在')
      return
    }
    
    // 销毁旧实例
    if (trendChart && !trendChart.isDisposed()) {
      trendChart.dispose()
    }
    
    trendChart = echarts.init(trendChartRef.value)
    
    // 使用实际数据
    updateTrendChart()
    
    console.log('✅ 趋势图初始化完成')
  } catch (error) {
    console.error('初始化趋势图失败:', error)
  }
}

// 更新趋势图函数
function updateTrendChart() {
  if (!trendChart || trendChart.isDisposed()) {
    return
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#ddd',
      borderWidth: 1,
      borderRadius: 8,
      padding: [10, 15],
      textStyle: {
        color: '#333'
      },
      formatter: function(params) {
        const weekName = params[0].axisValue || params[0].name || `第${params[0].dataIndex + 1}周`;
        let html = `<div style="font-weight: bold; margin-bottom: 5px;">${weekName}数据</div>`;

        params.forEach(param => {
          let icon = '📊'
          if (param.seriesName.includes('完播')) icon = '🎯'
          else if (param.seriesName.includes('互动')) icon = '💬'
          else if (param.seriesName.includes('掌握')) icon = '🎓'

          let value = param.value;
          let unit = param.seriesName.includes('时长') ? '分钟' : '%';
          
          html += `<div style="display: flex; justify-content: space-between; margin: 3px 0;">
          <span>${icon} ${param.seriesName}:</span>
          <span style="font-weight: bold; color:${param.color}">
            ${param.value}${param.seriesName.includes('专注时长') ? '分钟' : '%'}
          </span>
        </div>`
        })
        return html
      }
    },
    legend: {
      data: ['课程完播率', '互动参与度', '知识掌握度', '平均专注时长'],
      top: 10,
      textStyle: {
        fontSize: 12
      },
      itemWidth: 15,
      itemHeight: 10,
      itemGap: 15
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: trendData.value.weeks,
      axisLine: {
        lineStyle: {
          color: '#ccc'
        }
      },
      axisLabel: {
        color: '#666'
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '百分比(%)',
        min: 60,
        max: 100,
        position: 'left',
        axisLine: {
          lineStyle: {
            color: '#4a6cf7'
          }
        },
        splitLine: {
          lineStyle: {
            type: 'dashed',
            color: '#f0f0f0'
          }
        }
      },
      {
        type: 'value',
        name: '分钟',
        min: 15,
        max: 30,
        position: 'right',
        axisLine: {
          lineStyle: {
            color: '#f5222d'
          }
        },
        splitLine: {
          show: false
        }
      }
    ],
    series: [
      {
        name: '课程完播率',
        type: 'line',
        data: trendData.value.completion,
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#4a6cf7'
        },
        itemStyle: {
          color: '#4a6cf7'
        },
        symbol: 'circle',
        symbolSize: 8,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(74,108,247,0.3)' },
              { offset: 1, color: 'rgba(74,108,247,0.05)' }
            ]
          }
        },
        emphasis: {
          focus: 'series',
          itemStyle: {
            color: '#4a6cf7',
            borderColor: '#fff',
            borderWidth: 2,
            shadowBlur: 10,
            shadowColor: 'rgba(74,108,247,0.5)'
          }
        }
      },
      {
        name: '互动参与度',
        type: 'line',
        data: trendData.value.interaction,
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#52c41a'
        },
        itemStyle: {
          color: '#52c41a'
        },
        symbol: 'circle',
        symbolSize: 8,
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: '知识掌握度',
        type: 'line',
        data: trendData.value.mastery,
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#faad14'
        },
        itemStyle: {
          color: '#faad14'
        },
        symbol: 'circle',
        symbolSize: 8,
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: '平均专注时长',
        type: 'line',
        yAxisIndex: 1,
        data: trendData.value.focusDuration,
        smooth: true,
        lineStyle: {
          width: 2,
          type: 'dashed',
          color: '#f5222d'
        },
        itemStyle: {
          color: '#f5222d'
        },
        symbol: 'diamond',
        symbolSize: 6,
        emphasis: {
          focus: 'series'
        }
      }
    ],
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: [0],
        start: 0,
        end: 100
      }
    ]
  }
  
  trendChart.setOption(option, true)
  
  // 添加图表点击事件
  trendChart.off('click')
  trendChart.on('click', function(params) {
    if (params.componentType === 'series') {
      console.log(`点击了第${params.dataIndex + 1}周的${params.seriesName}: ${params.value}`)
      // 这里可以添加更详细的弹窗显示
    }
  })
}


// 窗口resize处理
function handleResize() {
  if (masteryChart && !masteryChart.isDisposed()) masteryChart.resize()
  if (wordCloudChart && !wordCloudChart.isDisposed()) wordCloudChart.resize()
  if (trendChart && !trendChart.isDisposed()) trendChart.resize()
}

// 返回教师中心
function goBack() {
  router.push('/personal/teacher')
}

// 组件卸载时清理
onUnmounted(() => {
  console.log('🔄 清理图表实例...')
  
  // 移除事件监听
  window.removeEventListener('resize', handleResize)
  
  // 安全地销毁图表实例
  const safeDispose = (chartInstance) => {
    if (chartInstance && typeof chartInstance.dispose === 'function' && !chartInstance.isDisposed()) {
      try {
        chartInstance.dispose()
      } catch (error) {
        console.warn('销毁图表实例时出错:', error)
      }
    }
  }
  
  safeDispose(masteryChart)
  safeDispose(wordCloudChart)
  safeDispose(trendChart)
  
  masteryChart = null
  wordCloudChart = null
  trendChart = null
  
  console.log('✅ 图表实例清理完成')
})

</script>

<style scoped>
.teacher-analysis-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  padding: 20px 0;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.analysis-header {
  background: linear-gradient(135deg, #4a6cf7 0%, #6a5af9 100%);
  color: white;
  padding: 30px;
  border-radius: 16px;
  margin-bottom: 30px;
  box-shadow: 0 8px 32px rgba(31,38,135,0.15);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.back-btn i {
  font-size: 16px;
}

.analysis-header h1 {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
  text-align: center;
  flex: 1;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.teacher-badge {
  background: #f9ab00;
  color: white;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4a6cf7, #6a5af9);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
}

.class-info {
  display: flex;
  gap: 30px;
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 15px;
  flex-wrap: wrap;
  justify-content: center;
}

.class-info span {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-section {
  display: flex;
  gap: 15px;
  margin-top: 15px;
  flex-wrap: wrap;
  justify-content: center;
}

.filter-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.filter-btn.active {
  background: white;
  color: #4a6cf7;
  font-weight: bold;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 25px;
  border-radius: 10px;
  border-left: 4px solid #4a6cf7;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.stat-label {
  color: #666;
  font-size: 14px;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin: 10px 0;
}

.stat-trend {
  font-size: 12px;
  color: #999;
}






/* 在TeacherAnalysis.vue的style部分添加以下样式 */

/* 交互式筛选按钮 */
.filter-btn {
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.filter-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.filter-btn:active::after {
  width: 100px;
  height: 100px;
}

/* 统计卡片动画 */
.stat-card {
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.stat-card:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.stat-card:active {
  transform: translateY(-2px) scale(1.01);
}

/* 图表容器悬停效果 */
.chart-container {
  transition: all 0.3s ease;
}

.chart-container:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

/* 加载动画 */
.loading-spinner {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* 数据标签强调 */
.stat-value {
  position: relative;
  display: inline-block;
}

.stat-value::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #4a6cf7, #6a5af9);
  transition: width 0.3s ease;
}

.stat-card:hover .stat-value::after {
  width: 100%;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filter-section {
    justify-content: flex-start;
    overflow-x: auto;
    padding-bottom: 10px;
  }
  
  .filter-btn {
    flex-shrink: 0;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}






.positive-feedback {
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%);
  border-left: 4px solid #52c41a;
  padding: 15px;
  border-radius: 8px;
  margin-top: 15px;
}

.feedback-title {
  font-weight: bold;
  color: #52c41a;
  margin-bottom: 8px;
}

.feedback-content {
  color: #333;
  line-height: 1.5;
  font-size: 14px;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 992px) {
  .chart-row {
    grid-template-columns: 1fr;
  }
}

.chart-container {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  min-height: 450px;
}

.chart-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #333;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-title i {
  color: #4a6cf7;
}

.chart {
  width: 100%;
  height: 400px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #999;
  font-size: 16px;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.loading-spinner {
  text-align: center;
}

.loading-spinner i {
  font-size: 48px;
  color: #4a6cf7;
  margin-bottom: 20px;
}

.loading-spinner p {
  color: #666;
  font-size: 18px;
}

@media (max-width: 768px) {
  .teacher-analysis-wrapper {
    padding: 10px 0;
  }
  
  .header-top {
    flex-direction: column;
    gap: 15px;
  }
  
  .analysis-header {
    padding: 20px;
  }
  
  .analysis-header h1 {
    font-size: 24px;
    order: 1;
  }
  
  .back-btn {
    order: 2;
    margin-top: 10px;
  }
  
  .user-info {
    order: 3;
    margin-top: 10px;
  }
  
  .class-info {
    flex-direction: column;
    gap: 10px;
  }
  
  .filter-section {
    flex-wrap: wrap;
  }
  
  .chart-container {
    min-height: 400px;
  }
}
</style>