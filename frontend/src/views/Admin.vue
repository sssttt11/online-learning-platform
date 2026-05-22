<template>
  <div class="admin-layout">
    <el-container class="full-height">
      <el-aside width="240px" class="elegant-sidebar">
        <div class="brand">
          <div class="logo serif-text">栖</div>
          <h2 class="serif-text">栖学后台</h2>
        </div>
        <el-menu :default-active="activeTab" class="custom-menu" :border="false" @select="handleMenuSelect">
          <el-menu-item index="dashboard">
            <i class="el-icon-data-line"></i>
            <span>数据看板</span>
          </el-menu-item>
          <el-menu-item index="courses">
            <i class="el-icon-reading"></i>
            <span>课程管理</span>
          </el-menu-item>
          <el-menu-item index="community">
            <i class="el-icon-chat-dot-square"></i>
            <span>社区管控</span>
          </el-menu-item>
        </el-menu>
        
        <div class="sidebar-footer">
          <el-button link @click="router.push('/dashboard')">← 返回学生端</el-button>
        </div>
      </el-aside>

      <el-main class="admin-main">
        
        <div v-show="activeTab === 'dashboard'" class="fade-in">
          <div class="page-header">
            <div>
              <h2 class="serif-text">平台数据洞察</h2>
              <p class="subtitle">掌控“栖学课堂”的整体运行状态</p>
            </div>
          </div>

          <el-row :gutter="20" class="stat-cards">
            <el-col :span="8">
              <el-card shadow="never" class="stat-card">
                <div class="stat-title">总上架课程</div>
                <div class="stat-value">{{ courseList.length }} <span class="unit">门</span></div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="never" class="stat-card">
                <div class="stat-title">平台总用户数</div>
                <div class="stat-value">1,284 <span class="unit">人</span></div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="never" class="stat-card">
                <div class="stat-title">今日提交作业</div>
                <div class="stat-value">42 <span class="unit">份</span></div>
              </el-card>
            </el-col>
          </el-row>

          <el-row :gutter="20" style="margin-top: 30px;">
            <el-col :span="12">
              <el-card shadow="never" class="chart-card">
                <h3 class="chart-title serif-text">课程领域分布</h3>
                <div ref="pieChartRef" style="height: 300px;"></div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card shadow="never" class="chart-card">
                <h3 class="chart-title serif-text">近七日学习活跃度</h3>
                <div ref="lineChartRef" style="height: 300px;"></div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <div v-show="activeTab === 'courses'" class="fade-in">
          <div class="page-header">
            <div>
              <h2 class="serif-text">课程资源库</h2>
              <p class="subtitle">管理平台所有上架的课程内容</p>
            </div>
            <el-button type="primary" @click="dialogVisible = true" class="add-btn">+ 发布新课程</el-button>
          </div>

          <el-card class="table-card">
            <el-table :data="courseList" style="width: 100%" v-loading="loading">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column label="课程封面" width="120">
                <template #default="scope">
                  <el-image :src="scope.row.cover_image" class="table-img" fit="cover" />
                </template>
              </el-table-column>
              <el-table-column prop="title" label="课程名称" min-width="200" />
              <el-table-column prop="category" label="所属分类" width="160">
                <template #default="scope">
                  <el-tag color="var(--light-mint)" style="color: var(--primary-green); border: none;">
                    {{ scope.row.category }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150" fixed="right">
                <template #default>
                  <el-button link type="primary">编辑</el-button>
                  <el-button link type="danger">下架</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>

        <div v-show="activeTab === 'community'" class="fade-in">
          <div class="page-header">
            <div>
              <h2 class="serif-text">社区舆情管控</h2>
              <p class="subtitle">维护平台学术氛围，及时清理违规探讨与评论</p>
            </div>
          </div>

          <el-card class="table-card">
            <el-table :data="postList" style="width: 100%" v-loading="loadingPosts">
              <el-table-column prop="id" label="帖子ID" width="80" />
              <el-table-column prop="title" label="探讨主题" min-width="200">
                <template #default="scope">
                  <span style="font-weight: bold; color: var(--deep-green);">{{ scope.row.title }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="username" label="发帖人" width="120" />
              <el-table-column prop="comment_count" label="评论数" width="100">
                <template #default="scope">
                  <el-tag size="small" type="info">{{ scope.row.comment_count }} 条</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120" fixed="right">
                <template #default="scope">
                  <el-popconfirm 
                    title="确定要强制删除此贴及其所有评论吗？" 
                    confirm-button-text="强制删除" 
                    cancel-button-text="取消"
                    confirm-button-type="danger"
                    @confirm="handleDeletePost(scope.row.id)"
                  >
                    <template #reference>
                      <el-button link type="danger">强制删帖</el-button>
                    </template>
                  </el-popconfirm>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>

      </el-main>
    </el-container>

    <el-dialog v-model="dialogVisible" title="🌿 发布新课程" width="600px" class="elegant-dialog">
      <el-form :model="courseForm" label-width="80px" class="custom-form">
        <el-form-item label="课程标题">
          <el-input v-model="courseForm.title" placeholder="例如：大学物理期末速成" />
        </el-form-item>
        <el-form-item label="课程分类">
          <el-select 
            v-model="courseForm.category" 
            filterable allow-create default-first-option
            placeholder="请选择或直接输入全新分类后回车" 
            style="width: 100%;"
          >
            <el-option label="📚 公共基础 (高数/线代/思政)" value="公共基础" />
            <el-option label="🌍 外语考级 (四六级/雅思)" value="外语考级" />
            <el-option label="🔬 理学与工程 (大物/力学)" value="理学与工程" />
            <el-option label="💻 IT与计算机 (编程/设计)" value="IT与计算机" />
            <el-option label="🎓 考研与升学 (专业课/复试)" value="考研与升学" />
            <el-option label="🏛️ 人文与社科 (历史/法学)" value="人文与社科" />
          </el-select>
        </el-form-item>
        <el-form-item label="封面链接">
          <el-input v-model="courseForm.cover_image" placeholder="输入图片网络地址" />
        </el-form-item>
        <el-form-item label="视频链接">
          <el-input v-model="courseForm.video_url" placeholder="输入视频网络地址 (如 mp4 链接)" />
        </el-form-item>
        <el-form-item label="课程简介">
          <el-input v-model="courseForm.description" type="textarea" :rows="3" placeholder="一句话描述这门课..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="publishCourse" :loading="submitting">确认发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import * as echarts from 'echarts'

const router = useRouter()
// 默认展示数据看板
const activeTab = ref('dashboard') 

// 课程模块变量
const courseList = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const submitting = ref(false)
const courseForm = ref({ title: '', category: '', cover_image: '', video_url: '', description: '', teacher_id: 1 })

// 社区模块变量
const postList = ref([])
const loadingPosts = ref(false)

// ECharts 相关的引用
const pieChartRef = ref(null)
const lineChartRef = ref(null)

// ================== 菜单切换逻辑 ==================
const handleMenuSelect = (index) => {
  activeTab.value = index
  if (index === 'dashboard') {
    nextTick(() => { initCharts() })
  } else if (index === 'community') {
    fetchPosts()
  }
}

// ================== 课程模块逻辑 ==================
const fetchCourses = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:3000/api/courses')
    if (res.data.success) {
      courseList.value = res.data.data
      initCharts() // 拉取完课程数据后更新图表
    }
  } catch (error) {
    ElMessage.error('获取课程列表失败')
  } finally {
    loading.value = false
  }
}

const publishCourse = async () => {
  if (!courseForm.value.title || !courseForm.value.category) {
    ElMessage.warning('标题和分类不能为空哦')
    return
  }
  submitting.value = true
  try {
    const res = await axios.post('http://localhost:3000/api/courses', courseForm.value)
    if (res.data.success) {
      ElMessage.success('课程发布成功！')
      dialogVisible.value = false
      courseForm.value = { title: '', category: '', cover_image: '', video_url: '', description: '', teacher_id: 1 }
      fetchCourses()
    }
  } catch (error) {
    ElMessage.error('发布失败')
  } finally {
    submitting.value = false
  }
}

// ================== 社区管控逻辑 ==================
const fetchPosts = async () => {
  loadingPosts.value = true
  try {
    const res = await axios.get('http://localhost:3000/api/posts')
    if (res.data.success) {
      postList.value = res.data.data
    }
  } catch (error) {
    ElMessage.error('获取社区帖子失败')
  } finally {
    loadingPosts.value = false
  }
}

const handleDeletePost = async (postId) => {
  try {
    const res = await axios.delete(`http://localhost:3000/api/posts/${postId}`)
    if (res.data.success) {
      ElMessage.success('违规帖子及相关评论已被彻底清除')
      fetchPosts() // 重新拉取帖子列表
    }
  } catch (error) {
    ElMessage.error('删帖失败，请检查网络')
  }
}

// ================== ECharts 图表逻辑 ==================
const initCharts = () => {
  if (!pieChartRef.value || !lineChartRef.value) return

  const pieChart = echarts.init(pieChartRef.value)
  const lineChart = echarts.init(lineChartRef.value)

  const categoryCount = {}
  courseList.value.forEach(course => {
    categoryCount[course.category] = (categoryCount[course.category] || 0) + 1
  })
  const pieData = Object.keys(categoryCount).map(key => ({ name: key, value: categoryCount[key] }))

  pieChart.setOption({
    tooltip: { trigger: 'item' },
    color: ['#6ab085', '#8fa799', '#c5a47e', '#e0ede5', '#3d5a49'],
    series: [{
      name: '课程分类',
      type: 'pie',
      radius: ['40%', '70%'],
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      data: pieData.length > 0 ? pieData : [{ name: '暂无数据', value: 0 }]
    }]
  })

  lineChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'], boundaryGap: false },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f0f5f2' } } },
    series: [{
      data: [120, 200, 150, 280, 210, 390, 420],
      type: 'line',
      smooth: true,
      lineStyle: { color: '#6ab085', width: 4 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(106, 176, 133, 0.5)' },
          { offset: 1, color: 'rgba(106, 176, 133, 0.0)' }
        ])
      },
      itemStyle: { color: '#6ab085' }
    }]
  })
  
  window.addEventListener('resize', () => {
    pieChart.resize()
    lineChart.resize()
  })
}

onMounted(() => {
  fetchCourses()
})
</script>

<style scoped>
.admin-layout { height: 100vh; background-color: var(--light-mint); }
.full-height { height: 100%; }
.fade-in { animation: fadeIn 0.4s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* 侧边栏美化 */
.elegant-sidebar {
  background-color: #ffffff;
  border-right: 1px solid rgba(106, 176, 133, 0.15);
  display: flex; flex-direction: column;
}
.brand { padding: 30px 20px; display: flex; align-items: center; gap: 15px; }
.logo {
  background: var(--primary-green); color: white;
  width: 40px; height: 40px; line-height: 40px;
  text-align: center; border-radius: 12px; font-size: 20px;
}
.brand h2 { margin: 0; color: var(--deep-green); font-size: 20px; }
.custom-menu { flex: 1; background: transparent; }
.custom-menu .el-menu-item.is-active {
  background-color: var(--light-mint); color: var(--primary-green);
  border-right: 4px solid var(--primary-green);
}
.sidebar-footer { padding: 20px; border-top: 1px solid #f0f5f2; }

/* 主内容区 */
.admin-main { padding: 40px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.page-header h2 { margin: 0 0 5px 0; color: var(--deep-green); font-size: 24px; }
.subtitle { color: #8fa799; margin: 0; font-size: 14px; }

/* 数据看板专属卡片样式 */
.stat-card { border-radius: 16px; border: none; box-shadow: var(--shadow-soft); text-align: center; padding: 10px 0;}
.stat-title { color: #8fa799; font-size: 14px; margin-bottom: 10px; }
.stat-value { color: var(--deep-green); font-size: 32px; font-weight: bold; font-family: 'DM Sans', sans-serif;}
.unit { font-size: 14px; color: #8fa799; font-weight: normal; }
.chart-card { border-radius: 16px; border: none; box-shadow: var(--shadow-soft); }
.chart-title { color: var(--deep-green); margin-top: 0; font-size: 18px; border-bottom: 1px solid #f0f5f2; padding-bottom: 15px;}

.table-card { border-radius: 16px; border: none; box-shadow: var(--shadow-soft); }
.table-img { width: 80px; height: 50px; border-radius: 8px; }

:deep(.elegant-dialog) { border-radius: 20px; overflow: hidden; }
:deep(.elegant-dialog .el-dialog__header) {
  background-color: var(--light-mint); margin-right: 0; padding: 20px;
}
</style>