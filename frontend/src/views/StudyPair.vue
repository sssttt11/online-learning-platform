<template>
  <div class="study-pair">

    <!-- 组队头部 -->
    <section class="team-header">
      <div class="container">
        <div class="team-info">
          <div class="team-avatar" @click="uploadTeamAvatar">
            <img v-if="teamAvatar" :src="teamAvatar" alt="小组头像" />
            <div v-else class="default-avatar">
              <div class="avatar-member" v-for="(member, index) in pairMembers.slice(0, 2)" :key="member.id" :class="`member-${index + 1}`">
                {{ member.name.charAt(0) }}
              </div>
            </div>
            <div class="upload-overlay">
              <i class="fas fa-camera"></i>
              <span>上传头像</span>
            </div>
          </div>
          <input type="file" ref="avatarInput" @change="handleAvatarUpload" accept="image/*" style="display: none;" />
          <div class="team-details">
            <h1>{{ teamData.name || '加载中...' }}</h1>
            <p class="team-description">{{ teamData.description || '正在加载团队信息...' }}</p>
            <div class="team-tags">
              <span v-for="tag in teamData.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
            <div class="team-stats">
              <div class="team-stat">
                <div class="stat-value">{{ teamData.studyDays || 0 }}</div>
                <div class="stat-label">共同学习天数</div>
              </div>
              <div class="team-stat">
                <div class="stat-value">{{ teamData.completionRate || 0 }}%</div>
                <div class="stat-label">任务完成率</div>
              </div>
              <div class="team-stat">
                <div class="stat-value">{{ teamData.completedTasks || 0 }}</div>
                <div class="stat-label">任务完成量</div>
              </div>
              <div class="team-stat">
                <div class="stat-value">{{ teamData.onlineMembers || 0 }}/{{ teamData.totalMembers || 0 }}</div>
                <div class="stat-label">成员在线</div>
              </div>
            </div>
            <p class="pair-warning" v-if="extraMemberCount > 0">
              当前小组成员超过 2 人，已自动展示您与一位伙伴，其余成员暂不参与配对视图。
            </p>
          </div>
          <div class="team-actions" v-if="isJoined">
            <button class="btn btn-danger" @click="leaveTeam">
              <i class="fas fa-user-minus"></i>
              退出小组
            </button>
            <button class="btn btn-secondary" @click="shareTeam">
              <i class="fas fa-share"></i>
              分享
            </button>
          </div>
        </div>
      </div>
    </section>

    <div class="container">
      <!-- 修改后的主要内容布局 -->
      <div class="main-content">
        <!-- 左侧主要内容 -->
        <div class="left-column">
          <!-- 学习进度对比 -->
          <div class="content-section">
            <h2 class="section-title">
              <i class="fas fa-chart-pie"></i>
              学习进度对比
            </h2>
            <div class="progress-comparison">
              <div v-for="member in pairMembers" :key="member.id" class="member-card">
                <!-- 修改后的头像容器，添加居中和对齐样式 -->
                <div class="member-avatar-wrapper">
                  <div :class="['member-avatar', { partner: member.id !== currentUserId }]">
                    {{ member.name.charAt(0) }}
                  </div>
                  <!-- 当前用户标识 -->
                  <div v-if="member.id === currentUserId" class="current-user-badge">
                    <i class="fas fa-user"></i>
                  </div>
                </div>
                <h3>{{ member.name }}</h3>
                <p style="color: var(--gray); margin-bottom: 15px;">
                  已完成任务: {{ member.completed_task_count || memberProgress[member.user_id]?.completed || 0 }}个
                  <span v-if="member.total_completion_hours" style="font-size: 0.8em; color: #666;">
                    (总耗时: {{ member.total_completion_hours }}小时)
                  </span>
                </p>
                
                <!-- 个人任务完成时间饼状图 -->
                <div v-if="member.pie_chart && member.pie_chart.labels && member.pie_chart.labels.length > 0" 
                    class="chart-container" style="height: 250px; margin-bottom: 15px;">
                  <div :ref="`memberTaskChart${member.id}`" style="width: 100%; height: 100%;"></div>
                </div>
                <div v-else class="no-data-chart">
                  <i class="fas fa-tasks"></i>
                  <p>暂无已完成任务</p>
                </div>
                
                <!-- 任务进度条（显示给所有成员） -->
                <div class="task-progress-section">
                  <div class="progress-header">
                    <span class="progress-title">
                      <i class="fas fa-chart-line"></i>
                      {{ member.user_id === currentUserId ? '我的' : member.user_name + '的' }}任务完成进度
                    </span>
                    <span class="progress-percentage">{{ memberProgress[member.user_id]?.percentage || 0 }}%</span>
                  </div>
                  <div class="progress-bar-container">
                    <div class="progress-bar" :style="{ 
                      width: `${memberProgress[member.user_id]?.percentage || 0}%`,
                      background: member.user_id === currentUserId 
                        ? 'linear-gradient(90deg, #1a73e8, #34a853)' 
                        : 'linear-gradient(90deg, #34a853, #1a73e8)'
                    }"></div>
                  </div>
                  <div class="progress-stats">
                    <span class="progress-stat">
                      <i :class="member.user_id === currentUserId ? 'fas fa-check-circle' : 'fas fa-user-check'"
                        :style="{ color: member.user_id === currentUserId ? '#1a73e8' : '#34a853' }"></i>
                      已完成: {{ memberProgress[member.user_id]?.completed || 0 }}
                    </span>
                    <span class="progress-stat">
                      <i class="fas fa-hourglass-half" :style="{ 
                        color: member.user_id === currentUserId ? '#ff9800' : '#ff9800' 
                      }"></i>
                      待完成: {{ (memberProgress[member.user_id]?.total || 0) - (memberProgress[member.user_id]?.completed || 0) }}
                    </span>
                    <span class="progress-stat">
                      <i class="fas fa-tasks" :style="{ 
                        color: member.user_id === currentUserId ? '#1a73e8' : '#34a853' 
                      }"></i>
                      总计: {{ memberProgress[member.user_id]?.total || 0 }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 任务互相监督 -->
          <div class="content-section" style="position: relative;">
            <h2 class="section-title">
              <i class="fas fa-tasks"></i>
              任务互相监督
            </h2>
            
            <!-- 任务统计摘要 -->
            <div class="task-summary-cards">
              <div class="summary-card">
                <div class="summary-icon completed">
                  <i class="fas fa-check-circle"></i>
                </div>
                <div class="summary-content">
                  <div class="summary-value">{{ taskSummary.completed || 0 }}</div>
                  <div class="summary-label">已完成</div>
                </div>
              </div>
              <div class="summary-card">
                <div class="summary-icon pending">
                  <i class="fas fa-clock"></i>
                </div>
                <div class="summary-content">
                  <div class="summary-value">{{ taskSummary.pending || 0 }}</div>
                  <div class="summary-label">待完成</div>
                </div>
              </div>
              <div class="summary-card">
                <div class="summary-icon total">
                  <i class="fas fa-tasks"></i>
                </div>
                <div class="summary-content">
                  <div class="summary-value">{{ taskSummary.total || 0 }}</div>
                  <div class="summary-label">总任务</div>
                </div>
              </div>
              <div class="summary-card">
                <div class="summary-icon rate">
                  <i class="fas fa-chart-line"></i>
                </div>
                <div class="summary-content">
                  <div class="summary-value">{{ taskSummary.completionRate || 0 }}%</div>
                  <div class="summary-label">完成率</div>
                </div>
              </div>
            </div>
            
            <div class="task-grid">
              <div class="task-column">
                <h4>我的任务 <span class="task-count">({{ myTasks.length }})</span></h4>
                <div class="task-list">
                  <div v-for="task in myTasks" :key="task.id" 
                      :class="['task-item', { 'task-completed': task.is_completed === 1 }]">
                    <!-- 打勾复选框 -->
                    <div class="task-checkbox" @click="toggleTaskCompletion(task)"
                        :class="{ 'checked': task.is_completed === 1 }">
                      <i v-if="task.is_completed === 1" class="fas fa-check"></i>
                    </div>
                    <div class="task-info">
                      <div class="task-title" :class="{ 'completed': task.is_completed === 1 }">
                        {{ task.title }}
                        <span v-if="task.priority === 'high'" class="priority-badge high">高</span>
                        <span v-else-if="task.priority === 'medium'" class="priority-badge medium">中</span>
                        <span v-else-if="task.priority === 'low'" class="priority-badge low">低</span>
                      </div>
                      <div v-if="task.description" class="task-description">
                        {{ task.description }}
                      </div>
                      <!-- 完成时间输入/显示 -->
                      <div v-if="task.is_completed !== 1" class="completion-time-input">
                        <label>预计耗时：</label>
                        <input type="number" 
                              min="1" 
                              max="480" 
                              placeholder="分钟" 
                              v-model="task.estimatedTime"
                              @change="saveCompletionTimeWithToggle(task.id, task.estimatedTime)">
                        <span class="time-unit">分钟</span>
                      </div>
                      <div v-else-if="task.completion_time" class="completion-time-display">
                        <i class="fas fa-clock"></i>
                        实际耗时: {{ task.completion_time }}分钟
                        <span v-if="task.completed_at" class="completion-date">
                          ({{ formatDate(task.completed_at) }})
                        </span>
                      </div>
                      <div v-if="task.is_completed === 1" class="status-badge completed">
                        <i class="fas fa-check-circle"></i> 已完成
                      </div>
                      <div v-else class="status-badge pending">
                        <i class="far fa-clock"></i> 待完成
                      </div>
                    </div>
                    <!-- 快速完成按钮（30分钟） -->
                    <button v-if="task.is_completed !== 1" class="quick-complete-btn" @click="quickCompleteTask(task.id)">
                      <i class="fas fa-bolt"></i>
                      快速完成
                    </button>
                  </div>
                </div>
              </div>
              
              <div class="task-column">
                <h4>伙伴的任务 <span class="task-count">({{ partnerTasks.length }})</span></h4>
                <div class="task-list">
                  <div v-for="task in partnerTasks" :key="task.id" 
                      :class="['task-item', { 'task-completed': task.is_completed === 1 }]">
                    <div class="task-checkbox readonly" :class="{ 'checked': task.is_completed === 1 }">
                      <i v-if="task.is_completed === 1" class="fas fa-check"></i>
                    </div>
                    <div class="task-info">
                      <div class="task-title" :class="{ 'completed': task.is_completed === 1 }">
                        {{ task.title }}
                        <span v-if="task.priority === 'high'" class="priority-badge high">高</span>
                        <span v-else-if="task.priority === 'medium'" class="priority-badge medium">中</span>
                        <span v-else-if="task.priority === 'low'" class="priority-badge low">低</span>
                      </div>
                      <div v-if="task.description" class="task-description">
                        {{ task.description }}
                      </div>
                      <div v-if="task.is_completed === 1 && task.completion_time" class="completion-time-display">
                        <i class="fas fa-clock"></i>
                        耗时: {{ task.completion_time }}分钟
                        <span v-if="task.completed_at && task.completed_at !== 'null' && task.completed_at !== 'undefined'" class="completion-date">
                          ({{ formatDate(task.completed_at) }})
                        </span>
                      </div>
                      <div v-else-if="task.is_completed !== 1" class="task-status-text">
                        <i class="far fa-clock"></i>
                        等待伙伴完成
                      </div>
                      <div v-if="task.is_completed === 1" class="status-badge completed">
                        <i class="fas fa-check-circle"></i> 伙伴已完成
                      </div>
                      <div v-else class="status-badge pending">
                        <i class="fas fa-user-clock"></i> 伙伴进行中
                      </div>
                    </div>
                    <button v-if="task.is_completed !== 1" 
                            class="remind-btn" 
                            @click="remindPartner(task)"
                            title="提醒伙伴完成任务">
                      <i class="fas fa-bell"></i>
                      提醒
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧内容 -->
        <div class="right-column">
          <!-- 学习伙伴 -->
          <div class="content-section">
            <h3 class="section-title">
              <i class="fas fa-user-friends"></i>
              学习伙伴
            </h3>
            <div v-if="partner" class="partner-info">
              <div class="partner-avatar">{{ partner.name.charAt(0) }}</div>
              <div class="partner-details">
                <h4>{{ partner.name }}</h4>
                <p>{{ partner.bio || 'Python学习者' }}</p>
              </div>
            </div>
            <div v-if="partner" class="partner-stats">
              <div class="stat-item">
                <span class="stat-label">学习时长</span>
                <span class="stat-value">{{ partner.totalStudyTime || 0 }}h</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">完成率</span>
                <span class="stat-value">{{ partner.completionRate || 0 }}%</span>
              </div>
            </div>
          </div>

          <!-- 任务清单 -->
          <div class="content-section tasklist-section">
            <div class="tasklist-header">
              <div class="tasklist-title">
                <i class="fas fa-clipboard-list"></i>
                <span>任务清单</span>
              </div>
              <div class="tasklist-actions">
                <button class="tasklist-search" @click="openTaskModal">
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
                :class="{ active: taskDateFilter === 'yesterday' }"
                @click="taskDateFilter = 'yesterday'"
              >昨天</button>
              <button
                class="tasklist-tab"
                :class="{ active: taskDateFilter === 'beforeYesterday' }"
                @click="taskDateFilter = 'beforeYesterday'"
              >前天</button>
              <button
                class="tasklist-tab"
                :class="{ active: taskDateFilter === 'all' }"
                @click="taskDateFilter = 'all'"
              >全部</button>
            </div>

            <div class="task-summary">
              <div class="task-summary-item">
                <span class="task-count">待办</span>
                <span class="task-number">{{ taskSummary.pending || 0 }}</span>
              </div>
              <div class="task-summary-item">
                <span class="task-count">进行</span>
                <span class="task-number">{{ taskSummary.inProgress || 0 }}</span>
              </div>
              <div class="task-summary-item">
                <span class="task-count">完成</span>
                <span class="task-number">{{ taskSummary.completed || 0 }}</span>
              </div>
            </div>

            <div class="tasklist-body" v-if="filteredCombinedTasks.length">
              <div
                v-for="task in filteredCombinedTasks"
                :key="task.id"
                class="task-card"
                :class="[`status-${task.status}`, task.assigneeType]"
              >
                <div class="task-card-main">
                  <div class="task-status-icon">
                    <i v-if="task.status === 'completed'" class="fas fa-check"></i>
                    <i v-else-if="task.status === 'in_progress'" class="fas fa-spinner"></i>
                    <i v-else class="far fa-circle"></i>
                  </div>
                  <div class="task-info-block">
                    <div class="task-card-title">{{ task.title }}</div>
                    <div class="task-card-meta">
                      {{ task.assigneeLabel }} · {{ task.timeLabel }}
                    </div>
                  </div>
                </div>
                <button class="task-card-action" @click="updateTaskStatus(task.id, task.nextStatus)">
                  {{ task.nextStatusLabel }}
                </button>
              </div>
            </div>
            <div class="tasklist-empty" v-else>
              <i class="fas fa-inbox"></i>
              <p>当前筛选下还没有任务~</p>
            </div>
          </div>

          <!-- 共同成就 -->
          <div class="content-section">
            <h3 class="section-title">
              <i class="fas fa-trophy"></i>
              共同成就
              <button class="view-all-btn">查看全部成就</button>
            </h3>
            <div class="achievements">
              <div v-for="achievement in achievements" :key="achievement.id" class="achievement-item">
                <div class="achievement-icon">{{ achievement.icon }}</div>
                <div class="achievement-info">
                  <div class="achievement-title">{{ achievement.name }}</div>
                  <div class="achievement-desc">{{ achievement.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 留言区移动至整体底部 - 商业化风格 -->
    <div class="board-wrapper">
      <div class="board-card">
        <div class="board-header">
          <div class="board-title">
            <i class="fas fa-comments"></i>
            <span>留言区</span>
          </div>
          <button class="board-history-btn" v-if="comments.length > commentLimit" @click="viewAllComments">
            <i class="fas fa-search"></i>
            查看留言记录
          </button>
        </div>

        <div class="board-form">
          <textarea
            class="board-input"
            v-model="newComment"
            placeholder="分享你的学习心得、遇到的问题或给伙伴的鼓励..."
            rows="3"
            @keyup.enter.ctrl="submitComment"
          ></textarea>
          <div class="board-form-footer">
            <span class="board-tip">Ctrl + Enter 快速发送</span>
            <button class="board-submit" @click="submitComment" :disabled="!newComment.trim()">
              发表
            </button>
          </div>
        </div>

        <div class="board-list" v-if="comments.length > 0">
          <div class="board-item">
            <div v-for="comment in displayedComments" :key="comment.id" class="board-entry">
              <div class="board-item-header">
                <div :class="['board-avatar', { partner: comment.userId !== currentUserId }]">
                  {{ comment.userName.charAt(0) }}
                </div>
                <div class="board-meta">
                  <div class="board-name-line">
                    <span class="board-name">{{ comment.userName }}</span>
                    <span class="board-badge" v-if="comment.userId === currentUserId">我</span>
                  </div>
                  <span class="board-time">{{ formatTime(comment.createdTime) }}</span>
                </div>
              </div>
              <p class="board-content">{{ comment.content }}</p>
            </div>
          </div>

          <button class="board-more" v-if="comments.length > commentLimit" @click="expandComments">
            展开更多留言
          </button>
        </div>

        <div class="board-empty" v-else>
          <i class="fas fa-comment-dots"></i>
          <p>还没有留言，快来发表第一条吧！</p>
        </div>
      </div>
    </div>

    <!-- 搜索任务记录模态框 -->
    <div class="modal" v-if="showTaskModal" @click.self="closeTaskModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">搜索任务记录</h3>
          <button class="close-btn" @click="closeTaskModal">&times;</button>
        </div>
        <div class="search-form">
          <div class="form-group">
            <label class="form-label">搜索关键词</label>
            <input class="form-input" type="text" v-model="searchKeyword" placeholder="输入任务标题关键词">
          </div>
          <div class="form-group">
            <label class="form-label">选择日期</label>
            <input class="form-input" type="date" v-model="searchDate">
          </div>
          <button class="submit-btn" @click="searchHistoryTasks">搜索</button>
          <div class="search-results">
            <div v-if="!filteredHistoryTasks.length" class="empty-placeholder">未找到对应任务记录</div>
            <div v-for="task in filteredHistoryTasks" :key="task.id" class="search-result-item">
              <div class="history-task-title">{{ task.title }}</div>
              <div class="history-task-meta">{{ getTaskStatusText(task) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加任务模态框 -->
    <div class="modal" v-if="showCreateTaskModal" @click.self="closeCreateTaskModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">添加监督任务</h3>
          <button class="close-btn" @click="closeCreateTaskModal">&times;</button>
        </div>
        <div class="add-task-form">
          <div class="form-group">
            <label class="form-label">任务标题</label>
            <input class="form-input" v-model="newTask.title" placeholder="请输入任务标题" />
          </div>
          <div class="form-group">
            <label class="form-label">任务描述</label>
            <textarea class="form-textarea" v-model="newTask.description" placeholder="补充任务说明"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">截止日期</label>
            <input class="form-input" type="date" v-model="newTask.deadline" />
          </div>
          <div class="form-group">
            <label class="form-label">监督对象</label>
            <select class="form-input" v-model="newTask.assigneeId">
              <option :value="currentUserId">我自己</option>
              <option v-if="partner" :value="partner.userId">{{ partner?.name }}</option>
            </select>
          </div>
          <button class="submit-btn" @click="submitNewTask">保存任务</button>
        </div>
      </div>
    </div>

    <!-- 编辑任务模态框 -->
    <div class="modal" v-if="showEditTaskModal" @click.self="closeEditTaskModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">编辑任务</h3>
          <button class="close-btn" @click="closeEditTaskModal">&times;</button>
        </div>
        <div class="add-task-form">
          <div class="form-group">
            <label class="form-label">任务标题</label>
            <input class="form-input" v-model="editingTask.title" placeholder="请输入任务标题" />
          </div>
          <div class="form-group">
            <label class="form-label">任务描述</label>
            <textarea class="form-textarea" v-model="editingTask.description" placeholder="补充任务说明"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">截止日期</label>
            <input class="form-input" type="date" v-model="editingTask.deadline" />
          </div>
          <div class="form-group">
            <label class="form-label">监督对象</label>
            <select class="form-input" v-model="editingTask.assigneeId">
              <option :value="currentUserId">我自己</option>
              <option v-if="partner" :value="partner.userId">{{ partner?.name }}</option>
            </select>
          </div>
          <button class="submit-btn" @click="updateTask">保存修改</button>
        </div>
      </div>
    </div>

    <!-- 加入请求模态框 -->
    <div class="modal" v-if="showJoinRequestsModal" @click.self="closeJoinRequestsModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">审核加入请求</h3>
          <button class="close-btn" @click="closeJoinRequestsModal">&times;</button>
        </div>
        <div class="join-requests-list">
          <div v-for="request in joinRequests" :key="request.id" class="join-request-item">
            <div class="request-user-info">
              <div class="request-avatar">{{ request.userName.charAt(0) }}</div>
              <div class="request-details">
                <h4>{{ request.userName }}</h4>
                <p>{{ request.message || '申请加入学习小组' }}</p>
                <span class="request-time">{{ formatTime(request.createdTime) }}</span>
              </div>
            </div>
            <div class="request-actions">
              <button class="approve-btn" @click="approveRequest(request)">
                <i class="fas fa-check"></i>
                同意
              </button>
              <button class="reject-btn" @click="rejectRequest(request)">
                <i class="fas fa-times"></i>
                拒绝
              </button>
            </div>
          </div>
          <div v-if="!joinRequests.length" class="empty-placeholder">暂无加入请求</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import {
  getTeamDetail,
  getTeamMembers,
  getTeamTasks,
  getTeamAchievements,
  getTeamComments,
  createTeamComment,
  createTeamTask,
  updateTeamTask,
  deleteTeamTask,
  joinTeam as joinTeamApi,
  leaveTeam as leaveTeamApi,
  // updateTeamTaskStatus, // 这个方法不再需要，因为使用打勾方式
  getJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  getTeamDailyStudyData,
  getUserDailyStudyDetail,
  getTeamTaskCompletionData,
  updateTaskCompletionStatus, // 改为新的方法
  quickCompleteTask, // 新增方法
  updateTaskCompletionTime,  // <-- 加上这个
  updateTeamTaskStatus       // <-- 加上这个
} from '@/api/community'
import { useUserStore } from '@/stores/user'

export default {
  name: 'StudyPair',
  setup() {
    const userStore = useUserStore()
    return { userStore }
  },
  data() {
    return {
      isJoined: false,
      newComment: '',
      teamData: {
        name: '',
        description: '',
        tags: [],
        studyDays: 0,
        completionRate: 0,
        completedTasks: 0,
        onlineMembers: 0,
        totalMembers: 0
      },
      teamMembers: [],
      myTasks: [],
      partnerTasks: [],
      historyTasks: [],
      filteredHistoryTasks: [],
      taskSummary: {
        pending: 0,
        inProgress: 0,
        completed: 0
      },
      achievements: [],
      comments: [],
      commentLimit: 3,
      taskDateFilter: 'all',
      showTaskModal: false,
      showCreateTaskModal: false,
      showEditTaskModal: false,
      showJoinRequestsModal: false,
      searchDate: '',
      searchKeyword: '',
      newTask: {
        title: '',
        description: '',
        deadline: '',
        assigneeId: null
      },
      editingTask: {
        id: null,
        title: '',
        description: '',
        deadline: '',
        assigneeId: null
      },
      
      joinRequests: [],
      teamAvatar: null,
      // 新增数据
      teamStudyData: null,
      memberCharts: {},
      teamChart: null,
      taskCompletionData: null,
      memberTaskCharts: {},
      memberProgress: {}
    }
  },
  computed: {
    currentUserId() {
      return this.userStore.userId
    },
    currentUserName() {
      return this.userStore.userName
    },
    combinedTasks() {
      const source = [...(this.myTasks || []), ...(this.partnerTasks || [])]
      return source.map(task => {
        const isMe = task.assigneeId === this.currentUserId
        const assigneeLabel = isMe ? '我' : '伙伴'
        const nextStatusMap = {
          pending: { next: 'in_progress', label: '开始' },
          in_progress: { next: 'completed', label: '完成' },
          completed: { next: 'pending', label: '重置' }
        }
        const nextStatus = nextStatusMap[task.status] || nextStatusMap.pending

        return {
          ...task,
          assigneeType: isMe ? 'mine' : 'partner',
          assigneeLabel,
          nextStatus: nextStatus.next,
          nextStatusLabel: nextStatus.label,
          timeLabel: this.formatTime(task.updatedTime || task.createTime)
        }
      })
    },
    filteredCombinedTasks() {
      if (this.taskDateFilter === 'all') {
        return this.combinedTasks
      }
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() - (this.taskDateFilter === 'yesterday' ? 1 : 2))
      const targetString = targetDate.toDateString()

      return this.combinedTasks.filter(task => {
        if (!task.updatedTime && !task.createTime) return false
        const time = new Date(task.updatedTime || task.createTime)
        return time.toDateString() === targetString
      })
    },
    pairMembers() {
      const members = this.teamMembers || []
      if (!members.length) return []

      const currentId = this.currentUserId != null ? String(this.currentUserId) : null
      const selfMember = currentId
        ? members.find(member => member?.userId != null && String(member.userId) === currentId)
          || members.find(member => member?.id != null && String(member.id) === currentId)
        : null
      const partnerMember = this.partner
      const pairs = []
      if (selfMember) pairs.push(selfMember)
      if (partnerMember && (!selfMember || partnerMember.id !== selfMember.id)) {
        pairs.push(partnerMember)
      }
      if (!pairs.length) {
        return members.slice(0, Math.min(2, members.length))
      }
      return pairs
    },
    partner() {
      return this.findPartner()
    },
    extraMemberCount() {
      return Math.max(0, (this.teamMembers?.length || 0) - this.pairMembers.length)
    },
    displayedComments() {
      if (this.comments.length <= this.commentLimit) return this.comments
      return this.comments.slice(0, this.commentLimit)
    }
  },
  async mounted() {
    if (!this.userStore.userId) {
      try {
        await this.userStore.fetchUserProfile()
      } catch (error) {
        console.error('获取用户信息失败:', error)
        this.notify('error', '请先登录')
        return
      }
    }
    this.newTask.assigneeId = this.currentUserId
    await this.loadTeamData()
    // 将 loadStudyData() 替换为新的方法调用
    await this.loadTaskCompletionData()
    // initMemberTaskCharts() 已经在 loadTaskCompletionData() 中通过 $nextTick 调用了
  },
  methods: {
    // 加载任务完成数据
    async loadTaskCompletionData() {
      try {
        const teamId = this.$route.params.teamId
        console.log('📊 加载任务完成数据，团队ID:', teamId)
        
        const response = await getTeamTaskCompletionData(teamId)
        console.log('📋 任务完成数据响应:', response)
        
        if (response && response.success && response.data) {
          this.taskCompletionData = response.data
          console.log('✅ 任务完成数据加载成功:', this.taskCompletionData)
          
          // 合并到团队成员数据中
          this.mergeTaskCompletionData()
          
          // 等待DOM更新后初始化图表
          this.$nextTick(() => {
            this.initMemberTaskCharts()
          })
        }
      } catch (error) {
        console.error('❌ 加载任务完成数据失败:', error)
      }
    },
    
    // 合并任务完成数据到团队成员
    mergeTaskCompletionData() {
      if (!this.taskCompletionData || !this.taskCompletionData.users) return
      
      this.taskCompletionData.users.forEach(userData => {
        const memberIndex = this.teamMembers.findIndex(member => 
          member.userId === userData.user_id || member.id === userData.user_id
        )
        
        if (memberIndex !== -1) {
          // 合并数据
          this.teamMembers[memberIndex] = {
            ...this.teamMembers[memberIndex],
            ...userData,
            completed_task_count: userData.completed_task_count || 0,
            total_completion_hours: userData.total_completion_hours || '0.0',
            average_completion_minutes: userData.average_completion_minutes || 0,
            pie_chart: userData.pie_chart
          }
        }
      })
    },
    
    // 初始化成员任务饼状图 - 只显示该用户自己的数据
    initMemberTaskCharts() {
      console.log('🎯 开始初始化成员任务图表')
      
      this.pairMembers.forEach(member => {
        // 检查该成员是否有自己的饼图数据
        if (member.pie_chart && member.pie_chart.labels && member.pie_chart.labels.length > 0) {
          this.initMemberTaskChart(member.id, member.pie_chart)
        } else {
          console.log(`⚠️ 成员 ${member.name} (ID: ${member.id}) 没有饼图数据`)
          // 显示空状态
          this.initEmptyChart(member.id)
        }
      })
    },
    
    // 初始化单个成员的任务饼状图 - 只显示该用户的数据
    initMemberTaskChart(userId, chartData) {
      console.log(`🎨 初始化成员 ${userId} 的任务饼状图`)
      
      const chartRef = `memberTaskChart${userId}`
      const chartDom = this.$refs[chartRef]
      if (!chartDom || !chartDom[0]) {
        console.error(`❌ 未找到成员 ${userId} 的饼状图DOM元素`)
        return
      }
      
      // 销毁旧图表
      if (this.memberTaskCharts[userId]) {
        this.memberTaskCharts[userId].dispose()
      }
      
      try {
        // 初始化图表
        const chart = echarts.init(chartDom[0])
        
        // 确保只使用该用户自己的数据
        const pieData = chartData.labels.map((label, index) => ({
          name: label,
          value: chartData.datasets[0].data[index] || 0,
          itemStyle: {
            color: chartData.datasets[0].backgroundColor[index] || this.getChartColor(index)
          }
        }))
        
        // 如果没有数据，显示空状态
        if (pieData.length === 0) {
          this.initEmptyChart(userId)
          return
        }
        
        // 配置项 - 为该用户定制
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
            orient: 'horizontal', // 改为水平方向
            bottom: 10, // 移到饼图下方
            left: 'center', // 居中
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
              name: '任务完成时间',
              type: 'pie',
              radius: ['40%', '65%'],
              center: ['50%', '45%'], // 调整饼图位置，为图例留出空间
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
        
        // 设置配置项
        chart.setOption(option)
        
        // 保存图表实例
        this.memberTaskCharts[userId] = chart
        
        // 响应式调整
        window.addEventListener('resize', () => {
          if (this.memberTaskCharts[userId]) {
            this.memberTaskCharts[userId].resize()
          }
        })
        
        console.log(`✅ 成员 ${userId} 任务饼状图初始化成功，显示 ${pieData.length} 个任务`)
      } catch (error) {
        console.error(`❌ 初始化成员 ${userId} 任务饼状图失败:`, error)
      }
    },

    // 初始化空状态图表
initEmptyChart(userId) {
  const chartRef = `memberTaskChart${userId}`
  const chartDom = this.$refs[chartRef]
  if (!chartDom || !chartDom[0]) return
  
  // 销毁旧图表
  if (this.memberTaskCharts[userId]) {
    this.memberTaskCharts[userId].dispose()
  }
  
  const chart = echarts.init(chartDom[0])
  
  const option = {
    title: {
      text: '暂无已完成任务',
      left: 'center',
      top: 'center',
      textStyle: {
        color: '#999',
        fontSize: 14,
        fontWeight: 'normal'
      }
    },
    graphic: {
      type: 'text',
      left: 'center',
      top: '45%',
      style: {
        text: '📊',
        fontSize: 30,
        fill: '#ccc'
      }
    }
  }
  
  chart.setOption(option)
  this.memberTaskCharts[userId] = chart
},

    // 计算所有成员的任务进度
calculateAllMemberProgress() {
  console.log('📈 开始计算所有成员进度')
  this.memberProgress = {}
  
  // 获取所有任务
  const allTasks = [...this.myTasks, ...this.partnerTasks]
  console.log(`📋 总任务数: ${allTasks.length}`)
  
  // 为每个配对成员计算进度
  this.pairMembers.forEach(member => {
    const userId = member.user_id || member.userId || member.id
    
    // 过滤出该成员的任务
    const memberTasks = allTasks.filter(task => {
      // 多种可能的 assignee 字段
      return task.assigneeId === userId || 
             task.assignee_id === userId ||
             (task.assignee && (task.assignee.user_id === userId || task.assignee.id === userId))
    })
    
    console.log(`👤 成员 ${member.name} (ID: ${userId}) 有 ${memberTasks.length} 个任务`)
    
    const completedTasks = memberTasks.filter(task => {
      // 确保正确处理完成状态
      return task.is_completed === 1 || task.is_completed === true
    }).length
    
    const totalTasks = memberTasks.length
    
    const progressData = {
      completed: completedTasks,
      total: totalTasks,
      percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    }
    
    console.log(`📊 成员 ${member.name} 进度:`, progressData)
    
    this.memberProgress[userId] = progressData
  })
  
  // 同时更新整体任务统计
  this.updateTaskProgressSummary(allTasks)
},

// 更新整体任务进度统计
updateTaskProgressSummary(allTasks) {
  const totalTasks = allTasks.length
  const completedTasks = allTasks.filter(task => 
    task.is_completed === 1 || task.is_completed === true
  ).length
  const pendingTasks = totalTasks - completedTasks
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  
  console.log(`📈 整体任务统计: 总计 ${totalTasks}, 完成 ${completedTasks}, 待办 ${pendingTasks}, 完成率 ${completionRate}%`)
  
  this.taskSummary = {
    total: totalTasks,
    completed: completedTasks,
    pending: pendingTasks,
    completionRate: completionRate
  }
  
  // 更新团队数据中的完成率
  if (this.teamData) {
    this.teamData.completionRate = completionRate
    this.teamData.completedTasks = completedTasks
  }
},

// 修改 toggleTaskCompletion 方法确保逻辑正确
async toggleTaskCompletion(task) {
  // 只能操作自己的任务
  const taskAssigneeId = task.assigneeId || task.assignee_id;
  if (taskAssigneeId !== this.currentUserId) return;
  
  const newStatus = task.is_completed === 1 ? 0 : 1;
  
  console.log(`🔄 切换任务 ${task.id} 状态: ${task.is_completed} -> ${newStatus}`, task);
  
  // 如果是标记为已完成
  if (newStatus === 1) {
    // 如果任务已经有完成时间，直接切换状态
    if (task.completion_time && task.completion_time > 0) {
      await this.updateTaskStatusDirect(task.id, newStatus, task.completion_time);
    } else {
      // 提示输入完成时间
      const completionTime = prompt('请输入任务完成时间（分钟）:', '30');
      if (!completionTime || isNaN(completionTime) || completionTime <= 0) {
        this.notify('error', '请输入有效的完成时间');
        return;
      }
      await this.updateTaskStatusDirect(task.id, newStatus, parseInt(completionTime));
    }
  } else {
    // 取消完成状态
    await this.updateTaskStatusDirect(task.id, newStatus, null);
  }
},

// 新增：直接更新任务状态的方法
async updateTaskStatusDirect(taskId, isCompleted, completionTime) {
  try {
    const response = await updateTaskCompletionStatus(taskId, {
      user_id: this.currentUserId,
      is_completed: isCompleted,
      completion_time: completionTime
    });
    
    if (response && response.success) {
      // 更新本地任务状态
      const allTasks = [...this.myTasks, ...this.partnerTasks];
      const taskToUpdate = allTasks.find(t => t.id === taskId);
      
      if (taskToUpdate) {
        taskToUpdate.is_completed = isCompleted;
        if (isCompleted === 1 && completionTime) {
          taskToUpdate.completion_time = completionTime;
          taskToUpdate.completed_at = new Date().toISOString();
        } else if (isCompleted === 0) {
          taskToUpdate.completion_time = null;
          taskToUpdate.completed_at = null;
        }
      }
      
      this.notify('success', isCompleted ? '任务已完成' : '任务已标记为未完成');
      
      // 重新计算统计
      this.calculateTaskSummary();
      this.calculateAllMemberProgress();
      
      // 如果有饼图，重新加载数据
      await this.loadTaskCompletionData();
    } else {
      this.notify('error', response?.message || '操作失败');
    }
  } catch (error) {
    console.error('更新任务状态失败:', error);
    this.notify('error', error?.response?.data?.message || '操作失败');
  }
},

// 快速完成任务（30分钟）
async quickCompleteTask(taskId) {
  try {
    const response = await quickCompleteTask(taskId, {
      user_id: this.currentUserId
    });
    
    if (response && response.success) {
      // 更新本地任务状态
      const task = this.myTasks.find(t => t.id === taskId) ||
                   this.combinedTasks.find(t => t.id === taskId);
      if (task) {
        task.is_completed = 1;
        task.completion_time = 30;
        task.completed_at = new Date().toISOString();
      }
      this.notify('success', '任务已完成（默认30分钟）');
      this.calculateTaskSummary();
      this.calculateAllMemberProgress();
    }
  } catch (error) {
    console.error('快速完成任务失败:', error);
    this.notify('error', error?.response?.data?.message || '操作失败');
  }
},

// 保存完成时间并切换状态
async saveCompletionTimeWithToggle(taskId, completionTime) {
  if (!completionTime || completionTime <= 0) {
    this.notify('error', '请输入有效的完成时间');
    return;
  }
  
  try {
    const response = await updateTaskCompletionStatus(taskId, {
      user_id: this.currentUserId,
      is_completed: 1,
      completion_time: parseInt(completionTime)
    });
    
    if (response && response.success) {
      const task = this.myTasks.find(t => t.id === taskId);
      if (task) {
        task.is_completed = 1;
        task.completion_time = parseInt(completionTime);
        task.completed_at = new Date().toISOString();
      }
      this.notify('success', '任务已完成');
      this.calculateTaskSummary();
      this.calculateAllMemberProgress();
    }
  } catch (error) {
    console.error('保存完成时间失败:', error);
    this.notify('error', error?.response?.data?.message || '操作失败');
  }
},
    
    // 保存完成时间
    async saveCompletionTime(taskId, completionMinutes) {
      if (!completionMinutes || completionMinutes <= 0) {
        this.notify('error', '请输入有效的完成时间（大于0分钟）')
        return
      }
      
      try {
        const response = await updateTaskCompletionTime(taskId, {
          user_id: this.currentUserId,
          completion_time: parseInt(completionMinutes)
        })
        
        if (response && response.success) {
          this.notify('success', '完成时间已保存')
          
          // 重新加载任务完成数据
          await this.loadTaskCompletionData()
          
          // 重新加载团队数据以更新任务列表
          await this.loadTeamData()
        } else {
          this.notify('error', response?.message || '保存失败')
        }
      } catch (error) {
        console.error('保存完成时间失败:', error)
        this.notify('error', error?.response?.data?.message || '保存失败，请稍后重试')
      }
    },
    
    // 计算任务效率评分
    getEfficiencyScore(member) {
      if (!member.average_completion_minutes) return 'N/A'
      const avgTime = member.average_completion_minutes
      if (avgTime <= 30) return '高效'
      if (avgTime <= 60) return '良好'
      if (avgTime <= 120) return '一般'
      return '待提升'
    },
    
    getEfficiencyClass(member) {
      const score = this.getEfficiencyScore(member)
      switch(score) {
        case '高效': return 'efficient-high'
        case '良好': return 'efficient-good'
        case '一般': return 'efficient-normal'
        default: return 'efficient-low'
      }
    },
    parseTags(rawTags) {
      if (!rawTags) return []
      if (Array.isArray(rawTags)) return rawTags
      if (typeof rawTags === 'string') {
        try {
          const parsed = JSON.parse(rawTags)
          return Array.isArray(parsed) ? parsed : rawTags.split(/[，,]/).map(tag => tag.trim()).filter(Boolean)
        } catch (error) {
          return rawTags.split(/[，,]/).map(tag => tag.trim()).filter(Boolean)
        }
      }
      return []
    },

    initCharts() {
      // 数据可视化暂未实现，预留方法避免 mounted 报错
    },
    // StudyPair.vue 中的 loadTeamData 方法
async loadTeamData() {
  try {
    const teamId = this.$route.params.teamId
    
    // 加载团队基本信息（保持不变）
    const teamResponse = await getTeamDetail(teamId, this.currentUserId)
    if (teamResponse && teamResponse.success && teamResponse.data) {
      const data = teamResponse.data
      this.isJoined = data.is_joined !== undefined ? data.is_joined : true

      const parsedTags = this.parseTags(data.tags)
      this.teamData = {
        name: data.team_name,
        description: data.description,
        tags: parsedTags,
        studyDays: data.total_study_days || 0,
        completionRate: data.completion_rate || 0,
        completedTasks: data.completed_tasks || 0,
        onlineMembers: data.online_members || 0,
        totalMembers: data.current_members || data.max_members || 0
      }
      this.teamMembers = this.transformMembers(data.members)
    }

    // 加载团队成员（保持不变）
    const membersResponse = await getTeamMembers(teamId)
    if (membersResponse && membersResponse.success && membersResponse.data) {
      const memberPayload = Array.isArray(membersResponse.data)
        ? membersResponse.data
        : membersResponse.data.members || []
      this.teamMembers = this.transformMembers(memberPayload)
    }

    // ✅ 修改这里：使用 task-completion 数据
    const tasksResponse = await getTeamTasks(teamId)
    if (tasksResponse && tasksResponse.success && tasksResponse.data) {
      // 从 task-completion 数据中提取任务信息
      this.processTaskCompletionData(tasksResponse.data)
    }

    // 确保 assigneeId 有默认值
    if (!this.newTask.assigneeId) {
      this.newTask.assigneeId = this.currentUserId
    }

    // 加载成就数据 - 基于当前用户的任务统计生成成就
    this.calculateAchievements()

    // 加载留言数据（保持不变）
    const commentsResponse = await getTeamComments(teamId)
    if (commentsResponse && commentsResponse.success && commentsResponse.data) {
      this.comments = commentsResponse.data.map(item => ({
        id: item.message_id,
        userId: item.sender_id,
        userName: item.user_name || '同学',
        content: item.content,
        createdTime: item.create_time
      }))
    }

    // 加载加入请求 - 暂时跳过
    this.joinRequests = []

  } catch (error) {
    console.error('加载团队数据失败:', error)
    this.notify('error', '加载数据失败，请稍后重试')
  }
},

// ✅ 处理任务完成数据
// StudyPair.vue 中的 processTaskCompletionData 方法修改

processTaskCompletionData(taskData) {
  if (!taskData.users || !Array.isArray(taskData.users)) return
  
  const myTasks = []
  const partnerTasks = []
  
  console.log('📋 开始处理任务完成数据:', taskData)
  
  taskData.users.forEach(user => {
    const userId = user.user_id
    const tasks = user.tasks || [] // 🔥 这里现在是所有任务
    
    console.log(`👤 用户 ${userId} 有 ${tasks.length} 个任务`)
    
    tasks.forEach(task => {
      const taskObj = {
        id: task.task_id,
        title: task.task_title || `任务${task.task_id}`,
        description: task.task_description || '',
        assigneeId: userId,
        is_completed: task.is_completed || 0,
        completion_time: task.completion_time || null,
        completed_at: task.completed_at || null,
        due_date: task.due_date || null,
        priority: task.priority || 'medium',
        createTime: task.created_at || new Date().toISOString(),
        updateTime: task.updated_at || new Date().toISOString(),
        estimatedTime: task.estimated_time || null
      }
      
      if (userId === this.currentUserId) {
        myTasks.push(taskObj)
      } else {
        partnerTasks.push(taskObj)
      }
    })
  })
  
  console.log(`📊 我的任务: ${myTasks.length} 个 (已完成: ${myTasks.filter(t => t.is_completed === 1).length}), 伙伴任务: ${partnerTasks.length} 个`)
  
  this.myTasks = myTasks
  this.partnerTasks = partnerTasks
  this.historyTasks = [...myTasks, ...partnerTasks]
  this.filteredHistoryTasks = [...myTasks, ...partnerTasks]
  
  // 计算任务统计和进度
  this.calculateTaskSummary()
  this.calculateAllMemberProgress()
},

// 在 methods 中添加 formatDate 函数
formatDate(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // 如果是今天，显示时间
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      // 今天：显示时间
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
    
    // 昨天：显示"昨天"
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
    
    // 本周内：显示星期几
    const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return weekDays[date.getDay()];
    }
    
    // 其他情况：显示日期
    return date.toLocaleDateString('zh-CN', { 
      month: '2-digit', 
      day: '2-digit' 
    });
    
  } catch (error) {
    console.error('格式化日期错误:', error, dateString);
    return '';
  }
},
    
    transformMembers(members = []) {
      return members.map(member => {
        const userId = member.user_id ?? member.userId ?? member.id ?? member.member_id
        const studyMinutes = Number(member.today_study_time ?? member.todayStudyTime ?? 0)
        const overall = member.progress_rate ?? member.progressRate ?? member.mastery_level ?? member.masteryLevel ?? 0

        return {
          id: member.member_id ?? member.user_id ?? member.userId ?? member.id ?? userId,
          userId,
          name: member.user_name || member.userName || '学习者',
          avatar: member.avatar_url || member.avatarUrl,
          todayStudyTime: Number((studyMinutes / 60).toFixed(1)),
          overallProgress: overall
        }
      })
    },

    findPartner(members = this.teamMembers) {
      if (!Array.isArray(members) || !members.length) return null
      if (this.currentUserId == null) return null

      const currentId = String(this.currentUserId)
      const withUserId = members.filter(member => member?.userId != null)
      const othersByUserId = withUserId.filter(member => String(member.userId) !== currentId)
      if (othersByUserId.length) return othersByUserId[0]

      const selfByUserId = withUserId.find(member => String(member.userId) === currentId)
      if (selfByUserId) {
        const remaining = members.filter(member => member !== selfByUserId)
        return remaining[0] || null
      }

      const selfById = members.find(member => member?.id != null && String(member.id) === currentId)
      if (selfById) {
        const remaining = members.filter(member => member !== selfById)
        return remaining[0] || null
      }

      return null
    },

    calculateTaskSummary() {
      const allTasks = [...this.myTasks, ...this.partnerTasks];
      const completedTasks = allTasks.filter(task => task.is_completed === 1).length;
      const totalTasks = allTasks.length;
      
      this.taskSummary = {
        total: totalTasks,
        completed: completedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      };
    },
    
    async leaveTeam() {
      if (!confirm('确定要退出该学习小组吗？退出后将无法查看小组详情。')) {
        return
      }
      
      try {
        const teamId = this.$route.params.teamId
        const response = await leaveTeamApi(teamId, this.currentUserId)
        if (response.success) {
          this.notify('success', '已成功退出小组')
          // 退出后跳转到小组列表页面
          this.$router.push('/community/teams')
        } else {
          this.notify('error', response?.message || '退出失败')
        }
      } catch (error) {
        console.error('退出小组失败:', error)
        this.notify('error', '退出失败，请稍后重试')
      }
    },
    
    shareTeam() {
      const teamUrl = window.location.href
      if (navigator.share) {
        navigator.share({
          title: this.teamData.name,
          text: this.teamData.description,
          url: teamUrl
        })
      } else {
        navigator.clipboard.writeText(teamUrl)
        this.notify('success', '链接已复制到剪贴板')
      }
    },
    
    async updateTaskStatus(taskId, newStatus) {
      const affected = []
      const recordTask = (list) => {
        const target = list.find(t => t.id === taskId)
        if (target && !affected.includes(target)) {
          affected.push(target)
        }
      }

      recordTask(this.myTasks)
      recordTask(this.partnerTasks)
      recordTask(this.historyTasks)
      recordTask(this.filteredHistoryTasks)

      if (!affected.length) return

      const previousStates = affected.map(task => ({
        task,
        status: task.status,
        updatedTime: task.updatedTime
      }))

      const optimisticUpdateTime = new Date().toISOString()
      affected.forEach(task => {
        task.status = newStatus
        task.updatedTime = optimisticUpdateTime
      })
      this.calculateTaskSummary()

      try {
        const response = await updateTeamTaskStatus(taskId, newStatus)

        if (response.success) {
          const serverTime = response.data?.update_time
          if (serverTime) {
            affected.forEach(task => {
              task.updatedTime = serverTime
            })
          }
          await this.loadTeamData()
          this.notify('success', '任务状态已更新')
        } else {
          throw new Error(response.message || '更新失败')
        }
      } catch (error) {
        previousStates.forEach(({ task, status, updatedTime }) => {
          task.status = status
          task.updatedTime = updatedTime
        })
        this.calculateTaskSummary()
        console.error('更新任务状态失败:', error)
        const message = error?.response?.data?.message || error.message || '更新失败，请稍后重试'
        this.notify('error', message)
      }
    },

    remindPartner(task) {
      if (!this.partner) return
      this.notify('success', `已提醒 ${this.partner.name} 尽快完成：${task.title}`)
    },
    
    async submitComment() {
      if (!this.newComment.trim()) return
      
      try {
        const teamId = this.$route.params.teamId
        
        const response = await createTeamComment(teamId, {
          user_id: this.currentUserId,
          content: this.newComment
        })
        
        this.newComment = ''
        
        if (response && response.success && response.data) {
          const saved = response.data
          this.comments.unshift({
            id: saved.message_id || Date.now(),
            userId: this.currentUserId,
            userName: saved.user_name || this.currentUserName || '我',
            content: saved.content,
            createdTime: saved.create_time || new Date().toISOString()
          })
        } else {
          this.notify('error', response?.message || '发送失败')
        }
      } catch (error) {
        console.error('发送留言失败:', error)
        this.notify('error', error?.response?.data?.message || '发送失败，请稍后重试')
      }
    },
    
    getTaskStatusText(task, isPartner = false) {
      const statusMap = {
        'completed': '已完成',
        'in_progress': '进行中',
        'pending': '待开始'
      }

      if (task.status === 'completed') {
        return `已完成 ✓ ${this.formatTime(task.updatedTime)}`
      } else if (task.status === 'in_progress') {
        return isPartner || task.assigneeId !== this.currentUserId ? '伙伴进行中' : '进行中'
      } else {
        // pending状态
        return isPartner || task.assigneeId !== this.currentUserId ? '等待伙伴开始' : '待开始'
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
      
      if (minutes < 60) {
        return `${minutes}分钟前`
      } else if (hours < 24) {
        return `${hours}小时前`
      } else if (days === 1) {
        return '昨天'
      } else {
        return time.toLocaleDateString()
      }
    },

    openTaskModal() {
      this.showTaskModal = true
    },

    closeTaskModal() {
      this.showTaskModal = false
      this.searchDate = ''
      this.filteredHistoryTasks = [...this.historyTasks]
    },

    searchHistoryTasks() {
      let filtered = [...this.historyTasks]
      
      // 按关键词搜索
      if (this.searchKeyword.trim()) {
        const keyword = this.searchKeyword.trim().toLowerCase()
        filtered = filtered.filter(task => 
          task.title.toLowerCase().includes(keyword)
        )
      }
      
      // 按日期搜索
      if (this.searchDate) {
        const searchDateObj = new Date(this.searchDate)
        filtered = filtered.filter(task => {
          if (!task.updatedTime) return false
          const taskDate = new Date(task.updatedTime)
          return taskDate.toDateString() === searchDateObj.toDateString()
        })
      }
      
      this.filteredHistoryTasks = filtered
    },

    openCreateTaskModal() {
      this.resetNewTask() // 确保每次打开时都重置任务数据
      this.showCreateTaskModal = true
    },

    closeCreateTaskModal() {
      this.showCreateTaskModal = false
      this.resetNewTask()
    },

    resetNewTask() {
      this.newTask = {
        title: '',
        description: '',
        deadline: '',
        assigneeId: this.currentUserId
      }
    },

    async submitNewTask() {
      if (!this.newTask.title.trim()) {
        this.notify('error', '请填写任务标题')
        return
      }
      try {
        const teamId = this.$route.params.teamId
        const payload = {
          creator_id: this.currentUserId,
          title: this.newTask.title.trim(),
          description: this.newTask.description.trim(),
          deadline: this.newTask.deadline ? `${this.newTask.deadline} 23:59:59` : null,
          assignee_id: this.newTask.assigneeId || this.currentUserId
        }
        const response = await createTeamTask(teamId, payload)
        if (response && response.success) {
          this.notify('success', '任务创建成功')
          this.closeCreateTaskModal()
          await this.loadTeamData() // 重新加载数据以更新任务列表
        } else {
          this.notify('error', response?.message || '创建任务失败')
        }
      } catch (error) {
        console.error('创建任务失败:', error)
        this.notify('error', error?.response?.data?.message || '创建任务失败，请稍后重试')
      }
    },

    // 编辑任务相关方法
    editTask(task) {
      this.editingTask = {
        id: task.id,
        title: task.title,
        description: task.description || '',
        deadline: task.deadline || '',
        assigneeId: task.assigneeId
      }
      this.showEditTaskModal = true
    },

    closeEditTaskModal() {
      this.showEditTaskModal = false
      this.editingTask = {
        id: null,
        title: '',
        description: '',
        deadline: '',
        assigneeId: null
      }
    },

    async updateTask() {
      if (!this.editingTask.title.trim()) {
        this.notify('error', '请填写任务标题')
        return
      }
      try {
        const payload = {
          title: this.editingTask.title.trim(),
          description: this.editingTask.description.trim(),
          deadline: this.editingTask.deadline ? `${this.editingTask.deadline} 23:59:59` : null
        }
        const response = await updateTeamTask(this.editingTask.id, payload)
        if (response && response.success) {
          this.notify('success', '任务更新成功')
          this.closeEditTaskModal()
          await this.loadTeamData() // 重新加载数据
        } else {
          this.notify('error', response?.message || '更新任务失败')
        }
      } catch (error) {
        console.error('更新任务失败:', error)
        this.notify('error', error?.response?.data?.message || '更新任务失败，请稍后重试')
      }
    },

    async deleteTask(taskId) {
      if (!confirm('确定要删除这个任务吗？')) return
      try {
        const response = await deleteTeamTask(taskId)
        if (response && response.success) {
          this.notify('success', '任务删除成功')
          await this.loadTeamData() // 重新加载数据
        } else {
          this.notify('error', response?.message || '删除任务失败')
        }
      } catch (error) {
        console.error('删除任务失败:', error)
        this.notify('error', error?.response?.data?.message || '删除任务失败，请稍后重试')
      }
    },

    // 审核加入请求相关方法
    openJoinRequestsModal() {
      this.showJoinRequestsModal = true
    },

    closeJoinRequestsModal() {
      this.showJoinRequestsModal = false
    },

    async approveRequest(request) {
      try {
        const teamId = this.$route.params.teamId
        const response = await approveJoinRequest(teamId, request.userId)
        if (response && response.success) {
          this.notify('success', `已同意 ${request.userName} 的加入申请`)
          this.joinRequests = this.joinRequests.filter(r => r.id !== request.id)
          await this.loadTeamData() // 重新加载数据
        } else {
          this.notify('error', response?.message || '操作失败')
        }
      } catch (error) {
        console.error('审核加入请求失败:', error)
        this.notify('error', '操作失败，请稍后重试')
      }
    },

    async rejectRequest(request) {
      try {
        const teamId = this.$route.params.teamId
        const response = await rejectJoinRequest(teamId, request.userId)
        if (response && response.success) {
          this.notify('success', `已拒绝 ${request.userName} 的加入申请`)
          this.joinRequests = this.joinRequests.filter(r => r.id !== request.id)
        } else {
          this.notify('error', response?.message || '操作失败')
        }
      } catch (error) {
        console.error('审核加入请求失败:', error)
        this.notify('error', '操作失败，请稍后重试')
      }
    },

    // 头像上传相关方法
    uploadTeamAvatar() {
      this.$refs.avatarInput.click()
    },

    handleAvatarUpload(event) {
      const file = event.target.files[0]
      if (!file) return
      
      // 这里可以添加文件上传逻辑
      const reader = new FileReader()
      reader.onload = (e) => {
        this.teamAvatar = e.target.result
        this.notify('success', '头像上传成功')
      }
      reader.readAsDataURL(file)
    },

    viewAllComments() {
      this.notify('success', '查看留言记录功能待实现')
    },

    expandComments() {
      this.commentLimit = this.comments.length
    },

    // 计算个人成就
    calculateAchievements() {
      const achievements = []
      const myCompletedCount = this.myTasks.filter(t => t.status === 'completed').length
      const myTotalCount = this.myTasks.length
      const completionRate = myTotalCount > 0 ? Math.round((myCompletedCount / myTotalCount) * 100) : 0

      // 成就1: 初出茅庐 - 完成第一个任务
      if (myCompletedCount >= 1) {
        achievements.push({
          id: 'first_task',
          name: '初出茅庐',
          description: '完成了第一个学习任务',
          icon: '🎯'
        })
      }

      // 成就2: 勤奋学习 - 完成5个任务
      if (myCompletedCount >= 5) {
        achievements.push({
          id: 'five_tasks',
          name: '勤奋学习',
          description: '累计完成5个学习任务',
          icon: '📚'
        })
      }

      // 成就3: 学霸之路 - 完成10个任务
      if (myCompletedCount >= 10) {
        achievements.push({
          id: 'ten_tasks',
          name: '学霸之路',
          description: '累计完成10个学习任务',
          icon: '🏆'
        })
      }

      // 成就4: 完美主义 - 任务完成率达到100%
      if (completionRate === 100 && myTotalCount > 0) {
        achievements.push({
          id: 'perfectionist',
          name: '完美主义',
          description: '任务完成率达到100%',
          icon: '💯'
        })
      }

      // 成就5: 高效达人 - 任务完成率超过80%
      if (completionRate >= 80 && myTotalCount >= 3) {
        achievements.push({
          id: 'efficient',
          name: '高效达人',
          description: '任务完成率超过80%',
          icon: '⚡'
        })
      }

      // 成就6: 团队协作 - 有伙伴且双方都有任务
      if (this.partner && this.partnerTasks.length > 0 && myTotalCount > 0) {
        achievements.push({
          id: 'teamwork',
          name: '团队协作',
          description: '与伙伴共同学习进步',
          icon: '🤝'
        })
      }

      // 成就7: 坚持不懈 - 连续学习（基于团队学习天数）
      if (this.teamData.studyDays >= 7) {
        achievements.push({
          id: 'persistent',
          name: '坚持不懈',
          description: `已坚持学习${this.teamData.studyDays}天`,
          icon: '🔥'
        })
      }

      this.achievements = achievements
    },

    notify(type, message) {
      const messenger = this.$message
      if (messenger && typeof messenger[type] === 'function') {
        messenger[type](message)
      } else {
        if (type === 'error') {
          console.error(message)
        } else {
          console.log(message)
        }
      }
    },

    // 组件销毁时清理图表
    beforeDestroy() {
      // 清理小组图表
      if (this.teamChart) {
        this.teamChart.dispose()
      }
      
      // 清理成员图表
      Object.values(this.memberCharts).forEach(chart => {
        if (chart && chart.dispose) {
          chart.dispose()
        }
      })
      
      // 移除窗口resize监听
      window.removeEventListener('resize', this.handleResize)
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 组队头部 */
.team-header {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  padding: 40px 0;
  margin-bottom: 30px;
}

/* 组合头像样式 */
.team-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 30px;
  position: relative;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
}

.team-avatar:hover {
  transform: scale(1.05);
}

.team-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.default-avatar {
  display: flex;
  width: 100%;
  height: 100%;
  position: relative;
}

.avatar-member {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  position: absolute;
  border: 3px solid white;
}

.avatar-member.member-1 {
  top: 10px;
  left: 15px;
  background: var(--primary);
}

.avatar-member.member-2 {
  bottom: 10px;
  right: 15px;
  background: var(--secondary);
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 50%;
}

.team-avatar:hover .upload-overlay {
  opacity: 1;
}

.upload-overlay i {
  font-size: 1.5rem;
  margin-bottom: 5px;
}

.upload-overlay span {
  font-size: 0.8rem;
}

.team-info {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 40px;
  align-items: center;
}

.team-avatar {
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
}

.team-details h1 {
  font-size: 1.8rem;
  margin-bottom: 8px;
}

.team-description {
  font-size: 1rem;
  opacity: 0.9;
  margin-bottom: 15px;
  line-height: 1.5;
}

.team-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.tag {
  background: rgba(255,255,255,0.2);
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 0.8rem;
  backdrop-filter: blur(10px);
}

.team-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.team-stat {
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

.team-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
}

.btn-primary {
  background: white;
  color: var(--secondary);
}

.btn-primary:hover {
  background: rgba(255,255,255,0.9);
}

.btn-secondary {
  background: rgba(255,255,255,0.2);
  color: white;
  backdrop-filter: blur(10px);
}

.btn-secondary:hover {
  background: rgba(255,255,255,0.3);
}

/* 主要内容布局 */
.main-content {
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

/* 学习进度对比 - 头像居中样式 */
.progress-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.member-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  text-align: center;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
}

.member-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* 头像包装容器 */
.member-avatar-wrapper {
  position: relative;
  width: 90px;
  height: 90px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 头像居中样式 */
.member-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0 auto;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

/* 当前用户头像样式 */
.member-avatar:not(.partner) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 3px solid #667eea;
}

/* 伙伴头像样式 */
.member-avatar.partner {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border: 3px solid #22c55e;
}

/* 当前用户标识徽章 */
.current-user-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 2;
}

.member-card h3 {
  font-size: 1.2rem;
  margin-bottom: 10px;
  color: #1e293b;
  font-weight: 600;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .progress-comparison {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .member-avatar-wrapper {
    width: 80px;
    height: 80px;
  }
  
  .member-avatar {
    width: 70px;
    height: 70px;
    font-size: 1.5rem;
  }
  
  .current-user-badge {
    width: 24px;
    height: 24px;
    font-size: 0.7rem;
  }
}

/* 确保头像与内容对齐 */
.member-card > *:not(.member-avatar-wrapper) {
  text-align: center;
}

.chart-container {
  height: 250px;
  margin-top: 15px;
  position: relative;
}

/* 新增的饼状图相关样式 */
.team-pie-chart-container {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

.section-subtitle {
  font-size: 1.1rem;
  margin-bottom: 15px;
  color: var(--dark);
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-summary {
  display: flex;
  justify-content: space-around;
  margin-top: 15px;
  padding: 15px;
  background: var(--light);
  border-radius: 10px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.summary-item i {
  font-size: 1.2rem;
  color: var(--primary);
}

.summary-item span {
  font-size: 0.85rem;
  color: var(--gray);
}

.no-data-chart {
  height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--gray);
  background: var(--light);
  border-radius: 8px;
  margin-bottom: 15px;
}

.no-data-chart i {
  font-size: 2rem;
  margin-bottom: 10px;
  opacity: 0.5;
}

.no-team-data {
  text-align: center;
  padding: 40px 20px;
  color: var(--gray);
  background: var(--light);
  border-radius: 10px;
  margin-top: 20px;
}

.no-team-data i {
  font-size: 3rem;
  margin-bottom: 15px;
  opacity: 0.3;
}

.no-team-data p {
  margin: 0;
  font-size: 0.95rem;
}

/* 确保图表容器正确显示 */
.chart-container {
  position: relative;
  width: 100%;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .chart-summary {
    flex-direction: column;
    gap: 10px;
  }
  
  .summary-item {
    flex-direction: row;
    gap: 10px;
  }
}

/* 任务进度条样式 */
.task-progress-section {
  margin-top: 15px;
  padding: 15px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.task-progress-section:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #343a40;
  display: flex;
  align-items: center;
  gap: 6px;
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
  font-size: 1rem;
  font-weight: bold;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 4px 12px;
  border-radius: 20px;
  min-width: 50px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-bar-container {
  height: 12px;
  background: #edf2f7;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 10px;
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
  gap: 8px;
  font-size: 0.8rem;
  color: #6c757d;
}

.progress-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px;
  background: rgba(248, 249, 250, 0.7);
  border-radius: 6px;
  transition: all 0.3s ease;
}

.progress-stat:hover {
  background: rgba(233, 236, 239, 0.9);
  transform: translateY(-1px);
}

.progress-stat i {
  font-size: 0.9rem;
  margin-bottom: 2px;
}

/* 成员卡片中进度条的特殊样式 */
.member-card .task-progress-section {
  margin-top: 10px;
  padding: 12px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .task-progress-section {
    padding: 12px;
  }
  
  .progress-stats {
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
  
  .progress-stat {
    font-size: 0.75rem;
    padding: 4px;
  }
  
  .progress-percentage {
    font-size: 0.9rem;
    padding: 3px 10px;
  }
}

/* 任务完成时间相关样式 */
.completion-time-input {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 6px 10px;
  background: #f5f5f5;
  border-radius: 6px;
}

.completion-time-input label {
  font-size: 0.85rem;
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

.btn-save-time {
  padding: 4px 12px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-save-time:hover:not(:disabled) {
  background: #1557b0;
}

.btn-save-time:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.completion-time-display {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 6px 10px;
  background: #e8f5e8;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #2e7d32;
}

.completion-time-display i {
  font-size: 0.8rem;
}

/* 任务统计信息 */
.task-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 15px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 0.75rem;
  color: #666;
}

.stat-value {
  font-size: 0.9rem;
  font-weight: bold;
}

.efficiency-high {
  color: #34a853;
}

.efficiency-good {
  color: #f9ab00;
}

.efficiency-normal {
  color: #ea4335;
}

.efficiency-low {
  color: #999;
}

/* 无数据图表样式 */
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

/* 整体进度条 */
.overall-progress {
  margin-top: 20px;
  padding: 15px;
  background: var(--light);
  border-radius: 10px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.progress-bar-container {
  height: 10px;
  background: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  border-radius: 5px;
  transition: width 0.5s ease;
}

/* 任务监督 */
.edit-tasks-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: var(--primary);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;
}

.edit-tasks-btn:hover {
  background: #1557b0;
}

.task-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.task-column h4 {
  margin-bottom: 15px;
  color: var(--primary);
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  background: var(--my-task-bg);
  border-radius: 10px;
  position: relative;
}

.task-item.partner-task {
  background: var(--partner-task-bg);
}

.task-item.incomplete {
  background-color: white;
}

.task-info {
  flex: 1;
  min-width: 0;
}

/* 任务操作按钮 */
.task-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.task-item:hover .task-actions {
  opacity: 1;
}

.edit-task-btn, .delete-task-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  transition: all 0.3s ease;
}

.edit-task-btn {
  background: #e3f2fd;
  color: #1976d2;
}

.edit-task-btn:hover {
  background: #bbdefb;
}

.delete-task-btn {
  background: #ffebee;
  color: #d32f2f;
}

.delete-task-btn:hover {
  background: #ffcdd2;
}

/* 审核加入请求样式 */
.join-requests-list {
  max-height: 400px;
  overflow-y: auto;
}

.join-request-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid var(--border);
  border-radius: 10px;
  margin-bottom: 15px;
  background: white;
}

.request-user-info {
  display: flex;
  gap: 12px;
  flex: 1;
}

.request-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
}

.request-details h4 {
  margin: 0 0 5px 0;
  color: var(--dark);
}

.request-details p {
  margin: 0 0 8px 0;
  color: var(--gray);
  font-size: 0.9rem;
}

.request-time {
  font-size: 0.8rem;
  color: var(--gray);
}

.request-actions {
  display: flex;
  gap: 10px;
}

.approve-btn, .reject-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;
}

.approve-btn {
  background: #e8f5e8;
  color: #2e7d32;
}

.approve-btn:hover {
  background: #c8e6c9;
}

.reject-btn {
  background: #ffebee;
  color: #d32f2f;
}

.reject-btn:hover {
  background: #ffcdd2;
}

/* 状态选择器样式 */
.task-status-selector {
  flex-shrink: 0;
}

.status-select {
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: white;
  font-size: 12px;
  cursor: pointer;
  min-width: 80px;
}

.status-select:focus {
  outline: none;
  border-color: var(--primary);
}

/* 不同状态的任务项样式 */
.task-item.status-pending {
  border-left: 4px solid #ff9800;
  background: #fff3e0;
}

.task-item.status-in_progress {
  border-left: 4px solid #2196f3;
  background: #e3f2fd;
}

.task-item.status-completed {
  border-left: 4px solid #4caf50;
  background: #e8f5e8;
}

/* 保留原有的复选框样式（用于伙伴任务） */
.task-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: bold;
}

.task-checkbox.checked {
  background: var(--secondary);
  border-color: var(--secondary);
  color: white;
}

.task-info {
  flex: 1;
  min-width: 150px;
}

.task-meta {
  font-size: 0.8rem;
  color: var(--gray);
  margin-top: 4px;
}

/* 评论区 - 商业化风格 */
/* 留言区样式 */
.board-wrapper {
  max-width: 1200px;
  margin: 30px auto 40px;
  padding: 0 20px;
}

.board-card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 12px 35px rgba(15, 23, 42, 0.12);
  padding: 26px 28px;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.board-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.2rem;
  font-weight: 700;
  color: #1e3a8a;
}

.board-title i {
  color: #2563eb;
  font-size: 1.3rem;
}

.board-history-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(37,99,235,0.3);
  color: #1d4ed8;
  padding: 6px 14px;
  border-radius: 999px;
  background: #eef2ff;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.25s ease;
}

.board-history-btn:hover {
  background: #dbeafe;
  border-color: rgba(37,99,235,0.45);
}

.board-form {
  background: #f8fafc;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.05);
  padding: 20px;
  margin-bottom: 22px;
}

.board-input {
  width: 100%;
  border: 1px solid rgba(37,99,235,0.25);
  border-radius: 10px;
  padding: 12px 14px;
  resize: vertical;
  font-size: 0.95rem;
  font-family: inherit;
  transition: all 0.2s ease;
  background: #fff;
}

.board-input:focus {
  outline: none;
  border-color: rgba(37,99,235,0.65);
  box-shadow: 0 0 0 3px rgba(37,99,235,0.18);
}

.board-form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.board-tip {
  font-size: 0.8rem;
  color: #64748b;
}

.board-submit {
  padding: 9px 22px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.board-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(37,99,235,0.25);
}

.board-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.board-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.board-item {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  padding: 16px 18px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.06);
}

.board-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
}

.board-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
}

.board-avatar.partner {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}

.board-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.board-name-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.board-name {
  font-weight: 600;
  color: #1e293b;
}

.board-badge {
  background: #1d4ed8;
  color: #fff;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 0.75rem;
}

.board-time {
  font-size: 0.8rem;
  color: #64748b;
}

.board-content {
  margin: 0;
  color: #1f2937;
  line-height: 1.6;
  font-size: 0.95rem;
  word-break: break-word;
}

.board-more {
  margin: 6px auto 0;
  border: 1px solid rgba(37,99,235,0.3);
  background: transparent;
  color: #1d4ed8;
  border-radius: 999px;
  padding: 8px 22px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.board-more:hover {
  background: #dbeafe;
}

.board-empty {
  text-align: center;
  color: #94a3b8;
  padding: 50px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.board-empty i {
  font-size: 2.3rem;
}

/* 加载更多按钮 */
.load-more-btn {
  width: 100%;
  padding: 14px;
  margin-top: 16px;
  background: white;
  border: 2px dashed #e9ecef;
  border-radius: 8px;
  color: var(--primary);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.load-more-btn:hover {
  background: var(--primary-light);
  border-color: var(--primary);
  border-style: solid;
}

/* 空状态 */
.empty-comments {
  text-align: center;
  padding: 60px 20px;
  color: var(--gray);
}

.empty-comments i {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.3;
}

.empty-comments p {
  font-size: 0.95rem;
  margin: 0;
}

/* 旧样式保留（兼容） */
.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: 600;
  color: var(--dark);
  font-size: 0.9rem;
}

.comment-time {
  font-size: 0.8rem;
  color: var(--gray);
}

.comment-text {
  line-height: 1.5;
  color: var(--dark);
  font-size: 0.9rem;
}

.expand-today-btn {
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--primary);
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.expand-today-btn:hover {
  background: var(--primary-light);
  border-color: var(--primary);
}

.view-comments-btn {
  background: transparent;
  border: 1px solid var(--primary);
  color: var(--primary);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.view-comments-btn:hover {
  background: var(--primary);
  color: white;
}

/* 提醒按钮样式 */
.remind-btn {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s ease;
  margin-left: auto;
}

.remind-btn:hover {
  background: #ffeaa7;
  border-color: #f39c12;
  color: #b7791f;
}

.remind-btn i {
  font-size: 0.7rem;
}

/* 其他样式继续保持原有的设计 */
.right-column .content-section {
  margin-bottom: 20px;
}

.partner-info {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.partner-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--secondary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
}

.partner-details h4 {
  margin: 0 0 5px 0;
  font-size: 1.1rem;
}

.partner-details p {
  margin: 0;
  color: var(--gray);
  font-size: 0.9rem;
}

.partner-stats {
  display: flex;
  justify-content: space-between;
  background: var(--light);
  padding: 15px;
  border-radius: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--gray);
}

.stat-value {
  font-weight: bold;
  color: var(--primary);
  font-size: 1.1rem;
}

/* 任务统计卡片 */
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

/* 任务计数 */
.task-count {
  font-size: 0.9rem;
  color: var(--gray);
  font-weight: normal;
  margin-left: 8px;
}

/* 任务项优化 */
.task-info {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-weight: 600;
  margin-bottom: 4px;
  word-break: break-word;
}

.task-title.completed {
  text-decoration: line-through;
  color: #666;
}

.task-description {
  font-size: 0.85rem;
  color: #666;
  margin: 5px 0;
  line-height: 1.4;
}

/* 优先级徽章 */
.priority-badge {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
  font-weight: 500;
}

.priority-badge.high {
  background: #ffebee;
  color: #d32f2f;
}

.priority-badge.medium {
  background: #fff3e0;
  color: #ff9800;
}

.priority-badge.low {
  background: #e8f5e8;
  color: #388e3c;
}

/* 状态徽章 */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  padding: 3px 8px;
  border-radius: 4px;
  margin-top: 5px;
}

.status-badge.completed {
  background: #e8f5e8;
  color: #2e7d32;
}

.status-badge.pending {
  background: #fff3e0;
  color: #ff9800;
}

/* 复选框优化 */
.task-checkbox.checked {
  background: #34a853;
  border-color: #34a853;
}

.task-checkbox.checked i {
  opacity: 1;
}

.task-checkbox.readonly.checked {
  background: #34a853;
  border-color: #34a853;
}

.task-checkbox.readonly {
  cursor: default;
}

.task-checkbox.readonly:hover {
  border-color: var(--border);
}

/* 进度条样式优化 */
.task-progress-section {
  margin-top: 15px;
  padding: 15px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.progress-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  font-size: 0.85rem;
  margin-top: 10px;
}

.progress-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: white;
  border-radius: 6px;
  border: 1px solid rgba(0,0,0,0.05);
}

.progress-stat i {
  font-size: 0.9rem;
  margin-bottom: 2px;
}

.tasklist-section {
  padding: 24px 28px;
  border-radius: 16px;
  background: #fff;
}

.tasklist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.task-card.partner {
  background: #ecfdf5;
  border-color: #16a34a;
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

.task-status-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255,255,255,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  color: #1e3a8a;
}

.task-info-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-card-title {
  font-weight: 600;
  font-size: 1rem;
  color: #0f172a;
}

.task-card-meta {
  font-size: 0.85rem;
  color: #64748b;
}

.task-card-action {
  border: none;
  border-radius: 999px;
  padding: 8px 18px;
  background: rgba(37,99,235,0.12);
  color: #1d4ed8;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.task-card-action:hover {
  background: rgba(37,99,235,0.2);
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

.achievements {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--light);
  border-radius: 10px;
}

.achievement-icon {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
}

.achievement-title {
  font-weight: 600;
  margin-bottom: 2px;
}

.achievement-desc {
  font-size: 0.8rem;
  color: var(--gray);
}

/* 模态框样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 15px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
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

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--dark);
  font-size: 0.9rem;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  transition: border-color 0.3s ease;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.1);
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

.search-form, .add-task-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.search-results {
  max-height: 300px;
  overflow-y: auto;
  margin-top: 20px;
}

.empty-placeholder {
  text-align: center;
  color: var(--gray);
  padding: 40px 20px;
  font-style: italic;
}

.search-result-item {
  padding: 15px;
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 10px;
  background: white;
  transition: all 0.3s ease;
}

.search-result-item:hover {
  background: var(--light);
  border-color: var(--primary);
}

.history-task-title {
  font-weight: 500;
  margin-bottom: 5px;
}

.history-task-meta {
  font-size: 0.8rem;
  color: var(--gray);
}

.add-task-btn, .view-all-btn, .search-tasks-btn {
  background: var(--primary);
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.add-task-btn:hover, .view-all-btn:hover {
  background: #1557b0;
  transform: translateY(-1px);
}

.search-tasks-btn {
  background: transparent;
  border: 1px solid var(--primary);
  color: var(--primary);
  margin-left: 8px;
}

.search-tasks-btn:hover {
  background: var(--primary);
  color: white;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--gray);
}

.stat-value {
  font-weight: bold;
  color: var(--primary);
  font-size: 1.1rem;
}

/* 任务复选框样式 */
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

.task-checkbox:hover:not(.readonly) {
  border-color: var(--primary);
  background: var(--primary-light);
}

.task-checkbox i {
  font-size: 12px;
  color: white;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.task-completed .task-checkbox {
  background: var(--primary);
  border-color: var(--primary);
}

.task-completed .task-checkbox i {
  opacity: 1;
}

.task-checkbox.readonly {
  cursor: default;
  background: #f5f5f5;
}

.task-checkbox.readonly:hover {
  border-color: var(--border);
  background: #f5f5f5;
}

/* 任务项完成状态样式 */
.task-item.task-completed {
  background: #e8f5e8;
  border-left: 4px solid #4caf50;
}

.task-item.task-completed .task-title {
  text-decoration: line-through;
  color: #666;
}

/* 快速完成按钮 */
.quick-complete-btn {
  padding: 4px 12px;
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

.task-card-action {
  border: none;
  border-radius: 999px;
  padding: 8px 18px;
  background: linear-gradient(135deg, #ff9800, #ff5722);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.task-card-action:hover {
  background: linear-gradient(135deg, #f57c00, #e64a19);
  transform: translateY(-1px);
}

/* 任务清单卡片完成状态 */
.task-card.task-completed {
  background: #f1f5f9;
  border-color: #22c55e;
}

.task-card.task-completed .task-card-title {
  text-decoration: line-through;
  color: #64748b;
}

/* 新增的预计时间输入 */
.completion-time-input {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 0.85rem;
}

.completion-time-input label {
  color: #666;
}

.completion-time-input input {
  width: 50px;
  padding: 2px 6px;
  border: 1px solid #ddd;
  border-radius: 3px;
  text-align: center;
}

.task-status-text {
  margin-top: 8px;
  font-size: 0.85rem;
  color: #666;
  font-style: italic;
}

/* 修改任务清单统计 */
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

/* 任务清单样式 */
.add-task-btn, .view-all-btn, .expand-comments-btn {
  background: var(--primary);
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.add-task-btn:hover, .view-all-btn:hover, .expand-comments-btn:hover {
  background: #1557b0;
  transform: translateY(-1px);
}

.search-tasks-btn {
  background: transparent;
  border: 1px solid var(--primary);
  color: var(--primary);
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  margin-left: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.search-tasks-btn:hover {
  background: var(--primary);
  color: white;
}

.task-summary {
  display: flex;
  justify-content: space-between;
  background: var(--light);
  padding: 15px;
  border-radius: 10px;
}

.task-summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.task-count {
  font-size: 0.8rem;
  color: var(--gray);
}

.task-number {
  font-weight: bold;
  font-size: 1.2rem;
  color: var(--primary);
}

/* 成就样式 */
.achievements {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--light);
  border-radius: 10px;
}

.achievement-icon {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
}

.achievement-title {
  font-weight: 600;
  margin-bottom: 2px;
}

.achievement-desc {
  font-size: 0.8rem;
  color: var(--gray);
}

/* 模态框样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 15px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
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

/* 表单样式 */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--dark);
  font-size: 0.9rem;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  transition: border-color 0.3s ease;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.1);
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

.search-form, .add-task-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.search-results {
  max-height: 300px;
  overflow-y: auto;
  margin-top: 20px;
}

.empty-placeholder {
  text-align: center;
  color: var(--gray);
  padding: 40px 20px;
  font-style: italic;
}

.search-result-item {
  padding: 15px;
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 10px;
  background: white;
  transition: all 0.3s ease;
}

.search-result-item:hover {
  background: var(--light);
  border-color: var(--primary);
}

.history-task-title {
  font-weight: 500;
  margin-bottom: 5px;
}

.history-task-meta {
  font-size: 0.8rem;
  color: var(--gray);
}
</style>