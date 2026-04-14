<template>
  <div class="study-room">

    <!-- 自习室头部 -->
    <section class="room-header">
      <div class="container">
        <div class="room-info">
          <div class="room-avatar">
            <img v-if="roomData.avatarUrl" :src="roomData.avatarUrl" alt="自习室头像" class="room-avatar-img" />
            <i v-else class="fas fa-book-open"></i>
            <label v-if="isAdmin" class="avatar-upload-btn">
              <i class="fas fa-camera"></i>
              <input type="file" accept="image/*" @change="onAvatarChange" hidden>
            </label>
          </div>
          <div class="room-details">
            <h1>{{ roomData.name || '加载中...' }}</h1>
            <p class="room-description">{{ roomData.description || '正在加载自习室信息...' }}</p>
            <div class="room-tags" v-if="roomData.tags && roomData.tags.length">
              <span v-for="tag in roomData.tags" :key="tag" class="room-tag">{{ tag }}</span>
            </div>
            <div class="room-stats">
              <div class="room-stat">
                <div class="stat-value">{{ roomData.onlineCount || 0 }}</div>
                <div class="stat-label">在线人数</div>
              </div>
              <div class="room-stat">
                <div class="stat-value">{{ roomData.totalMembers || 0 }}</div>
                <div class="stat-label">总成员</div>
              </div>
              <div class="room-stat">
                <div class="stat-value">{{ roomData.totalStudyHours || 0 }}</div>
                <div class="stat-label">累计学习时长</div>
              </div>
              <div class="room-stat">
                <div class="stat-value">{{ roomData.completedTasks || 0 }}</div>
                <div class="stat-label">完成任务</div>
              </div>
              <div class="room-stat" v-if="roomData.scheduleTime">
                <div class="stat-value">{{ roomData.scheduleTime }}</div>
                <div class="stat-label">开放时间</div>
              </div>
            </div>
          </div>
          <div class="room-actions">
            <button class="btn btn-primary" @click="joinRoom">
              <i class="fas fa-sign-in-alt"></i>
              {{ isJoined ? '离开自习室' : '加入自习室' }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 主要内容 -->
    <div class="container">
      <div class="content-grid">
        <!-- 左侧内容 -->
        <div class="main-content">
          <!-- 学习进度饼状图 -->
          <div class="content-section">
            <h2 class="section-title">
              <i class="fas fa-chart-pie"></i>
              我的学习进度
            </h2>
            
            <!-- 任务统计摘要 -->
            <div class="task-summary-cards">
              <div class="summary-card">
                <div class="summary-icon completed">
                  <i class="fas fa-check-circle"></i>
                </div>
                <div class="summary-content">
                  <div class="summary-value">{{ taskStatistics.total_tasks || 0 }}</div>
                  <div class="summary-label">总任务</div>
                </div>
              </div>
              <div class="summary-card">
                <div class="summary-icon pending">
                  <i class="fas fa-clock"></i>
                </div>
                <div class="summary-content">
                  <div class="summary-value">{{ taskStatistics.completed_tasks || 0 }}</div>
                  <div class="summary-label">已完成</div>
                </div>
              </div>
              <div class="summary-card">
                <div class="summary-icon rate">
                  <i class="fas fa-chart-line"></i>
                </div>
                <div class="summary-content">
                  <div class="summary-value">{{ taskStatistics.completion_rate || 0 }}%</div>
                  <div class="summary-label">完成率</div>
                </div>
              </div>
              <div class="summary-card">
                <div class="summary-icon time">
                  <i class="fas fa-hourglass-half"></i>
                </div>
                <div class="summary-content">
                  <div class="summary-value">{{ taskStatistics.total_completion_hours || '0.0' }}</div>
                  <div class="summary-label">总耗时(小时)</div>
                </div>
              </div>
            </div>

            <!-- 任务完成时间饼状图 -->
            <div v-if="taskStatistics.pie_chart && taskStatistics.pie_chart.labels && taskStatistics.pie_chart.labels.length > 0" 
                 class="chart-container" style="height: 300px; margin-top: 20px;">
              <div ref="taskPieChart" style="width: 100%; height: 100%;"></div>
            </div>
            <div v-else class="no-data-chart">
              <i class="fas fa-tasks"></i>
              <p>暂无已完成任务数据</p>
            </div>

            <!-- 任务进度条 -->
            <div class="task-progress-section" v-if="taskStatistics.total_tasks > 0">
              <div class="progress-header">
                <span class="progress-title">
                  <i class="fas fa-chart-line"></i>
                  任务完成进度
                </span>
                <span class="progress-percentage">{{ taskStatistics.completion_rate || 0 }}%</span>
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar" :style="{ 
                  width: `${taskStatistics.completion_rate || 0}%`,
                  background: 'linear-gradient(90deg, #1a73e8, #34a853)'
                }"></div>
              </div>
              <div class="progress-stats">
                <span class="progress-stat">
                  <i class="fas fa-check-circle" style="color: #34a853;"></i>
                  已完成: {{ taskStatistics.completed_tasks || 0 }}
                </span>
                <span class="progress-stat">
                  <i class="fas fa-hourglass-half" style="color: #ff9800;"></i>
                  待完成: {{ taskStatistics.pending_tasks || 0 }}
                </span>
                <span class="progress-stat">
                  <i class="fas fa-tasks" style="color: #1a73e8;"></i>
                  总计: {{ taskStatistics.total_tasks || 0 }}
                </span>
              </div>
            </div>
          </div>

          <!-- 任务清单 -->
          <div class="content-section tasklist-section">
            <div class="tasklist-header">
              <div class="tasklist-title">
                <i class="fas fa-clipboard-list"></i>
                <span>我的任务清单</span>
              </div>
              <div class="tasklist-actions">
                <button class="tasklist-search" @click="openTaskHistory">
                  <i class="fas fa-search"></i>
                  搜索任务记录
                </button>
                <button class="tasklist-add" @click="openCreateTaskModal">
                  <i class="fas fa-plus"></i>
                  添加任务
                </button>
              </div>
            </div>

            <div class="tasklist-tabs">
              <button
                class="tasklist-tab"
                :class="{ active: taskDateFilter === 'today' }"
                @click="setTaskFilter('today')"
              >今天</button>
              <button
                class="tasklist-tab"
                :class="{ active: taskDateFilter === 'yesterday' }"
                @click="setTaskFilter('yesterday')"
              >昨天</button>
              <button
                class="tasklist-tab"
                :class="{ active: taskDateFilter === 'week' }"
                @click="setTaskFilter('week')"
              >本周</button>
            </div>

            <div class="task-summary">
              <div class="task-summary-item">
                <span class="task-count">待办</span>
                <span class="task-number">{{ pendingTasksCount }}</span>
              </div>
              <div class="task-summary-item">
                <span class="task-count">进行</span>
                <span class="task-number">{{ inProgressTasksCount }}</span>
              </div>
              <div class="task-summary-item">
                <span class="task-count">完成</span>
                <span class="task-number">{{ completedTasksCount }}</span>
              </div>
            </div>

            <div class="tasklist-body" v-if="filteredTasks.length">
              <div
                v-for="task in filteredTasks"
                :key="task.id"
                class="task-card"
                :class="[`status-${task.status}`, { 'task-completed': task.is_completed === 1 }]"
              >
                <div class="task-card-main">
                  <div class="task-checkbox" @click="toggleTaskCompletion(task)"
                      :class="{ 'checked': task.is_completed === 1 }">
                    <i v-if="task.is_completed === 1" class="fas fa-check"></i>
                  </div>
                  <div class="task-info-block">
                    <div class="task-card-title" :class="{ 'completed': task.is_completed === 1 }">
                      {{ task.title }}
                      <span v-if="task.category" class="task-category">{{ task.category }}</span>
                    </div>
                    <div class="task-card-meta">
                      <span v-if="task.estimated_hours">预计: {{ task.estimated_hours }}小时</span>
                      <span v-if="task.completed_time"> · 实际: {{ task.completion_time || task.estimated_hours }}小时</span>
                    </div>
                    <!-- 完成时间输入/显示 -->
                    <div v-if="task.is_completed !== 1" class="completion-time-input">
                      <label>完成耗时：</label>
                      <input type="number" 
                            min="1" 
                            max="480" 
                            placeholder="分钟" 
                            v-model="task.estimatedTime"
                            @change="saveCompletionTime(task.id, task.estimatedTime)">
                      <span class="time-unit">分钟</span>
                    </div>
                    <div v-else-if="task.completion_time" class="completion-time-display">
                      <i class="fas fa-clock"></i>
                      实际耗时: {{ task.completion_time }}分钟
                      <span v-if="task.completed_at" class="completion-date">
                        ({{ formatDate(task.completed_at) }})
                      </span>
                    </div>
                  </div>
                </div>
                <div class="task-actions">
                  <button v-if="task.is_completed !== 1" class="quick-complete-btn" @click="quickCompleteTask(task.id)">
                    <i class="fas fa-bolt"></i>
                    快速完成
                  </button>
                  <div v-if="task.is_completed === 1" class="status-badge completed">
                    <i class="fas fa-check-circle"></i> 已完成
                  </div>
                  <div v-else class="status-badge pending">
                    <i class="far fa-clock"></i> 待完成
                  </div>
                </div>
              </div>
            </div>
            <div class="tasklist-empty" v-else>
              <i class="fas fa-inbox"></i>
              <p>当前筛选下还没有任务~</p>
            </div>
          </div>

          <!-- 在线成员 -->
          <div class="content-section">
            <h2 class="section-title">
              <i class="fas fa-users"></i>
              在线成员 ({{ onlineMembers.length }})
            </h2>
            <div class="online-members" v-if="onlineMembers.length">
                <div v-for="member in onlineMembers" :key="member.id" class="member">
                  <div class="member-avatar">
                    {{ member.name.charAt(0) }}
                    <div class="online-indicator"></div>
                    <button
                      v-if="isOwner && member.user_id && member.user_id !== currentUserId"
                      class="member-admin-icon"
                      :class="{ active: member.role === 'admin' }"
                      :title="member.role === 'admin' ? '取消管理员' : '设为管理员'"
                      @click="toggleMemberAdmin(member)"
                    >
                      <i :class="member.role === 'admin' ? 'fas fa-user-shield' : 'fas fa-user-plus'"></i>
                    </button>
                  </div>
                  <div class="member-name">{{ member.name }}</div>
                </div>
            </div>
            <div v-else class="empty-placeholder">
              暂无成员在线
            </div>
            <button class="btn btn-secondary" style="width: 100%; margin-top: 15px;" @click="viewAllMembers">
              <i class="fas fa-search"></i>
              查看全部成员
            </button>
          </div>
        </div>

        <!-- 右侧边栏 -->
        <div class="sidebar">
          <!-- 自习室规则 -->
          <div class="content-section">
            <div class="rules-header">
              <h3 class="section-title">
                <i class="fas fa-list-ul"></i>
                自习室规则
              </h3>
              <button
                v-if="isAdmin"
                class="edit-rules-btn"
                @click="openRuleModal"
              >
                编辑规则
              </button>
            </div>
            <div class="rules-list" v-if="roomData.rules.length">
              <div class="rule-item" v-for="(rule, index) in roomData.rules" :key="index">
                <i class="fas fa-check-circle"></i>
                {{ rule }}
              </div>
            </div>
            <div v-else class="empty-placeholder">
              暂无规则说明
            </div>
          </div>

          <!-- 学习排行 -->
          <div class="content-section">
            <h3 class="section-title">
              <i class="fas fa-trophy"></i>
              学习排行
            </h3>
            <div class="leaderboard" v-if="filteredLeaderboard.length">
              <div v-for="(user, index) in filteredLeaderboard" :key="user.id" class="leaderboard-item">
                <div class="rank" :class="{
                  'rank-1': index === 0,
                  'rank-2': index === 1,
                  'rank-3': index === 2
                }">{{ index + 1 }}</div>
                <div class="user-info">
                  <div class="user-avatar">{{ user.name.charAt(0) }}</div>
                  <div class="user-details">
                    <div class="user-name">{{ user.name }}</div>
                    <div class="user-score">{{ user.totalStudyTime }}h</div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-placeholder">
              暂无学习数据
            </div>
          </div>

          <!-- 学习统计 -->
          <div class="content-section">
            <h3 class="section-title">
              <i class="fas fa-chart-bar"></i>
              我的学习统计
            </h3>
            <div class="learning-stats">
              <div class="stat-item">
                <div class="stat-icon today">
                  <i class="fas fa-sun"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ todayStudyTime || 0 }}h</div>
                  <div class="stat-label">今日学习</div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon week">
                  <i class="fas fa-calendar-week"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ weekStudyTime || 0 }}h</div>
                  <div class="stat-label">本周学习</div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon average">
                  <i class="fas fa-clock"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ taskStatistics.average_completion_minutes || 0 }}分</div>
                  <div class="stat-label">平均耗时</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 留言区 -->
      <div class="content-section comments-full-width">
        <button class="view-comments-btn" @click="viewAllComments" v-if="comments.length > commentLimit">
          <i class="fas fa-history"></i>
          查看留言记录
        </button>
        <h2 class="section-title">
          <i class="fas fa-comments"></i>
          留言区
        </h2>
        <div class="comments-section">
          <div class="comment-form">
            <textarea
              class="comment-input"
              v-model="newComment"
              placeholder="分享你的想法或学习心得..."
              @keyup.enter.ctrl="submitComment"
            ></textarea>
            <div class="comment-submit">
              <button class="submit-btn" @click="submitComment">发表留言</button>
            </div>
          </div>
          <div class="comments-list" v-if="displayedComments.length">
            <div v-for="comment in displayedComments" :key="comment.id" class="comment-item">
              <div class="comment-avatar">{{ comment.userName.charAt(0) }}</div>
              <div class="comment-content">
                <div class="comment-header">
                  <div class="comment-author">{{ comment.userName }}</div>
                  <div class="comment-time">{{ formatTime(comment.createdTime) }}</div>
                </div>
                <div class="comment-text">{{ comment.content }}</div>
              </div>
            </div>
          </div>
          <div v-else class="empty-placeholder">
            还没有留言，快来分享你的想法吧
          </div>
          <button class="expand-today-btn" v-if="comments.length > commentLimit" @click="expandComments">
            <i class="fas fa-chevron-down"></i>
            展开今日留言
          </button>
        </div>
      </div>
    </div>

    <!-- 查看任务记录模态框 -->
    <div class="modal" v-if="showTaskModal" @click.self="closeTaskHistory">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">查看任务总记录</h3>
          <button class="close-btn" @click="closeTaskHistory">&times;</button>
        </div>
        <div class="search-form">
          <div class="form-group">
            <label class="form-label">选择日期</label>
            <input class="form-input" type="date" v-model="searchDate">
          </div>
          <button class="submit-btn" @click="searchTasks">查看</button>
          <div class="search-results">
            <div v-if="!taskHistoryResults.length" class="empty-placeholder">暂时没有任务记录</div>
            <div v-for="task in taskHistoryResults" :key="task.id" class="search-result-item">
              <div class="result-task-title">{{ task.title }}</div>
              <div class="result-task-meta">
                {{ getTaskStatusText(task) }} · {{ task.estimated_hours || 1 }}小时
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑规则模态框 -->
    <div class="modal" v-if="showRuleModal" @click.self="closeRuleModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">编辑自习室规则</h3>
          <button class="close-btn" @click="closeRuleModal">&times;</button>
        </div>
        <div class="task-form">
          <div class="form-group">
            <label class="form-label">规则列表（每行一条）</label>
            <textarea
              class="form-input"
              rows="6"
              v-model="editRulesText"
              placeholder="例如：\n1. 保持安静，专心学习\n2. 互相尊重，友善交流"
            ></textarea>
          </div>
          <div class="form-actions">
            <button class="submit-btn" @click="saveRules">保存</button>
            <button class="cancel-btn" @click="closeRuleModal">取消</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建任务模态框 -->
    <div class="modal" v-if="showCreateTaskModal" @click.self="closeCreateTaskModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">创建学习任务</h3>
          <button class="close-btn" @click="closeCreateTaskModal">&times;</button>
        </div>
        <div class="task-form">
          <div class="form-group">
            <label class="form-label">任务标题</label>
            <input 
              class="form-input" 
              type="text" 
              v-model="newTask.title"
              placeholder="请输入任务标题"
              maxlength="100"
            >
          </div>
          <div class="form-group">
            <label class="form-label">任务分类</label>
            <select class="form-input" v-model="newTask.category">
              <option value="学习任务">学习任务</option>
              <option value="阅读">阅读</option>
              <option value="编程">编程</option>
              <option value="写作">写作</option>
              <option value="复习">复习</option>
              <option value="练习">练习</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">预计时长（小时）</label>
            <input 
              class="form-input" 
              type="number" 
              v-model.number="newTask.estimatedHours"
              min="0.5"
              max="12"
              step="0.5"
            >
          </div>
          <div class="form-group">
            <label class="form-label">任务描述（可选）</label>
            <textarea 
              class="form-input" 
              v-model="newTask.description"
              placeholder="请输入任务描述"
              rows="3"
              maxlength="500"
            ></textarea>
          </div>
          <div class="form-actions">
            <button class="submit-btn" @click="createTask" :disabled="!newTask.title.trim()">
              创建任务
            </button>
            <button class="cancel-btn" @click="closeCreateTaskModal">
              取消
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast 通知 -->
    <div v-if="showToast" :class="['toast', `toast-${toastType}`]">
      <i :class="getToastIcon(toastType)"></i>
      {{ toastMessage }}
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import {
  getRoomDetail,
  getRoomMembers,
  getRoomStats,
  getRoomTasks,
  getRoomLeaderboard,
  joinRoom as joinRoomApi,
  leaveRoom as leaveRoomApi,
  getRoomMessages,
  createRoomMessage,
  getUserStudyTasks,
  updateStudyTaskStatus,
  getStudyStats,
  getTaskHistory,
  createStudyTask,
  setRoomAdmin,
  updateRoomRules,
  uploadRoomAvatar,
  getRoomTaskStatistics,
  updateTaskCompletionStatus,
  quickCompleteTask
} from '@/api/rooms'
import { useUserStore } from '@/stores/user'

export default {
  name: 'StudyRoom',
  setup() {
    const userStore = useUserStore()
    return { userStore }
  },
  data() {
    return {
      isJoined: false,
      roomData: {
        name: '',
        description: '',
        tags: [],
        onlineCount: 0,
        totalMembers: 0,
        totalStudyHours: 0,
        completedTasks: 0,
        rules: [],
        scheduleTime: '',
        avatarUrl: '',
        creatorId: null,
        isAdmin: false
      },
      onlineMembers: [],
      todayTasks: [],
      filteredTasks: [],
      todayStudyTime: 0,
      weekStudyTime: 0,
      leaderboard: [],
      comments: [],
      commentLimit: 2,
      newComment: '',
      
      // 任务相关数据
      taskDateFilter: 'today',
      showTaskModal: false,
      searchDate: '',
      taskHistoryResults: [],
      showCreateTaskModal: false,
      newTask: {
        title: '',
        category: '学习任务',
        estimatedHours: 1,
        description: ''
      },
      showRuleModal: false,
      editRulesText: '',
      toastMessage: '',
      toastType: '',
      showToast: false,
      
      // 新增：任务统计和图表
      taskStatistics: {
        total_tasks: 0,
        completed_tasks: 0,
        pending_tasks: 0,
        completion_rate: 0,
        total_completion_hours: '0.0',
        average_completion_minutes: 0,
        pie_chart: null
      },
      taskPieChart: null
    }
  },
  async mounted() {
    await this.loadRoomData()
    this.$nextTick(() => {
      this.initTaskPieChart()
    })
  },
  computed: {
    currentUserId() {
      return this.userStore.userId || this.getStoredUserId()
    },
    currentUserName() {
      return this.userStore.userName || this.getStoredUserName()
    },
    isOwner() {
      return this.currentUserId && this.roomData.creatorId === this.currentUserId
    },
    isAdmin() {
      // 房主天然是管理员
      if (this.isOwner) return true
      return !!this.roomData.isAdmin
    },
    filteredLeaderboard() {
      return (this.leaderboard || []).filter(u => Number(u.totalStudyTime || 0) > 0)
    },
    displayedComments() {
      if (this.comments.length <= this.commentLimit) return this.comments
      return this.comments.slice(0, this.commentLimit)
    },
    pendingTasksCount() {
      return this.filteredTasks.filter(task => task.is_completed !== 1).length
    },
    completedTasksCount() {
      return this.filteredTasks.filter(task => task.is_completed === 1).length
    },
    inProgressTasksCount() {
      return this.filteredTasks.filter(task => 
        task.is_completed !== 1 && task.status === 'in_progress'
      ).length
    }
  },
  methods: {
    // 初始化任务饼状图
    initTaskPieChart() {
      if (!this.taskStatistics.pie_chart || 
          !this.taskStatistics.pie_chart.labels || 
          this.taskStatistics.pie_chart.labels.length === 0) {
        return
      }
      
      const chartDom = this.$refs.taskPieChart
      if (!chartDom) return
      
      // 销毁旧图表
      if (this.taskPieChart) {
        this.taskPieChart.dispose()
      }
      
      try {
        this.taskPieChart = echarts.init(chartDom)
        
        const chartData = this.taskStatistics.pie_chart
        const pieData = chartData.labels.map((label, index) => ({
          name: label,
          value: chartData.datasets[0].data[index] || 0,
          itemStyle: {
            color: chartData.datasets[0].backgroundColor[index] || this.getChartColor(index)
          }
        }))
        
        const option = {
          tooltip: {
            trigger: 'item',
            formatter: (params) => {
              const hours = (params.value / 60).toFixed(1)
              const percentage = params.percent
              return `${params.name}<br/>完成时间: ${params.value}分钟 (${hours}小时)<br/>占比: ${percentage}%`
            }
          },
          legend: {
            type: 'scroll',
            orient: 'horizontal',
            bottom: 10,
            left: 'center',
            textStyle: {
              fontSize: 10
            },
            itemWidth: 12,
            itemHeight: 12,
            pageTextStyle: {
              fontSize: 10
            },
            pageIconSize: 10
          },
          series: [
            {
              name: '任务完成时间分布',
              type: 'pie',
              radius: ['40%', '65%'],
              center: ['50%', '45%'],
              avoidLabelOverlap: false,
              itemStyle: {
                borderRadius: 8,
                borderColor: '#fff',
                borderWidth: 1
              },
              label: {
                show: false,
                position: 'center'
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: '14',
                  fontWeight: 'bold',
                  formatter: `{b}\n{c}分钟\n({d}%)`
                }
              },
              labelLine: {
                show: false
              },
              data: pieData
            }
          ]
        }
        
        this.taskPieChart.setOption(option)
        
        // 响应式调整
        window.addEventListener('resize', () => {
          if (this.taskPieChart) {
            this.taskPieChart.resize()
          }
        })
      } catch (error) {
        console.error('初始化任务饼状图失败:', error)
      }
    },
    
    getChartColor(index) {
      const colors = [
        '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', 
        '#118AB2', '#073B4C', '#EF476F', '#7209B7'
      ]
      return colors[index % colors.length]
    },
    
    // 加载任务统计
    async loadTaskStatistics() {
      try {
        const roomId = this.$route.params.roomId
        const response = await getRoomTaskStatistics(roomId, this.currentUserId)
        
        if (response && response.success && response.data) {
          this.taskStatistics = response.data
          
          // 等待DOM更新后初始化图表
          this.$nextTick(() => {
            this.initTaskPieChart()
          })
        }
      } catch (error) {
        console.error('加载任务统计失败:', error)
      }
    },

    parseTags(rawTags) {
      if (!rawTags) return []
      if (Array.isArray(rawTags)) return rawTags
      if (typeof rawTags === 'string') {
        try {
          const parsed = JSON.parse(rawTags)
          if (Array.isArray(parsed)) return parsed
          return rawTags.split(/[，,]/).map(tag => tag.trim()).filter(Boolean)
        } catch (error) {
          return rawTags.split(/[，,]/).map(tag => tag.trim()).filter(Boolean)
        }
      }
      return []
    },

    async loadRoomData() {
      try {
        const roomId = this.$route.params.roomId
        const userId = this.currentUserId
        
        // 加载自习室基本信息
        const roomResponse = await getRoomDetail(roomId, userId)
        if (roomResponse.success) {
          const data = roomResponse.data
          this.roomData = {
            name: data.room_name,
            description: data.description,
            tags: this.parseTags(data.tags),
            onlineCount: data.online_count || 0,
            maxMembers: data.max_participants,
            creatorName: data.creator_name,
            totalMembers: data.current_members || data.max_participants || 0,
            totalStudyHours: data.total_study_hours || 0,
            completedTasks: data.completed_tasks || 0,
            rules: this.parseRules(data.rules),
            scheduleTime: data.schedule_time || '',
            avatarUrl: data.avatar_url || '',
            creatorId: data.creator_id || null,
            isAdmin: data.is_admin || false
          }
          this.checkUserJoinStatus()
          this.onlineMembers = (data.members || []).map(member => ({
            id: member.member_id,
            name: member.user_name,
            avatar: member.avatar_url,
            isOnline: !member.leave_time,
            totalStudyTime: Number(((member.total_study_time || 0) / 60).toFixed(1)),
            user_id: member.user_id,
            role: member.role || (member.is_admin ? 'admin' : 'member')
          }))
        }

        // 加载在线成员
        const membersResponse = await getRoomMembers(roomId)
        if (membersResponse.success) {
          this.onlineMembers = membersResponse.data.map(member => ({
            id: member.member_id,
            name: member.user_name,
            avatar: member.avatar_url,
            isOnline: !member.leave_time,
            totalStudyTime: Number(((member.total_study_time || 0) / 60).toFixed(1)),
            user_id: member.user_id,
            role: member.role || (member.is_admin ? 'admin' : 'member')
          }))
          this.checkUserJoinStatus()
        }

        // 加载任务统计
        await this.loadTaskStatistics()

        // 加载今日任务
        if (userId) {
          await this.loadTodayTasks()
        } else {
          console.warn('当前用户ID缺失，跳过个人任务加载')
        }

        // 加载学习时长统计
        if (userId) {
          const statsResponse = await getStudyStats(roomId, userId)
          if (statsResponse.success) {
            this.todayStudyTime = statsResponse.data.todayStudyTime || 0
            this.weekStudyTime = statsResponse.data.weekStudyTime || 0
            this.roomData.completedTasks = statsResponse.data.completedTasks || 0
            this.roomData.totalStudyHours = statsResponse.data.totalStudyTime || 0
          }
        }

        // 加载学习排行榜
        const leaderboardResponse = await getRoomLeaderboard(roomId)
        if (leaderboardResponse.success) {
          this.leaderboard = leaderboardResponse.data.map(item => ({
            id: item.userId,
            name: item.name,
            totalStudyTime: item.totalStudyHours
          }))
        }

        // 加载留言
        const messagesResponse = await getRoomMessages(roomId)
        if (messagesResponse.success) {
          this.comments = messagesResponse.data.map(message => ({
            id: message.message_id,
            userId: message.user_id,
            userName: message.user_name || '匿名同学',
            content: message.content,
            createdTime: message.create_time
          }))
        }
        
      } catch (error) {
        console.error('加载自习室数据失败:', error)
        this.notify('error', '加载数据失败，请稍后重试')
      }
    },

    checkUserJoinStatus() {
      this.isJoined = this.onlineMembers.some(member => 
        member.id === this.currentUserId || member.user_id === this.currentUserId
      )
    },

    async loadTodayTasks() {
      try {
        const roomId = this.$route.params.roomId
        const userId = this.currentUserId
        if (!userId) return

        const tasksResponse = await getUserStudyTasks(roomId, userId, 'today')
        if (tasksResponse.success) {
          this.todayTasks = tasksResponse.data.map(task => ({
            id: task.task_id,
            title: task.title,
            status: task.status || 'pending',
            category: task.category || '学习任务',
            estimated_hours: task.estimated_hours || 1,
            is_completed: task.completed_time ? 1 : 0,
            completion_time: task.completed_time,
            completed_at: task.completed_time,
            estimatedTime: null
          }))
          this.filteredTasks = [...this.todayTasks]
        }
      } catch (error) {
        console.error('加载今日任务失败:', error)
      }
    },
    
    // 切换任务完成状态
    async toggleTaskCompletion(task) {
      // 只能操作自己的任务
      if (!this.isJoined) {
        this.notify('error', '请先加入自习室')
        return
      }
      
      const newStatus = task.is_completed === 1 ? 0 : 1
      
      // 如果是标记为已完成且没有完成时间
      if (newStatus === 1 && !task.completion_time) {
        // 提示输入完成时间
        const completionTime = prompt('请输入任务完成时间（分钟）:', '30')
        if (!completionTime || isNaN(completionTime) || completionTime <= 0) {
          this.notify('error', '请输入有效的完成时间')
          return
        }
        await this.updateTaskStatus(task.id, newStatus, parseInt(completionTime))
      } else {
        await this.updateTaskStatus(task.id, newStatus, task.completion_time)
      }
    },
    
    // 更新任务状态
    async updateTaskStatus(taskId, isCompleted, completionTime) {
      try {
        const response = await updateTaskCompletionStatus(taskId, {
          user_id: this.currentUserId,
          is_completed: isCompleted,
          completion_time: completionTime
        })
        
        if (response && response.success) {
          // 更新本地任务状态
          const taskToUpdate = this.filteredTasks.find(t => t.id === taskId)
          if (taskToUpdate) {
            taskToUpdate.is_completed = isCompleted
            if (isCompleted === 1 && completionTime) {
              taskToUpdate.completion_time = completionTime
              taskToUpdate.completed_at = new Date().toISOString()
            } else if (isCompleted === 0) {
              taskToUpdate.completion_time = null
              taskToUpdate.completed_at = null
            }
          }
          
          this.notify('success', isCompleted ? '任务已完成' : '任务已标记为未完成')
          
          // 重新加载统计
          await this.loadTaskStatistics()
        } else {
          this.notify('error', response?.message || '操作失败')
        }
      } catch (error) {
        console.error('更新任务状态失败:', error)
        this.notify('error', error?.response?.data?.message || '操作失败')
      }
    },

    // 快速完成任务
    async quickCompleteTask(taskId) {
      try {
        const response = await quickCompleteTask(taskId, {
          user_id: this.currentUserId
        })
        
        if (response && response.success) {
          const task = this.filteredTasks.find(t => t.id === taskId)
          if (task) {
            task.is_completed = 1
            task.completion_time = 30
            task.completed_at = new Date().toISOString()
          }
          this.notify('success', '任务已完成（默认30分钟）')
          await this.loadTaskStatistics()
        }
      } catch (error) {
        console.error('快速完成任务失败:', error)
        this.notify('error', error?.response?.data?.message || '操作失败')
      }
    },

    // 保存完成时间
    async saveCompletionTime(taskId, completionMinutes) {
      if (!completionMinutes || completionMinutes <= 0) {
        this.notify('error', '请输入有效的完成时间（大于0分钟）')
        return
      }
      
      try {
        const response = await updateTaskCompletionStatus(taskId, {
          user_id: this.currentUserId,
          is_completed: 1,
          completion_time: parseInt(completionMinutes)
        })
        
        if (response && response.success) {
          const task = this.filteredTasks.find(t => t.id === taskId)
          if (task) {
            task.is_completed = 1
            task.completion_time = parseInt(completionMinutes)
            task.completed_at = new Date().toISOString()
          }
          this.notify('success', '任务已完成')
          await this.loadTaskStatistics()
        }
      } catch (error) {
        console.error('保存完成时间失败:', error)
        this.notify('error', error?.response?.data?.message || '操作失败')
      }
    },

    async setTaskFilter(filter) {
      this.taskDateFilter = filter
      try {
        const roomId = this.$route.params.roomId
        const userId = this.currentUserId
        if (!userId) return
        
        const tasksResponse = await getUserStudyTasks(roomId, userId, filter)
        if (tasksResponse.success) {
          this.filteredTasks = tasksResponse.data.map(task => ({
            id: task.task_id,
            title: task.title,
            status: task.status || 'pending',
            category: task.category || '学习任务',
            estimated_hours: task.estimated_hours || 1,
            is_completed: task.completed_time ? 1 : 0,
            completion_time: task.completed_time,
            completed_at: task.completed_time,
            estimatedTime: null
          }))
        }
      } catch (error) {
        console.error('加载任务失败:', error)
        this.filteredTasks = [...this.todayTasks]
      }
    },

    viewAllMembers() {
      this.notify('info', '正在加载全部成员信息，请稍候...')
    },

    async toggleMemberAdmin(member) {
      try {
        const roomId = this.$route.params.roomId
        const isAdmin = member.role === 'admin'
        const response = await setRoomAdmin(roomId, {
          operator_id: this.currentUserId,
          target_user_id: member.user_id,
          is_admin: !isAdmin
        })

        if (response && response.success) {
          member.role = !isAdmin ? 'admin' : 'member'
          this.notify('success', !isAdmin ? '已设为管理员' : '已取消管理员')
        } else {
          this.notify('error', response?.message || '操作失败')
        }
      } catch (error) {
        console.error('设置管理员失败:', error)
        this.notify('error', error?.response?.data?.message || '操作失败，请稍后重试')
      }
    },

    openRuleModal() {
      this.editRulesText = (this.roomData.rules || []).join('\n')
      this.showRuleModal = true
    },

    closeRuleModal() {
      this.showRuleModal = false
    },

    async saveRules() {
      if (!this.isAdmin) {
        this.notify('error', '只有管理员可以编辑规则')
        return
      }

      const roomId = this.$route.params.roomId
      const rawText = (this.editRulesText || '').trim()
      const rulesArray = rawText
        .split(/\r?\n/)
        .map(line => line.replace(/^\d+[\.、]\s*/, '').trim())
        .filter(Boolean)

      try {
        const response = await updateRoomRules(roomId, {
          user_id: this.currentUserId,
          rules: rulesArray
        })

        if (response && response.success) {
          this.notify('success', '规则更新成功')
          this.showRuleModal = false
          await this.loadRoomData()
        } else {
          this.notify('error', response?.message || '规则更新失败')
        }
      } catch (error) {
        console.error('更新自习室规则失败:', error)
        this.notify('error', error?.response?.data?.message || '规则更新失败，请稍后重试')
      }
    },

    async submitComment() {
      const content = this.newComment.trim()
      if (!content) return
      if (!this.isJoined) {
        this.notify('error', '请先加入自习室再留言')
        return
      }
      try {
        const roomId = this.$route.params.roomId
        const response = await createRoomMessage(roomId, {
          user_id: this.currentUserId,
          content
        })
        if (response && response.success) {
          const saved = response.data || {}
          this.comments.unshift({
            id: saved.message_id || Date.now(),
            userId: this.currentUserId,
            userName: saved.user_name || this.currentUserName || '我',
            content,
            createdTime: saved.create_time || new Date().toISOString()
          })
          this.newComment = ''
          this.notify('success', '留言已发送')
        } else {
          this.notify('error', response?.message || '发送失败，请稍后重试')
        }
      } catch (error) {
        console.error('发送留言失败:', error)
        this.notify('error', error?.response?.data?.message || '发送失败，请稍后重试')
      }
    },

    viewAllComments() {
      this.commentLimit = this.comments.length
    },

    expandComments() {
      this.commentLimit = Math.min(this.commentLimit + 5, this.comments.length)
    },

    async openTaskHistory() {
      this.showTaskModal = true
      try {
        const roomId = this.$route.params.roomId
        const response = await getTaskHistory(roomId, this.currentUserId)
        if (response.success) {
          this.taskHistoryResults = response.data.map(task => ({
            id: task.task_id,
            title: task.title,
            status: task.status || 'pending',
            category: task.category || '学习任务',
            estimated_hours: task.estimated_hours || 1,
            createdTime: task.formatted_create_time,
            completedTime: task.formatted_completed_time
          }))
        }
      } catch (error) {
        console.error('加载任务历史失败:', error)
        this.taskHistoryResults = [...this.todayTasks]
      }
    },

    closeTaskHistory() {
      this.showTaskModal = false
      this.searchDate = ''
    },

    async searchTasks() {
      if (!this.searchDate) {
        await this.openTaskHistory()
        return
      }
      
      try {
        const roomId = this.$route.params.roomId
        const response = await getTaskHistory(roomId, this.currentUserId)
        if (response.success) {
          this.taskHistoryResults = response.data
            .filter(task => task.formatted_create_time?.startsWith(this.searchDate))
            .map(task => ({
              id: task.task_id,
              title: task.title,
              status: task.status || 'pending',
              category: task.category || '学习任务',
              estimated_hours: task.estimated_hours || 1,
              createdTime: task.formatted_create_time,
              completedTime: task.formpleted_completed_time
            }))
        }
      } catch (error) {
        console.error('搜索任务失败:', error)
        this.notify('error', '搜索任务失败')
      }
    },

    getTaskStatusText(task) {
      const statusMap = {
        completed: '已完成',
        in_progress: '进行中',
        pending: '待开始'
      }
      return statusMap[task.status] || '待开始'
    },

    openCreateTaskModal() {
      this.showCreateTaskModal = true
    },

    closeCreateTaskModal() {
      this.showCreateTaskModal = false
      this.newTask = {
        title: '',
        category: '学习任务',
        estimatedHours: 1,
        description: ''
      }
    },

    async createTask() {
      if (!this.newTask.title.trim()) {
        this.notify('error', '请输入任务标题')
        return
      }

      try {
        const roomId = this.$route.params.roomId
        const response = await createStudyTask(roomId, {
          user_id: this.currentUserId,
          title: this.newTask.title.trim(),
          category: this.newTask.category,
          estimated_hours: this.newTask.estimatedHours,
          description: this.newTask.description.trim()
        })

        if (response.success) {
          this.notify('success', '任务创建成功')
          this.closeCreateTaskModal()
          await this.loadTodayTasks()
          await this.loadTaskStatistics()
        } else {
          this.notify('error', response.message || '创建任务失败')
        }
      } catch (error) {
        console.error('创建任务失败:', error)
        this.notify('error', '创建任务失败，请稍后重试')
      }
    },

    async joinRoom() {
      try {
        const roomId = this.$route.params.roomId
        const action = this.isJoined ? leaveRoomApi : joinRoomApi
        const userId = this.currentUserId

        if (!userId) {
          this.notify('error', '请先登录后再操作自习室')
          return
        }

        const response = await action(roomId, userId)
        
        if (response && response.success) {
          this.isJoined = !this.isJoined
          this.notify('success', this.isJoined ? '成功加入自习室' : '已离开自习室')
          await this.loadRoomData()
        } else {
          const errorMsg = response?.message || '操作失败'
          this.notify('error', errorMsg)
          console.error('自习室操作失败:', response)
        }
      } catch (error) {
        console.error('加入/离开自习室失败:', error)
        this.notify('error', error?.response?.data?.message || '操作失败，请稍后重试')
      }
    },

    formatDate(dateString) {
      if (!dateString) return '';
      
      try {
        const date = new Date(dateString);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        
        if (isToday) {
          return date.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
        }
        
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
          return '昨天 ' + date.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
        }
        
        const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        if (daysDiff < 7) {
          const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
          return weekDays[date.getDay()];
        }
        
        return date.toLocaleDateString('zh-CN', { 
          month: '2-digit', 
          day: '2-digit' 
        });
        
      } catch (error) {
        console.error('格式化日期错误:', error, dateString);
        return '';
      }
    },

    formatTime(timestamp) {
      if (!timestamp) return ''
      const now = new Date()
      const time = new Date(timestamp)
      const diff = now - time
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)
      if (minutes < 60) return `${minutes}分钟前`
      if (hours < 24) return `${hours}小时前`
      if (days === 1) return '昨天'
      return time.toLocaleDateString()
    },

    async onAvatarChange(event) {
      const files = event.target.files
      if (!files || !files.length) return
      const file = files[0]
      const roomId = this.$route.params.roomId

      try {
        const response = await uploadRoomAvatar(roomId, file, this.currentUserId)
        if (response && response.success) {
          this.notify('success', '自习室头像更新成功')
          await this.loadRoomData()
        } else {
          this.notify('error', response?.message || '头像更新失败')
        }
      } catch (error) {
        console.error('更新自习室头像失败:', error)
        this.notify('error', error?.response?.data?.message || '头像更新失败，请稍后重试')
      } finally {
        event.target.value = ''
      }
    },

    getStoredUserInfo() {
      try {
        const userInfoStr = localStorage.getItem('userInfo')
        if (userInfoStr) {
          const info = JSON.parse(userInfoStr)
          return {
            userId: info.user_id || info.userId || info.id || null,
            userName: info.user_name || info.userName || info.name || null
          }
        }
      } catch (error) {
        console.warn('解析本地用户信息失败:', error)
      }

      const token = localStorage.getItem('token')
      if (token) {
        try {
          const base64Url = token.split('.')[1]
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
          const payload = JSON.parse(window.atob(base64))
          return {
            userId: payload.userId || payload.id || null,
            userName: payload.userName || payload.username || null
          }
        } catch (error) {
          console.warn('解析token失败:', error)
        }
      }

      return { userId: null, userName: null }
    },

    getStoredUserId() {
      const info = this.getStoredUserInfo()
      return info.userId
    },

    getStoredUserName() {
      const info = this.getStoredUserInfo()
      return info.userName
    },

    notify(type, message) {
      this.toastType = type
      this.toastMessage = message
      this.showToast = true

      setTimeout(() => {
        this.showToast = false
      }, 3000)
      
      if (type === 'success') {
        console.log('✅', message)
      } else if (type === 'error') {
        console.error('❌', message)
      } else {
        console.log('ℹ️', message)
      }
    },

    parseRules(rawRules) {
      if (!rawRules) return []
      if (Array.isArray(rawRules)) return rawRules
      if (typeof rawRules === 'string') {
        try {
          const parsed = JSON.parse(rawRules)
          if (Array.isArray(parsed)) {
            return parsed.filter(Boolean)
          }
        } catch (error) {
          // ignore json parse error
        }
        return rawRules
          .split(/[\n\r]+/)
          .map(item => item.replace(/^\d+[\.、]\s*/, '').trim())
          .filter(Boolean)
      }
      return []
    },

    getToastIcon(type) {
      const iconMap = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle'
      }
      return iconMap[type] || 'fas fa-info-circle'
    },

    // 组件销毁时清理图表
    beforeDestroy() {
      if (this.taskPieChart) {
        this.taskPieChart.dispose()
      }
    }
  }
}
</script>

<style scoped>
:root {
  --primary: #1a73e8;
  --primary-light: #e8f0fe;
  --secondary: #34a853;
  --warning: #f9ab00;
  --danger: #ea4335;
  --dark: #202124;
  --light: #f8f9fa;
  --gray: #5f6368;
  --border: #dadce0;
  --my-task-bg: #e8f0fe;
  --partner-task-bg: #e6f4ea;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
}

body {
  background-color: var(--light);
  color: var(--dark);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 自习室头部 */
.room-header {
  background: linear-gradient(135deg, var(--primary), #6c8ef5);
  color: white;
  padding: 30px 0;
  margin-bottom: 30px;
}

.room-info {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 40px;
  align-items: center;
}

.room-avatar {
  width: 100px;
  height: 100px;
  border-radius: 20px;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  position: relative;
  overflow: hidden;
}

.room-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 20px;
}

.avatar-upload-btn {
  position: absolute;
  right: 6px;
  bottom: 6px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(0,0,0,0.4);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.8rem;
}

.room-details h1 {
  font-size: 1.8rem;
  margin-bottom: 8px;
}

.room-description {
  font-size: 1rem;
  opacity: 0.9;
  margin-bottom: 15px;
  line-height: 1.5;
}

.room-tags {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.room-tag {
  background: rgba(255,255,255,0.2);
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 0.85rem;
}

.room-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.room-stat {
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 8px 0;
}

.stat-label {
  font-size: 0.85rem;
  opacity: 0.8;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: white;
  color: var(--primary);
}

.btn-primary:hover {
  background: var(--primary-light);
}

.btn-secondary {
  background: var(--light);
  color: var(--dark);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: var(--primary-light);
}

/* 主要内容 */
.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
}

.content-section {
  background: white;
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 25px;
  box-shadow: 0 3px 15px rgba(0,0,0,0.08);
}

.section-title {
  font-size: 1.3rem;
  margin-bottom: 20px;
  color: var(--dark);
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 任务统计摘要 */
.task-summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 25px;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  border: 1px solid var(--border);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.summary-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.summary-icon.completed {
  background: #e8f5e8;
  color: #34a853;
}

.summary-icon.pending {
  background: #fff3e0;
  color: #ff9800;
}

.summary-icon.total {
  background: #e3f2fd;
  color: #1a73e8;
}

.summary-icon.rate {
  background: #f3e5f5;
  color: #9c27b0;
}

.summary-icon.time {
  background: #fff3e0;
  color: #ff9800;
}

.summary-content {
  flex: 1;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--dark);
  margin-bottom: 5px;
}

.summary-label {
  font-size: 0.85rem;
  color: var(--gray);
}

/* 图表容器 */
.chart-container {
  position: relative;
  width: 100%;
}

.no-data-chart {
  height: 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 15px;
}

.no-data-chart i {
  font-size: 3rem;
  margin-bottom: 10px;
  opacity: 0.3;
}

.no-data-chart p {
  margin: 0;
  font-size: 0.9rem;
}

/* 任务进度条 */
.task-progress-section {
  margin-top: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.progress-title {
  font-size: 1rem;
  font-weight: 600;
  color: #343a40;
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-title::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary);
}

.progress-percentage {
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 6px 15px;
  border-radius: 20px;
  min-width: 60px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-bar-container {
  height: 12px;
  background: #edf2f7;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 15px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.progress-bar {
  height: 100%;
  border-radius: 6px;
  transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.4) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: shimmer 1.5s infinite linear;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  font-size: 0.85rem;
  color: #6c757d;
}

.progress-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 8px;
  background: rgba(248, 249, 250, 0.7);
  border-radius: 6px;
  transition: all 0.3s ease;
}

.progress-stat:hover {
  background: rgba(233, 236, 239, 0.9);
  transform: translateY(-1px);
}

.progress-stat i {
  font-size: 1rem;
  margin-bottom: 3px;
}

/* 任务清单样式 */
.tasklist-section {
  padding: 24px 28px;
  border-radius: 16px;
  background: #fff;
}

.tasklist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.tasklist-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
}

.tasklist-title i {
  color: #2563eb;
}

.tasklist-actions {
  display: flex;
  gap: 10px;
}

.tasklist-search,
.tasklist-add {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 999px;
  padding: 8px 16px;
  background: #f8fafc;
  color: #1e40af;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.tasklist-search {
  background: #eef2ff;
  border-color: rgba(37,99,235,0.35);
}

.tasklist-search:hover {
  background: #dbeafe;
}

.tasklist-add {
  background: #ecfdf5;
  border-color: rgba(22,163,74,0.25);
  color: #15803d;
}

.tasklist-add:hover {
  background: #d1fae5;
}

.tasklist-tabs {
  margin: 20px 0;
  display: flex;
  gap: 12px;
}

.tasklist-tab {
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  background: #f1f5f9;
  color: #475569;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tasklist-tab.active {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  box-shadow: 0 6px 16px rgba(37,99,235,0.25);
}

.task-summary {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  background: #f8fafc;
  padding: 14px 18px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.05);
}

.task-summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.task-count {
  font-size: 0.8rem;
  color: #64748b;
}

.task-number {
  font-weight: 700;
  font-size: 1.15rem;
  color: #2563eb;
}

.tasklist-body {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.task-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 18px;
  border-radius: 14px;
  background: #eef2ff;
  border-left: 6px solid #2563eb;
  transition: all 0.2s ease;
}

.task-card.status-completed {
  background: #f1f5f9;
  border-color: #22c55e;
}

.task-card.status-pending {
  background: #fef2f2;
  border-color: #f97316;
}

.task-card-main {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
}

.task-checkbox {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
  background: white;
}

.task-checkbox:hover {
  border-color: var(--primary);
  background: var(--primary-light);
}

.task-checkbox i {
  font-size: 12px;
  color: white;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.task-checkbox.checked {
  background: var(--primary);
  border-color: var(--primary);
}

.task-checkbox.checked i {
  opacity: 1;
}

.task-info-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.task-card-title {
  font-weight: 600;
  font-size: 1rem;
  color: #0f172a;
}

.task-card-title.completed {
  text-decoration: line-through;
  color: #64748b;
}

.task-category {
  font-size: 0.75rem;
  padding: 2px 6px;
  background: rgba(37,99,235,0.1);
  color: #2563eb;
  border-radius: 4px;
  margin-left: 8px;
}

.task-card-meta {
  font-size: 0.85rem;
  color: #64748b;
}

/* 完成时间输入/显示 */
.completion-time-input {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 5px;
  font-size: 0.85rem;
}

.completion-time-input label {
  color: #666;
}

.completion-time-input input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.85rem;
  text-align: center;
}

.time-unit {
  font-size: 0.85rem;
  color: #666;
}

.completion-time-display {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 5px;
  padding: 6px 10px;
  background: #e8f5e8;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #2e7d32;
}

.completion-time-display i {
  font-size: 0.8rem;
}

.completion-date {
  font-size: 0.8rem;
  color: #666;
  margin-left: 4px;
}

.task-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.quick-complete-btn {
  padding: 6px 12px;
  background: linear-gradient(135deg, #ff9800, #ff5722);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.quick-complete-btn:hover {
  background: linear-gradient(135deg, #f57c00, #e64a19);
  transform: translateY(-1px);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  padding: 4px 8px;
  border-radius: 4px;
}

.status-badge.completed {
  background: #e8f5e8;
  color: #2e7d32;
}

.status-badge.pending {
  background: #fff3e0;
  color: #ff9800;
}

.tasklist-empty {
  margin-top: 20px;
  text-align: center;
  color: #94a3b8;
  padding: 40px 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px dashed rgba(148,163,184,0.4);
}

.tasklist-empty i {
  font-size: 2rem;
  margin-bottom: 10px;
}

/* 在线成员 */
.online-members {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  overflow-x: auto;
  padding-bottom: 10px;
}

.member {
  text-align: center;
  flex-shrink: 0;
}

.member-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin: 0 auto 8px;
  position: relative;
}

.member-admin-icon {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: white;
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  border: 1px solid var(--border);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}

.member-admin-icon:hover {
  background: var(--primary-light);
  color: var(--primary);
}

.member-admin-icon.active {
  background: var(--secondary);
  color: white;
  border-color: var(--secondary);
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: var(--secondary);
  border: 2px solid white;
  border-radius: 50%;
}

.member-name {
  font-size: 0.8rem;
  color: var(--gray);
}

/* 侧边栏 */
.rules-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 15px;
}

.edit-rules-btn {
  padding: 6px 12px;
  font-size: 0.8rem;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--light);
  cursor: pointer;
}

.edit-rules-btn:hover {
  background: var(--primary-light);
  color: var(--primary);
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--light);
  border-radius: 8px;
  font-size: 0.9rem;
}

.rule-item i {
  color: var(--secondary);
}

/* 学习排行 */
.leaderboard {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  background: var(--light);
  border-radius: 10px;
}

.rank {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #94a3b8;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
}

.rank-1 {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
}

.rank-2 {
  background: linear-gradient(135deg, #9ca3af, #6b7280);
}

.rank-3 {
  background: linear-gradient(135deg, #f97316, #ea580c);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--secondary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.user-details {
  flex: 1;
}

.user-name {
  font-weight: 500;
  margin-bottom: 2px;
}

.user-score {
  font-size: 0.8rem;
  color: var(--gray);
}

/* 学习统计 */
.learning-stats {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: var(--light);
  border-radius: 12px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.stat-icon.today {
  background: #e8f0fe;
  color: #1a73e8;
}

.stat-icon.week {
  background: #e6f4ea;
  color: #34a853;
}

.stat-icon.average {
  background: #fff3e0;
  color: #ff9800;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--dark);
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--gray);
}

/* 留言区 */
.comments-full-width {
  margin-top: 20px;
  position: relative;
}

.view-comments-btn {
  position: absolute;
  top: 25px;
  right: 25px;
  padding: 6px 12px;
  background: var(--primary-light);
  color: var(--primary);
  border: 1px solid var(--primary);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.view-comments-btn:hover {
  background: var(--primary);
  color: white;
}

.comments-section {
  margin-top: 20px;
}

.comment-form {
  background: var(--light);
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.comment-input {
  flex: 1;
  min-height: 60px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  resize: vertical;
}

.comment-input:focus {
  outline: none;
  border-color: var(--primary);
}

.comment-submit {
  display: flex;
  align-items: flex-end;
}

.submit-btn {
  padding: 8px 20px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  display: flex;
  gap: 15px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border);
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: 600;
}

.comment-time {
  font-size: 0.8rem;
  color: var(--gray);
}

.comment-text {
  line-height: 1.5;
  color: var(--dark);
}

.expand-today-btn {
  width: 100%;
  padding: 10px;
  background: var(--light);
  color: var(--primary);
  border: 1px solid var(--primary);
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* 模态框 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal-content {
  background: white;
  padding: 25px;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border);
}

.modal-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--dark);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--gray);
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: var(--light);
  color: var(--dark);
}

.search-form, .task-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-weight: 500;
  color: var(--dark);
  font-size: 0.9rem;
}

.form-input {
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.9rem;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 25px;
}

.cancel-btn {
  padding: 10px 20px;
  background: var(--light);
  color: var(--gray);
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: var(--border);
}

.submit-btn {
  padding: 10px 20px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.submit-btn:disabled {
  background: var(--border);
  color: var(--gray);
  cursor: not-allowed;
}

.search-results {
  max-height: 300px;
  overflow-y: auto;
  margin-top: 15px;
}

.search-result-item {
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}

.result-task-title {
  font-weight: 500;
}

.result-task-meta {
  font-size: 0.85rem;
  color: var(--gray);
}

.empty-placeholder {
  text-align: center;
  color: var(--gray);
  padding: 20px;
  font-style: italic;
}

/* Toast 通知样式 */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 200px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  animation: slideIn 0.3s ease-out;
}

.toast-success {
  background: var(--secondary);
}

.toast-error {
  background: var(--danger);
}

.toast-info {
  background: var(--primary);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .room-info {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 20px;
  }
  
  .room-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .task-summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .learning-stats {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .stat-item {
    flex: 1;
    min-width: 120px;
  }
  
  .tasklist-header {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .tasklist-actions {
    justify-content: flex-end;
  }
  
  .view-comments-btn {
    position: static;
    margin-bottom: 10px;
    align-self: flex-end;
  }
}
</style>