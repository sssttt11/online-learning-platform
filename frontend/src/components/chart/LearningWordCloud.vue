<template>
  <div class="learning-wordcloud">
    <!-- 词云容器 -->
    <div class="wordcloud-wrapper">
      <div v-if="!chartData || chartData.length === 0" class="empty-wordcloud">
        <i class="fas fa-cloud fa-3x text-muted"></i>
        <p class="mt-3 text-muted">暂无学习数据</p>
        <small>请先开始学习课程以生成词云</small>
      </div>
      <div v-else ref="chartRef" class="chart-container"></div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

export default {
  name: 'LearningWordCloud',
  
  props: {
    wordData: {
      type: Array,
      default: () => []
    },
    type: {
      type: String,
      default: 'course'
    }
  },
  
  setup(props) {
    const chartRef = ref(null)
    const chartInstance = ref(null)
    const chartData = ref([])
    
    // 颜色数组
    const colorArray = [
      '#4a6cf7', '#6a5af9', '#52c41a', '#1890ff', 
      '#faad14', '#f5222d', '#722ed1', '#13c2c2',
      '#eb2f96', '#fa8c16', '#a0d911', '#08979c'
    ]
    
    // 计算权重
    const calculateWeight = (item) => {
      const progress = item.progress || item.progress_rate || 0
      const mastery = item.mastery || item.mastery_level || item.progress || 0
      const duration = item.studyDuration || item.total_study_time || item.total_learn_duration || 0
      
      const normalizedDuration = Math.min(duration / 1200, 1) * 100
      const weight = (progress * 0.4) + (mastery * 0.4) + (normalizedDuration * 0.2)
      
      return Math.max(15, Math.min(80, weight)) // 缩小权重范围
    }
    
    // 处理词云数据
    const processWordcloudData = () => {
      if (!props.wordData || props.wordData.length === 0) {
        chartData.value = []
        return
      }
      
      const processedData = []
      
      props.wordData.forEach((item, index) => {
        let text = ''
        if (props.type === 'course') {
          text = item.course_name || item.title || '未知课程'
        } else {
          text = item.chapter_title || item.title || '未知章节'
        }
        
        // 进一步截断文本
        if (text.length > 8) {
          text = text.substring(0, 8) + '...'
        }
        
        const weight = calculateWeight(item)
        const colorIndex = index % colorArray.length
        
        processedData.push({
          name: text,
          value: weight,
          textStyle: {
            color: colorArray[colorIndex]
          },
          progress: Math.round(item.progress || item.progress_rate || 0),
          mastery: Math.round(item.mastery || item.mastery_level || 0),
          duration: Math.round(item.studyDuration || item.total_study_time || item.total_learn_duration || 0)
        })
      })
      
      chartData.value = processedData.sort((a, b) => b.value - a.value)
    }
    
    // 初始化图表
    const initChart = () => {
      if (!chartRef.value || chartData.value.length === 0) {
        return
      }
      
      // 异步加载 echarts
      Promise.all([
        import('echarts'),
        import('echarts-wordcloud')
      ]).then(([echartsModule]) => {
        const echarts = echartsModule.default || echartsModule
        
        // 销毁之前的实例
        if (chartInstance.value) {
          chartInstance.value.dispose()
        }
        
        // 初始化图表
        chartInstance.value = echarts.init(chartRef.value)
        
        // 配置项 - 缩小尺寸
        const option = {
          tooltip: {
            show: true,
            formatter: function(params) {
              const data = params.data
              if (!data) return ''
              
              let tooltipHtml = `<div style="font-weight:bold;color:${params.color};margin-bottom:8px;">${data.name}</div>`
              
              if (props.type === 'course') {
                tooltipHtml += `
                  <div>学习进度：<b style="color:#4a6cf7">${data.progress}%</b></div>
                  <div>掌握度：<b style="color:#52c41a">${data.mastery}%</b></div>
                  <div>时长：<b style="color:#1890ff">${data.duration}分钟</b></div>
                `
              } else {
                tooltipHtml += `
                  <div>章节进度：<b style="color:#4a6cf7">${data.progress}%</b></div>
                  <div>学习时长：<b style="color:#1890ff">${data.duration}分钟</b></div>
                `
              }
              
              return tooltipHtml
            },
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderColor: '#4a6cf7',
            borderWidth: 1,
            borderRadius: 8,
            padding: [12, 16]
          },
          series: [{
            type: 'wordCloud',
            shape: 'circle',
            left: 'center',
            top: 'center',
            width: '95%',
            height: '95%',
            sizeRange: [12, 40], // 缩小字体大小
            rotationRange: [-30, 30], // 缩小旋转范围
            rotationStep: 30,
            gridSize: 8, // 缩小网格大小
            drawOutOfBound: false,
            textStyle: {
              fontFamily: 'Microsoft YaHei, Arial, sans-serif',
              fontWeight: 'bold',
              color: function (params) {
                return params.data.textStyle?.color || colorArray[Math.floor(Math.random() * colorArray.length)]
              }
            },
            emphasis: {
              focus: 'self',
              textStyle: {
                textShadowBlur: 6,
                textShadowColor: 'rgba(0, 0, 0, 0.2)'
              }
            },
            data: chartData.value
          }]
        }
        
        chartInstance.value.setOption(option)
        
        // 监听窗口大小变化
        window.addEventListener('resize', handleResize)
        
      }).catch(() => {
        // 静默失败
      })
    }
    
    // 处理窗口大小变化
    const handleResize = () => {
      if (chartInstance.value) {
        chartInstance.value.resize()
      }
    }
    
    // 观察数据变化
    watch(() => props.wordData, () => {
      processWordcloudData()
      nextTick(() => {
        initChart()
      })
    }, { deep: true })
    
    // 生命周期
    onMounted(() => {
      processWordcloudData()
      nextTick(() => {
        initChart()
      })
    })
    
    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
      
      if (chartInstance.value) {
        chartInstance.value.dispose()
        chartInstance.value = null
      }
    })
    
    return {
      chartRef,
      chartData
    }
  }
}
</script>

<style scoped>
.learning-wordcloud {
  width: 100%;
  height: 100%;
}

.wordcloud-wrapper {
  width: 100%;
  height: 100%;
}

.chart-container {
  width: 100%;
  height: 100%;
}

.empty-wordcloud {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #999;
}

.empty-wordcloud i {
  margin-bottom: 15px;
  opacity: 0.5;
}

.empty-wordcloud p {
  font-size: 16px;
  margin-bottom: 5px;
}

.empty-wordcloud small {
  font-size: 12px;
  color: #ccc;
}
</style>