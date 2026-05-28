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
            <i class="el-icon-data-line"></i><span>数据看板</span>
          </el-menu-item>
          <el-menu-item index="courses">
            <i class="el-icon-reading"></i><span>课程管理</span>
          </el-menu-item>
          <el-menu-item index="community">
            <i class="el-icon-chat-dot-square"></i><span>社区管控</span>
          </el-menu-item>
        </el-menu>
        <div class="sidebar-footer">
          <el-button link @click="router.push('/dashboard')">← 返回学生端</el-button>
        </div>
      </el-aside>

      <el-main class="admin-main">
        
        <div v-show="activeTab === 'dashboard'" class="fade-in">
          <div class="page-header">
            <div><h2 class="serif-text">平台数据洞察</h2><p class="subtitle">掌控“栖学课堂”的整体运行状态</p></div>
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
            <div><h2 class="serif-text">课程资源库</h2><p class="subtitle">管理平台所有上架的课程内容</p></div>
            <el-button type="primary" @click="openAddDialog" class="add-btn">+ 发布新课程</el-button>
          </div>
          <el-card class="table-card">
            <el-table :data="courseList" style="width: 100%" v-loading="loading">
              <el-table-column prop="id" label="ID" width="60" />
              <el-table-column label="课程封面" width="120">
                <template #default="scope">
                  <el-image :src="scope.row.cover_image" class="table-img" fit="cover" />
                </template>
              </el-table-column>
              <el-table-column prop="title" label="课程名称" min-width="180" />
              
              <el-table-column prop="teacher_name" label="主讲导师" width="120">
                <template #default="scope">
                  <span style="color: var(--deep-green); font-weight: 500;">{{ scope.row.teacher_name || '特邀导师' }}</span>
                </template>
              </el-table-column>

              <el-table-column prop="category" label="所属分类" width="130">
                <template #default="scope">
                  <el-tag color="var(--light-mint)" style="color: var(--primary-green); border: none;">{{ scope.row.category }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="220" fixed="right">
                <template #default="scope">
                  <el-button link type="warning" @click="openChapterManager(scope.row)">目录管理</el-button>
                  <el-button link type="primary" @click="handleEditCourse(scope.row)">编辑</el-button>
                  <el-popconfirm title="确定要下架这门课吗？" confirm-button-text="下架" cancel-button-text="取消" confirm-button-type="danger" @confirm="handleDeleteCourse(scope.row.id)">
                    <template #reference><el-button link type="danger">下架</el-button></template>
                  </el-popconfirm>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>

        <div v-show="activeTab === 'community'" class="fade-in">
          <div class="page-header">
            <div><h2 class="serif-text">社区舆情管控</h2><p class="subtitle">维护平台学术氛围，及时清理违规探讨与评论</p></div>
          </div>
          <el-card class="table-card">
            <el-table :data="postList" style="width: 100%" v-loading="loadingPosts">
              <el-table-column prop="id" label="帖子ID" width="80" />
              <el-table-column prop="title" label="探讨主题" min-width="200">
                <template #default="scope"><span style="font-weight: bold; color: var(--deep-green);">{{ scope.row.title }}</span></template>
              </el-table-column>
              <el-table-column prop="username" label="发帖人" width="120" />
              <el-table-column prop="comment_count" label="评论数" width="100">
                <template #default="scope"><el-tag size="small" type="info">{{ scope.row.comment_count }} 条</el-tag></template>
              </el-table-column>
              <el-table-column label="操作" width="120" fixed="right">
                <template #default="scope">
                  <el-popconfirm title="确定要强制删除此贴及其所有评论吗？" confirm-button-text="强制删除" cancel-button-text="取消" confirm-button-type="danger" @confirm="handleDeletePost(scope.row.id)">
                    <template #reference><el-button link type="danger">强制删帖</el-button></template>
                  </el-popconfirm>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-main>
    </el-container>

    <el-dialog v-model="dialogVisible" :title="isEditMode ? '📝 编辑课程信息' : '🌿 发布新课程'" width="600px" class="elegant-dialog">
      <el-form :model="courseForm" label-width="80px" class="custom-form">
        <el-form-item label="课程标题"><el-input v-model="courseForm.title" placeholder="例如：大学物理期末速成" /></el-form-item>
        
        <el-form-item label="主讲导师">
          <el-input v-model="courseForm.teacher_name" placeholder="请输入主讲导师姓名与头衔，如：李博士 / 独立架构师" />
        </el-form-item>

        <el-form-item label="课程分类">
          <el-select v-model="courseForm.category" filterable allow-create default-first-option placeholder="请选择或输入全新分类后回车" style="width: 100%;">
            <el-option label="📚 公共基础 (高数/线代/思政)" value="公共基础" />
            <el-option label="🌍 外语考级 (四六级/雅思)" value="外语考级" />
            <el-option label="🔬 理学与工程 (大物/力学)" value="理学与工程" />
            <el-option label="💻 IT与计算机 (编程/设计)" value="IT与计算机" />
          </el-select>
        </el-form-item>
        <el-form-item label="课程封面">
          <el-upload
            class="cover-uploader"
            action="http://localhost:3000/api/upload"
            name="cover"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :before-upload="beforeUpload"
          >
            <img v-if="courseForm.cover_image" :src="courseForm.cover_image" class="uploaded-cover" />
            <el-icon v-else class="cover-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div style="font-size: 12px; color: #8fa799; margin-top: 5px; line-height: 1.2;">
            点击上方虚线框上传本地图片。建议尺寸比例 16:9，支持 JPG/PNG。
          </div>
        </el-form-item>
        <el-form-item label="默认视频"><el-input v-model="courseForm.video_url" placeholder="无章节时的默认播放链接" /></el-form-item>
        <el-form-item label="课程简介"><el-input v-model="courseForm.description" type="textarea" :rows="3" placeholder="一句话描述这门课..." /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCourse" :loading="submitting">{{ isEditMode ? '保存修改' : '确认发布' }}</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="chapterDrawerVisible" :title="'📖 章节管理：' + (currentManageCourse?.title || '')" size="450px" class="elegant-drawer">
      <div v-if="adminChapterList.length === 0" class="empty-state">当前课程暂无章节目录。</div>
      <el-timeline v-else style="padding-left: 0; margin-top: 10px;">
        <el-timeline-item v-for="chap in adminChapterList" :key="chap.id" :timestamp="'第 ' + chap.chapter_number + ' 讲'" color="#6ab085">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="flex: 1; padding-right: 15px;">
              <span style="font-weight: bold; color: var(--deep-green); font-size: 15px;">{{ chap.title }}</span>
              <div style="font-size: 12px; color: #8fa799; margin-top: 6px; word-break: break-all; line-height: 1.4;">{{ chap.video_url }}</div>
            </div>
            <el-button link type="danger" @click="deleteChapter(chap.id)">删除</el-button>
          </div>
        </el-timeline-item>
      </el-timeline>
      <el-divider>添加新章节</el-divider>
      <el-form :model="newChapterForm" label-position="top" class="custom-form">
        <el-form-item label="集数序号 (如: 1, 2, 3)"><el-input-number v-model="newChapterForm.chapter_number" :min="1" style="width: 150px;" /></el-form-item>
        <el-form-item label="章节标题"><el-input v-model="newChapterForm.title" placeholder="如：第一讲 极限与连续" /></el-form-item>
        <el-form-item label="视频专属链接"><el-input v-model="newChapterForm.video_url" placeholder="https://..." /></el-form-item>
        <el-button type="primary" style="width: 100%; margin-top: 10px; border-radius: 12px;" @click="addChapter" :loading="addingChapter">保存章节并发布</el-button>
      </el-form>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import * as echarts from 'echarts'

const router = useRouter()
const activeTab = ref('dashboard') 

// 课程模块变量
const courseList = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const submitting = ref(false)
const isEditMode = ref(false) 
// 🌟 结构变化：移除了 teacher_id，全面改用文本形式的 teacher_name
const courseForm = ref({ title: '', category: '', cover_image: '', video_url: '', description: '', teacher_name: '' })

// 章节管理变量
const chapterDrawerVisible = ref(false)
const currentManageCourse = ref(null)
const adminChapterList = ref([])
const newChapterForm = ref({ chapter_number: 1, title: '', video_url: '' })
const addingChapter = ref(false)

const postList = ref([])
const loadingPosts = ref(false)
const pieChartRef = ref(null)
const lineChartRef = ref(null)

const handleMenuSelect = (index) => {
  activeTab.value = index
  if (index === 'dashboard') nextTick(() => initCharts())
  else if (index === 'community') fetchPosts()
}

const fetchCourses = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:3000/api/courses')
    if (res.data.success) { courseList.value = res.data.data; initCharts() }
  } catch (error) { ElMessage.error('获取课程失败') } finally { loading.value = false }
}

const openAddDialog = () => { 
  isEditMode.value = false; 
  courseForm.value = { title: '', category: '', cover_image: '', video_url: '', description: '', teacher_name: '' }; 
  dialogVisible.value = true 
}

const handleEditCourse = (row) => { isEditMode.value = true; courseForm.value = { ...row }; dialogVisible.value = true }

const saveCourse = async () => {
  if (!courseForm.value.title || !courseForm.value.category) {
    return ElMessage.warning('标题和分类不能为空哦')
  }
  submitting.value = true
  try {
    if (isEditMode.value) {
      await axios.put(`http://localhost:3000/api/courses/${courseForm.value.id}`, courseForm.value)
      ElMessage.success('课程更新成功！')
    } else {
      await axios.post('http://localhost:3000/api/courses', courseForm.value)
      ElMessage.success('新课程发布成功！')
    }
    dialogVisible.value = false; fetchCourses()
  } catch (error) { ElMessage.error('操作失败') } finally { submitting.value = false }
}
import { Plus } from '@element-plus/icons-vue' // 引入加号图标

// ================== 图片上传控制逻辑 ==================
// 上传前校验（拦截不合格的文件）
const beforeUpload = (file) => {
  const isImage = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传 JPG / PNG / WEBP 格式的图片！')
  }
  if (!isLt2M) {
    ElMessage.error('图片体积不能超过 2MB！')
  }
  return isImage && isLt2M
}

// 🌟 图片上传成功后，将后端返回的真实链接塞进表单的 cover_image 字段
const handleUploadSuccess = (res, file) => {
  if (res.success) {
    courseForm.value.cover_image = res.url // 将后端生成的地址赋给表单
    ElMessage.success('封面上传成功！')
  } else {
    ElMessage.error('上传失败，请重试')
  }
}

const handleDeleteCourse = async (courseId) => {
  try {
    const res = await axios.delete(`http://localhost:3000/api/courses/${courseId}`)
    if (res.data.success) { ElMessage.success('课程已下架！'); fetchCourses() }
  } catch (error) { ElMessage.error('下架失败') }
}

// 章节管理逻辑
const fetchAdminChapters = async (courseId) => {
  try {
    const res = await axios.get(`http://localhost:3000/api/courses/${courseId}/chapters`)
    if (res.data.success) adminChapterList.value = res.data.data
  } catch (error) {}
}
const openChapterManager = async (course) => {
  currentManageCourse.value = course; chapterDrawerVisible.value = true; await fetchAdminChapters(course.id)
  newChapterForm.value = { chapter_number: adminChapterList.value.length + 1, title: '', video_url: '' }
}
const addChapter = async () => {
  if (!newChapterForm.value.title || !newChapterForm.value.video_url) return ElMessage.warning('标题和视频链接必填')
  addingChapter.value = true
  try {
    const res = await axios.post(`http://localhost:3000/api/courses/${currentManageCourse.value.id}/chapters`, newChapterForm.value)
    if (res.data.success) {
      ElMessage.success('章节添加成功！'); await fetchAdminChapters(currentManageCourse.value.id)
      newChapterForm.value = { chapter_number: adminChapterList.value.length + 1, title: '', video_url: '' }
    }
  } catch (error) {} finally { addingChapter.value = false }
}
const deleteChapter = async (chapterId) => {
  try {
    const res = await axios.delete(`http://localhost:3000/api/chapters/${chapterId}`)
    if (res.data.success) { ElMessage.success('章节已移除'); fetchAdminChapters(currentManageCourse.value.id) }
  } catch (error) {}
}

// 社区与图表
const fetchPosts = async () => {
  loadingPosts.value = true
  try {
    const res = await axios.get('http://localhost:3000/api/posts')
    if (res.data.success) postList.value = res.data.data
  } catch (error) {} finally { loadingPosts.value = false }
}
const handleDeletePost = async (postId) => {
  try {
    const res = await axios.delete(`http://localhost:3000/api/posts/${postId}`)
    if (res.data.success) { ElMessage.success('违规帖子已被彻底清除'); fetchPosts() }
  } catch (error) {}
}

const initCharts = () => {
  if (!pieChartRef.value || !lineChartRef.value) return
  const pieChart = echarts.init(pieChartRef.value), lineChart = echarts.init(lineChartRef.value)
  const categoryCount = {}
  courseList.value.forEach(course => { categoryCount[course.category] = (categoryCount[course.category] || 0) + 1 })
  const pieData = Object.keys(categoryCount).map(key => ({ name: key, value: categoryCount[key] }))
  pieChart.setOption({ tooltip: { trigger: 'item' }, color: ['#6ab085', '#8fa799', '#c5a47e', '#e0ede5', '#3d5a49'], series: [{ name: '课程分类', type: 'pie', radius: ['40%', '70%'], itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 }, data: pieData.length > 0 ? pieData : [{ name: '暂无数据', value: 0 }] }] })
  lineChart.setOption({ tooltip: { trigger: 'axis' }, xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'], boundaryGap: false }, yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f0f5f2' } } }, series: [{ data: [120, 200, 150, 280, 210, 390, 420], type: 'line', smooth: true, lineStyle: { color: '#6ab085', width: 4 }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(106, 176, 133, 0.5)' }, { offset: 1, color: 'rgba(106, 176, 133, 0.0)' }]) }, itemStyle: { color: '#6ab085' } }] })
  window.addEventListener('resize', () => { pieChart.resize(); lineChart.resize() })
}

onMounted(() => { fetchCourses() })
</script>

<style scoped>
.admin-layout { height: 100vh; background-color: var(--light-mint); }
.full-height { height: 100%; }
.fade-in { animation: fadeIn 0.4s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.elegant-sidebar { background-color: #ffffff; border-right: 1px solid rgba(106, 176, 133, 0.15); display: flex; flex-direction: column; }
.brand { padding: 30px 20px; display: flex; align-items: center; gap: 15px; }
.logo { background: var(--primary-green); color: white; width: 40px; height: 40px; line-height: 40px; text-align: center; border-radius: 12px; font-size: 20px; }
.brand h2 { margin: 0; color: var(--deep-green); font-size: 20px; }
.custom-menu { flex: 1; background: transparent; }
.custom-menu .el-menu-item.is-active { background-color: var(--light-mint); color: var(--primary-green); border-right: 4px solid var(--primary-green); }
.sidebar-footer { padding: 20px; border-top: 1px solid #f0f5f2; }
.admin-main { padding: 40px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.page-header h2 { margin: 0 0 5px 0; color: var(--deep-green); font-size: 24px; }
.subtitle { color: #8fa799; margin: 0; font-size: 14px; }
.stat-card { border-radius: 16px; border: none; box-shadow: var(--shadow-soft); text-align: center; padding: 10px 0;}
.stat-title { color: #8fa799; font-size: 14px; margin-bottom: 10px; }
.stat-value { color: var(--deep-green); font-size: 32px; font-weight: bold; font-family: 'DM Sans', sans-serif;}
.unit { font-size: 14px; color: #8fa799; font-weight: normal; }
.chart-card { border-radius: 16px; border: none; box-shadow: var(--shadow-soft); }
.chart-title { color: var(--deep-green); margin-top: 0; font-size: 18px; border-bottom: 1px solid #f0f5f2; padding-bottom: 15px;}
.table-card { border-radius: 16px; border: none; box-shadow: var(--shadow-soft); }
.table-img { width: 80px; height: 50px; border-radius: 8px; }
:deep(.elegant-dialog) { border-radius: 20px; overflow: hidden; }
:deep(.elegant-dialog .el-dialog__header) { background-color: var(--light-mint); margin-right: 0; padding: 20px; }
.empty-state { text-align: center; color: #8fa799; font-size: 14px; padding: 30px 0; }
/* 封面上传框专属样式 */
.cover-uploader {
  border: 1px dashed #c8dcd0;
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
  width: 240px;
  height: 135px; /* 经典的 16:9 比例 */
  background-color: var(--paper-cream);
  display: flex;
  justify-content: center;
  align-items: center;
}
.cover-uploader:hover {
  border-color: var(--primary-green);
}
.cover-uploader-icon {
  font-size: 28px;
  color: #8fa799;
}
.uploaded-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>