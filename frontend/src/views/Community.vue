<template>
  <div class="community">
    <!-- 社区头部 -->
    <section class="community-header">
      <div class="container">
        <h1>学习社区</h1>
        <p>与志同道合的学习者一起进步，在交流中成长，在互助中提升</p>
      </div>
    </section>

    <div class="container">
      <!-- 顶部状态 -->
      <div class="status-bar">
        <span>当前用户：{{ currentUserName }} (ID: {{ currentUserId }})</span>
        <span>
          服务状态：
          <span v-if="healthStatus.overall === 'ok'" class="status-ok">正常</span>
          <span v-else-if="healthStatus.overall" class="status-error">异常</span>
          <span v-else>未检测</span>
        </span>
        <button class="btn btn-secondary status-btn" @click="checkHealth">检查后端接口</button>
      </div>

      <!-- 标签页 -->
      <div class="tabs">
        <div
          class="tab"
          :class="{ active: activeTab === 'teams' }"
          @click="switchTab('teams')"
        >
          组队学习
        </div>
        <div
          class="tab"
          :class="{ active: activeTab === 'study-rooms' }"
          @click="switchTab('study-rooms')"
        >
          自习室
        </div>
        <div
          class="tab"
          :class="{ active: activeTab === 'discussion' }"
          @click="switchTab('discussion')"
        >
          公共讨论区
        </div>
        <div
          class="tab"
          :class="{ active: activeTab === 'teachers' }"
          @click="switchTab('teachers')"
        >
          名师答疑
        </div>
        <div
          class="tab"
          :class="{ active: activeTab === 'help' }"
          @click="switchTab('help')"
        >
          互助学习
        </div>
      </div>

      <!-- 组队学习 -->
      <section v-show="activeTab === 'teams'" class="content-section">
        <div class="section-title">
          <span>组队学习</span>
          <div class="section-actions">
            <select v-model="teamFilterCourseId" class="btn btn-secondary select">
              <option :value="null">全部课程</option>
              <option
                v-for="c in availableData.courses"
                :key="c.course_id"
                :value="c.course_id"
              >
                {{ c.course_name }}
              </option>
            </select>
            <button class="btn btn-primary" @click="openCreateTeamForm">
              <i class="fas fa-plus"></i>
              创建学习小组
            </button>
          </div>
        </div>

        <!-- 创建小组表单 -->
        <div v-if="createForms.team.show" class="create-form">
          <h3>创建学习小组</h3>
          <div class="form-group">
            <label>小组名称:</label>
            <input v-model="createForms.team.team_name" class="input full" placeholder="请输入小组名称" />
          </div>
          <div class="form-group">
            <label>小组描述:</label>
            <textarea v-model="createForms.team.description" class="textarea" placeholder="请输入小组描述"></textarea>
          </div>
          <div class="form-group">
            <label>关联课程:</label>
            <select v-model="createForms.team.course_id" class="input full">
              <option :value="null">不关联课程</option>
              <option
                v-for="c in availableData.courses"
                :key="c.course_id"
                :value="c.course_id"
              >
                {{ c.course_name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>最大成员数:</label>
            <input v-model.number="createForms.team.max_members" type="number" class="input" min="2" max="50" />
          </div>
          <div class="form-group">
            <label>标签(逗号分隔):</label>
            <input v-model="createForms.team.tags" class="input full" placeholder="例如: 编程,学习,互助" />
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" @click="createTeam">创建</button>
            <button class="btn btn-secondary" @click="createForms.team.show = false">取消</button>
          </div>
        </div>

        <div class="team-grid">
          <div
            class="team-card"
            v-for="team in teams"
            :key="team.team_id"
            @click="viewTeamDetail(team)"
          >
            <div class="team-header">
              <div class="team-avatar">
                {{ (team.team_name && team.team_name[0]) || '组' }}
              </div>
              <div class="team-info">
                <h3>{{ team.team_name }}</h3>
                <div class="team-days">
                  已运行 {{ calcRunningDays(team.create_time) }} 天
                </div>
              </div>
            </div>
            <p class="team-desc">{{ team.description }}</p>
            <div class="team-tags">
              <span class="tag" v-for="tag in team.tags" :key="tag">{{ tag }}</span>
            </div>
            <div class="team-stats">
              <span>👥 {{ team.member_count }}/{{ team.max_members }} 人</span>
              <span>创建者：{{ team.creator_name }}</span>
            </div>
            <div class="team-stats team-btn-row">
              <button class="btn btn-primary btn-small" @click.stop="joinTeam(team)">
                加入
              </button>
              <button class="btn btn-secondary btn-small" @click.stop="leaveTeam(team)">
                退出
              </button>
              <!-- 只有创建者能看到删除按钮 -->
              <button 
                v-if="team.is_owner" 
                class="btn btn-secondary btn-small" 
                @click.stop="deleteTeam(team)"
              >
                删除
              </button>
            </div>
          </div>
        </div>

        <!-- 小组详情 & 任务 -->
        <div v-if="selectedTeam" class="section-detail">
          <h3>当前小组：{{ selectedTeam.team_name }}</h3>
          <p class="detail-desc">{{ selectedTeam.description }}</p>
          <p class="detail-meta">
            成员：{{ selectedTeam.current_members }}/{{ selectedTeam.max_members }}
          </p>

          <h4 class="sub-title">小组任务</h4>
          <div
            v-if="teamTasks.length === 0"
            class="empty-tip"
          >
            暂无任务，可点击下方按钮创建示例任务。
          </div>
          <div v-else class="help-requests">
            <div class="help-card" v-for="task in teamTasks" :key="task.task_id">
              <div class="help-avatar">任</div>
              <div class="help-content">
                <div class="help-title">{{ task.task_title }}</div>
                <p class="help-text">{{ task.task_content }}</p>
                <div class="help-meta">
                  <span>创建人：{{ task.creator_name }}</span>
                  <span>截止：{{ formatDate(task.deadline) }}</span>
                  <span>状态：{{ task.status }}</span>
                </div>
                <div class="help-actions">
                  <button
                    class="btn btn-secondary btn-small"
                    @click="updateTaskStatus(task, 'completed')"
                  >
                    标记完成
                  </button>
                  <button
                    class="btn btn-secondary btn-small"
                    @click="deleteTask(task)"
                  >
                    删除任务
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 创建任务 -->
          <div class="task-create">
            <h4 class="sub-title">创建示例任务</h4>
            <div class="task-input-row">
              <input
                v-model="newTask.task_title"
                placeholder="任务标题"
                class="input"
              />
              <input
                v-model="newTask.deadline"
                placeholder="截止日期(ISO，留空默认当前时间)"
                class="input"
              />
            </div>
            <textarea
              v-model="newTask.task_content"
              placeholder="任务内容"
              class="textarea"
            ></textarea>
            <button class="btn btn-primary" @click="createTaskForTeam">
              创建任务
            </button>
          </div>
        </div>
      </section>

      <!-- 自习室 -->
      <section v-show="activeTab === 'study-rooms'" class="content-section">
        <div class="section-title">
          <span>自习室</span>
          <button class="btn btn-primary" @click="openCreateRoomForm">
            <i class="fas fa-plus"></i>
            创建自习室
          </button>
        </div>

        <!-- 创建自习室表单 -->
        <div v-if="createForms.room.show" class="create-form">
          <h3>创建自习室</h3>
          <div class="form-group">
            <label>自习室名称:</label>
            <input v-model="createForms.room.room_name" class="input full" placeholder="请输入自习室名称" />
          </div>
          <div class="form-group">
            <label>自习室描述:</label>
            <textarea v-model="createForms.room.description" class="textarea" placeholder="请输入自习室描述"></textarea>
          </div>
          <div class="form-group">
            <label>最大参与人数:</label>
            <input v-model.number="createForms.room.max_members" type="number" class="input" min="1" max="200" />
          </div>
          <div class="form-group">
            <label>开放时间:</label>
            <input v-model="createForms.room.schedule_time" class="input full" placeholder="例如: 09:00-21:00" />
          </div>
          <div class="form-group">
            <label>自习室规则:</label>
            <textarea v-model="createForms.room.rules" class="textarea" placeholder="请输入自习室规则"></textarea>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" @click="createRoom">创建</button>
            <button class="btn btn-secondary" @click="createForms.room.show = false">取消</button>
          </div>
        </div>

        <div class="study-rooms">
          <div
            class="room-card"
            v-for="room in rooms"
            :key="room.room_id"
            @click="viewRoomDetail(room)"
          >
            <div class="room-header">
              <div class="room-title">{{ room.room_name }}</div>
              <div class="room-meta">
                <span>👥 {{ room.member_count || 0 }}/{{ room.max_members || 50 }}</span>
                <span>创建者：{{ room.creator_name }}</span>
              </div>
            </div>
            <p class="room-desc">{{ room.description }}</p>
            <div class="room-participants">
              <div class="participants-list">
                <div
                  class="participant"
                  v-for="m in (room.members || []).slice(0, 3)"
                  :key="m.user_id"
                >
                  {{ m.user_name && m.user_name[0] }}
                </div>
                <div
                  v-if="room.member_count > 3"
                  class="participant"
                >
                  +{{ room.member_count - 3 }}
                </div>
              </div>
            </div>
            <div class="room-actions">
              <button
                class="btn btn-primary btn-small flex-1"
                @click.stop="joinRoom(room)"
              >
                <i class="fas fa-door-open"></i>
                加入自习
              </button>
              <button
                class="btn btn-secondary btn-small flex-1"
                @click.stop="leaveRoom(room)"
              >
                退出
              </button>
              <!-- 只有创建者能看到删除按钮 -->
              <button
                v-if="room.is_owner"
                class="btn btn-secondary btn-small flex-1"
                @click.stop="deleteRoom(room)"
              >
                删除
              </button>
            </div>
          </div>
        </div>

        <!-- 自习室详情 + 留言 -->
        <div v-if="selectedRoom" class="section-detail">
          <h3>当前自习室：{{ selectedRoom.room_name }}</h3>
          <p class="detail-meta">
            当前人数：{{ selectedRoom.current_members }}/{{ selectedRoom.max_members }}
          </p>

          <h4 class="sub-title">自习室留言</h4>
          <div class="discussion-feed room-feed">
            <div class="post" v-for="msg in roomMessages" :key="msg.message_id">
              <div class="post-header">
                <div class="post-avatar">
                  {{ msg.user_name && msg.user_name[0] }}
                </div>
                <div class="post-user">{{ msg.user_name }}</div>
                <div class="post-time">{{ formatDate(msg.create_time) }}</div>
              </div>
              <div class="post-content">
                <p>{{ msg.content }}</p>
              </div>
              <div class="post-actions">
                <!-- 只有留言作者能看到删除按钮 -->
                <div 
                  v-if="msg.user_id === currentUserId" 
                  class="post-action" 
                  @click="deleteMessage(msg)"
                >
                  <i class="fas fa-trash"></i>
                  删除
                </div>
              </div>
            </div>
          </div>

          <div class="post post-create">
            <textarea
              class="post-input"
              v-model="newMessage.content"
              placeholder="在自习室中和大家打个招呼吧~"
            ></textarea>
            <div class="post-footer">
              <button class="btn btn-primary" @click="createMessage">
                <i class="fas fa-paper-plane"></i>
                发布留言
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 公共讨论区 -->
      <section v-show="activeTab === 'discussion'" class="content-section">
        <div class="section-title">
          <span>公共讨论区</span>
          <button class="btn btn-primary" @click="createDiscussionPostExample">
            <i class="fas fa-edit"></i>
            发布示例帖子
          </button>
        </div>

        <div class="discussion-feed">
          <div class="post" v-for="post in discussionPosts" :key="post.post_id">
            <div class="post-header">
              <div class="post-avatar">
                {{ post.user_name && post.user_name[0] }}
              </div>
              <div class="post-user">{{ post.user_name }}</div>
              <div class="post-time">{{ formatDate(post.create_time) }}</div>
            </div>
            <div class="post-content">
              <h4>{{ post.title }}</h4>
              <p>{{ post.content }}</p>
            </div>
           <div class="post-actions">
            <div class="post-action" @click="togglePostLike(post)">
              <i :class="post.user_has_liked ? 'fas fa-thumbs-up' : 'far fa-thumbs-up'"></i>
              <span>{{ post.like_count || 0 }}</span>
            </div>
          <div class="post-action" @click="toggleComments(post)">
              <i class="far fa-comment"></i>
              <!-- 确保显示正确的评论数 -->
              <span>{{ post.comment_count || 0 }}</span>
          </div>
          <!-- 只有帖子作者能看到删除按钮 -->
          <div 
              v-if="post.user_id === currentUserId" 
              class="post-action" 
              @click="deleteDiscussionPost(post)"
          >
              <i class="fas fa-trash"></i>
              删除
          </div>
      </div>

            <!-- 评论列表 -->
            <div v-if="post.showComments" class="comment-list">
              <div
                class="comment-item"
                v-for="c in commentsByPost[post.post_id] || []"
                :key="c.comment_id"
              >
                <div class="comment-meta">
                  <span>{{ c.user_name }}</span>
                  <span>{{ formatDate(c.create_time) }}</span>
                </div>
                <div class="comment-text">{{ c.content }}</div>
                <div class="post-actions">
                  <div class="post-action" @click="toggleCommentLike(c)">
                    <i
                      :class="c.user_has_liked ? 'fas fa-thumbs-up' : 'far fa-thumbs-up'"
                    ></i>
                    <span>{{ c.like_count }}</span>
                  </div>
                  <!-- 只有评论作者能看到删除按钮 -->
                  <div 
                    v-if="c.user_id === currentUserId" 
                    class="post-action" 
                    @click="deleteComment(c)"
                  >
                    <i class="fas fa-trash"></i>
                    删除
                  </div>
                </div>
              </div>

              <!-- 发表评论 -->
              <div class="comment-create">
                <textarea
                  class="post-input small"
                  :placeholder="'回复 ' + (post.title || '该帖子')"
                  v-model="newCommentContent[post.post_id]"
                ></textarea>
                <div class="post-footer">
                  <button class="btn btn-primary" @click="createComment(post)">
                    发表评论
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 发帖区域（真正发帖） -->
          <div class="post post-create">
            <input
              class="input full"
              v-model="newPost.title"
              placeholder="帖子标题"
            />
            <textarea
              class="post-input"
              v-model="newPost.content"
              placeholder="分享你的学习心得或提出问题..."
            ></textarea>
            <div class="post-bottom-row">
              <input
                class="input flex-1"
                v-model="newPost.tags"
                placeholder="标签（逗号分隔，如：Python,进阶）"
              />
              <button class="btn btn-primary" @click="createDiscussionPostReal">
                <i class="fas fa-paper-plane"></i>
                发布
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 名师答疑 -->
      <section v-show="activeTab === 'teachers'" class="content-section">
        <div class="section-title">
          <span>名师答疑</span>
          <button class="btn btn-primary" @click="createTeacherQuestion">
            <i class="fas fa-question-circle"></i>
            我要提问
          </button>
        </div>

        <!-- 名师列表 -->
        <div class="instructor-grid">
          <div class="instructor-card" v-for="teacher in topTeachers" :key="teacher.user_id">
            <div class="instructor-media">
              <div class="instructor-avatar" v-if="teacher.avatar">
                <img :src="getAvatarUrl(teacher.avatar)" alt="avatar" />
              </div>
              <div class="instructor-avatar" v-else>
                <i class="fas fa-user"></i>
              </div>
            </div>
            <div class="instructor-body">
              <div class="instructor-name">{{ teacher.user_name }}</div>
              <div class="instructor-desc">{{ teacher.user_intro || '暂无简介' }}</div>
              <div class="instructor-stats">
                <div class="stat">
                  <span class="stat-label">学生</span>
                  <span class="stat-value">{{ teacher.total_students || 0 }}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">课程</span>
                  <span class="stat-value">{{ teacher.course_count || 0 }}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">评分</span>
                  <span class="stat-value">{{ teacher.avg_rating ? Number(teacher.avg_rating).toFixed(1) : '-' }}</span>
                </div>
              </div>
              <button class="btn btn-primary btn-full" @click="askTeacher(teacher)">
                <i class="fas fa-comment-dots"></i>
                向TA提问
              </button>
            </div>
          </div>
        </div>

        <!-- 问答列表 -->
        <div class="qa-section" v-if="qaTeachers.length > 0">
          <h3 class="sub-title">最新问答</h3>
          <div class="qa-list">
            <div class="qa-card" v-for="t in qaTeachers" :key="t.post_id">
              <div class="qa-header">
                <div class="qa-avatar">{{ t.user_name && t.user_name[0] }}</div>
                <div class="qa-info">
                  <div class="qa-user">{{ t.user_name }}</div>
                  <div class="qa-course">{{ t.course_name }}</div>
                </div>
                <div class="qa-status" :class="t.status === 'closed' ? 'solved' : 'unsolved'">
                  {{ t.status === 'closed' ? '已解决' : '待解决' }}
                </div>
              </div>
              <div class="qa-content">
                <h4>{{ t.title }}</h4>
                <p>{{ t.content }}</p>
              </div>
              <div class="qa-footer">
                <div class="qa-stats">
                  <span><i class="fas fa-thumbs-up"></i> {{ t.like_count || 0 }}</span>
                  <span><i class="fas fa-comment"></i> {{ t.comment_count || 0 }}</span>
                </div>
                <div class="qa-actions">
                  <button class="btn btn-secondary btn-small" @click="openQaPost(t)">
                    查看详情
                  </button>
                  <button
                    v-if="!t.is_solved && t.is_owner"
                    class="btn btn-secondary btn-small"
                    @click="markSolved(t)"
                  >
                    标记已解决
                  </button>
                  <button
                    v-if="t.is_owner"
                    class="btn btn-secondary btn-small"
                    @click="deleteQAPost(t)"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 互助学习 -->
      <section v-show="activeTab === 'help'" class="content-section">
        <div class="section-title">
          <span>互助学习</span>
          <button class="btn btn-primary" @click="createHelpPost">
            <i class="fas fa-hands-helping"></i>
            我要发起互助
          </button>
        </div>

        <div class="help-requests">
          <div class="help-card" v-for="h in qaHelp" :key="h.post_id">
            <div class="help-avatar">
              {{ h.user_name && h.user_name[0] }}
            </div>
            <div class="help-content">
              <div class="help-title">{{ h.title }}</div>
              <p class="help-text">{{ h.content }}</p>
              <div class="help-meta">
                <span>课程：{{ h.course_name }}</span>
                <span>回答数：{{ h.comment_count || 0 }}</span>
                <span>
                  状态：
                  <span :class="h.status === 'closed' ? 'status-solved' : 'status-unsolved'">
                    {{ h.status === 'closed' ? '已解决' : '待解决' }}
                  </span>
                </span>
              </div>
              
              <!-- 回答区域 -->
              <div class="help-actions">
                <!-- 只有不是帖子作者才能回答 -->
                <button 
                  v-if="!h.is_owner" 
                  class="btn btn-primary btn-small" 
                  @click="openAnswerInput(h)"
                >
                  <i class="fas fa-reply"></i>
                  回答
                </button>
                <button class="btn btn-secondary btn-small" @click="toggleHelpAnswers(h)">
                  <i class="fas fa-comments"></i>
                  {{ h.showAnswers ? '隐藏回答' : '查看回答' }} ({{ h.comment_count || 0 }})
                </button>
                <button 
                  v-if="h.is_owner && h.status !== 'closed'" 
                  class="btn btn-secondary btn-small" 
                  @click="markHelpSolved(h)"
                >
                  <i class="fas fa-check"></i>
                  标记解决
                </button>
                <button 
                  v-if="h.is_owner"
                  class="btn btn-secondary btn-small" 
                  @click="deleteQAPost(h)"
                >
                  <i class="fas fa-trash"></i>
                  删除
                </button>
              </div>

              <!-- 回答输入框 -->
              <div v-if="h.showAnswerInput" class="answer-input-section">
                <textarea
                  v-model="newHelpAnswer"
                  class="post-input small"
                  placeholder="请输入您的回答..."
                  rows="3"
                ></textarea>
                <div class="answer-input-actions">
                  <button class="btn btn-primary" @click="submitHelpAnswer(h)">
                    提交回答
                  </button>
                  <button class="btn btn-secondary" @click="h.showAnswerInput = false">
                    取消
                  </button>
                </div>
              </div>

              <!-- 回答列表 -->
<div v-if="h.showAnswers" class="answers-list">
  <!-- 加载状态 -->
  <div v-if="helpAnswers[h.post_id] === undefined" class="empty-tip">
    ⏳ 加载中...
  </div>
  <!-- 空数据状态 -->
  <div v-else-if="!helpAnswers[h.post_id] || helpAnswers[h.post_id].length === 0" class="empty-tip">
    📝 暂无回答
  </div>
  <!-- 有数据状态 -->
  <div v-else class="answers">
    <div 
      class="answer-item" 
      v-for="answer in helpAnswers[h.post_id]" 
      :key="answer.comment_id"
    >
      <div class="answer-header">
        <div class="answer-avatar">{{ (answer.user_name && answer.user_name[0]) || '匿' }}</div>
        <div class="answer-user">{{ answer.user_name || '匿名用户' }}</div>
        <div class="answer-time">{{ formatDate(answer.create_time) }}</div>
      </div>
      <div class="answer-content">{{ answer.content }}</div>
      <div class="answer-actions">
        <button 
          v-if="answer.user_id === currentUserId" 
          class="btn btn-secondary btn-small" 
          @click="deleteHelpAnswer(answer, h)"
        >
          <i class="fas fa-trash"></i>
          删除回答
        </button>
      </div>
    </div>
  </div>
</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 页脚 -->
      <footer class="footer">
        <div class="footer-bottom">
          学习社区 · 用于课程实验的前后端联调示例页面（Vue3 + Vite）
        </div>
      </footer>
    </div>
  </div>
</template>

<script>
const API_BASE = process.env.VUE_APP_API_BASE_URL || 'http://localhost:4000';

export default {
  name: 'App',
  data() {
    return {
      currentUserId: null,
      currentUserName: '',
      activeTab: 'teams',
      
      healthStatus: {
        overall: null,
        app: null,
        db: null,
        stats: null
      },
      
      // 名师列表
      topTeachers: [],
      
      // 互助学习
      helpAnswers: {},
      newHelpAnswer: '',

      availableData: {
        users: [],
        courses: [],
        tags: []
      },

      // 小组
      teams: [],
      teamFilterCourseId: null,
      selectedTeam: null,
      teamTasks: [],
      newTask: {
        task_title: '',
        task_content: '',
        deadline: ''
      },

      // 自习室
      rooms: [],
      selectedRoom: null,
      roomMessages: [],
      newMessage: {
        content: '',
        message_type: 'text'
      },

      // 帖子 & 评论
      discussionPosts: [],
      qaTeachers: [],
      qaHelp: [],
      newPost: {
        title: '',
        content: '',
        tags: '',
        course_id: null
      },
      commentsByPost: {},
      newCommentContent: {},

      // 创建表单
      createForms: {
        team: {
          show: false,
          team_name: '',
          description: '',
          course_id: null,
          max_members: 10,
          tags: ''
        },
        room: {
          show: false,
          room_name: '',
          description: '',
          max_members: 20,
          schedule_time: '',
          rules: ''
        }
      },

      error: null
    };
  },
  mounted() {
    this.initData();
  },
  methods: {
     async apiRequest(path, { method = 'GET', body = null } = {}) {
      try {
        const options = { method, headers: {} };
        if (body) {
          options.headers['Content-Type'] = 'application/json';
          options.body = JSON.stringify(body);
        }
        const res = await fetch(`${API_BASE}${path}`, options);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) {
          throw new Error(data.message || `请求失败: ${res.status}`);
        }
        return data;
      } catch (e) {
        console.error(e);
        this.error = e.message;
        window.alert(e.message);
        throw e;
      }
    },

    async initData() {
      // 首先获取当前用户信息
      this.getCurrentUser();
      
      await Promise.all([
        this.fetchAvailableData(),
        this.fetchTeams(),
        this.fetchRooms(),
        this.fetchDiscussionPosts(),
        this.fetchQATeachers(),
        this.fetchQAHelp(),
        this.fetchTopTeachers()
      ]);
    },

    // 获取当前登录用户信息
    getCurrentUser() {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // 解析JWT token获取用户信息
          const payload = JSON.parse(atob(token.split('.')[1]));
          this.currentUserId = payload.userId;
          this.currentUserName = payload.userName || '用户';
          console.log('当前用户:', { userId: this.currentUserId, userName: this.currentUserName });
        } catch (error) {
          console.error('解析token失败:', error);
          // 如果token无效，设置默认值或重定向到登录页
          this.currentUserId = 1;
          this.currentUserName = '游客';
        }
      } else {
        // 没有token，设置默认值
        this.currentUserId = 1;
        this.currentUserName = '游客';
      }
    },

    switchTab(tab) {
      this.activeTab = tab;
      if (tab === 'teams') this.fetchTeams();
      if (tab === 'study-rooms') this.fetchRooms();
      if (tab === 'discussion') this.fetchDiscussionPosts();
      if (tab === 'teachers') {
        this.fetchTopTeachers();
        this.fetchQATeachers();
      }
      if (tab === 'help') this.fetchQAHelp();
    },

    /* 健康检查 */
    async checkHealth() {
      try {
        const [h, db, stats] = await Promise.all([
          this.apiRequest('/health'),
          this.apiRequest('/health/db'),
          this.apiRequest('/api/stats')
        ]);
        this.healthStatus.app = h.status === 'OK' || h.success !== false;
        this.healthStatus.db = db.status === 'healthy' || db.success !== false;
        this.healthStatus.stats = stats.success !== false;
        this.healthStatus.overall =
          this.healthStatus.app && this.healthStatus.db && this.healthStatus.stats
            ? 'ok'
            : 'error';
        window.alert(
          '健康检查完成：' +
            (this.healthStatus.overall === 'ok' ? '正常' : '存在问题')
        );
      } catch (e) {
        this.healthStatus.overall = 'error';
      }
    },

    /* 公共数据 */
    async fetchAvailableData() {
      const data = await this.apiRequest(
        '/api/community/teams/available-data'
      );
      this.availableData = data.data || this.availableData;
    },

    /* 获取名师列表 */
    async fetchTopTeachers() {
      try {
        const data = await this.apiRequest('/api/teachers/top?limit=8');
        this.topTeachers = data.data || [];
      } catch (error) {
        console.error('获取名师列表失败:', error);
        this.topTeachers = [];
      }
    },

    // 获取头像URL
    getAvatarUrl(avatar) {
      if (!avatar) return '';
      if (avatar.startsWith('http')) return avatar;
      return `${API_BASE}${avatar}`;
    },

    // 向老师提问
    async askTeacher(teacher) {
      const title = window.prompt(`向 ${teacher.user_name} 老师提问，请输入问题标题:`);
      if (!title) return;
      
      const content = window.prompt('请输入问题详情:');
      if (!content) return;
      
      const payload = {
        user_id: this.currentUserId,
        title: title,
        content: content,
        course_id: null,
        tags: ['提问', teacher.user_name]
      };
      
      try {
        await this.apiRequest('/api/community/qa-posts/teacher-question', {
          method: 'POST',
          body: payload
        });
        window.alert('问题提交成功！');
        this.fetchQATeachers();
      } catch (error) {
        console.error('提问失败:', error);
      }
    },

    /* 学习小组 */
    async fetchTeams(page = 1) {
      let url = `/api/community/teams?page=${page}&limit=20&current_user_id=${this.currentUserId}`;
      if (this.teamFilterCourseId) {
        url += `&course_id=${this.teamFilterCourseId}`;
      }
      const data = await this.apiRequest(url);
      this.teams = data.data || [];
    },

    async viewTeamDetail(team) {
      // 完全跳转到新的组队详情页 StudyPair
      this.$router.push({
        name: 'StudyPair',
        params: { teamId: team.team_id }
      });
    },

    // 打开创建小组表单
    openCreateTeamForm() {
      this.createForms.team.show = true;
      this.createForms.team = {
        show: true,
        team_name: '',
        description: '',
        course_id: this.availableData.courses[0]?.course_id || null,
        max_members: 10,
        tags: ''
      };
    },

    // 创建学习小组（真实数据）
    async createTeam() {
      if (!this.createForms.team.team_name.trim()) {
        window.alert('请输入小组名称');
        return;
      }

      const tags = this.createForms.team.tags
        ? this.createForms.team.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];

      const payload = {
        team_name: this.createForms.team.team_name,
        description: this.createForms.team.description,
        course_id: this.createForms.team.course_id,
        max_members: this.createForms.team.max_members,
        tags: tags,
        creator_id: this.currentUserId
      };

      try {
        await this.apiRequest('/api/community/teams', {
          method: 'POST',
          body: payload
        });
        window.alert('小组创建成功');
        this.createForms.team.show = false;
        this.fetchTeams();
      } catch (error) {
        console.error('创建小组失败:', error);
      }
    },

    async joinTeam(team) {
      await this.apiRequest(`/api/community/teams/${team.team_id}/join`, {
        method: 'POST',
        body: { user_id: this.currentUserId }
      });
      window.alert('加入成功');
      this.fetchTeams();
    },

    async leaveTeam(team) {
      await this.apiRequest(`/api/community/teams/${team.team_id}/leave`, {
        method: 'DELETE',
        body: { user_id: this.currentUserId }
      });
      window.alert('已退出小组');
      this.fetchTeams();
    },

    async deleteTeam(team) {
      if (!window.confirm('确定删除该小组吗？')) return;
      await this.apiRequest(`/api/community/teams/${team.team_id}`, {
        method: 'DELETE',
        body: { user_id: this.currentUserId }
      });
      window.alert('小组已删除');
      if (this.selectedTeam && this.selectedTeam.team_id === team.team_id) {
        this.selectedTeam = null;
        this.teamTasks = [];
      }
      this.fetchTeams();
    },

    async createTaskForTeam() {
      if (!this.selectedTeam) {
        window.alert('请先点击某个小组卡片，加载小组详情');
        return;
      }
      const payload = {
        creator_id: this.currentUserId,
        title: this.newTask.task_title || '示例任务',
        description: this.newTask.task_content || '示例任务内容',
        deadline: this.newTask.deadline || new Date().toISOString()
      };
      const url = `/api/community/tasks/teams/${this.selectedTeam.team_id}/tasks`;
      await this.apiRequest(url, { method: 'POST', body: payload });
      window.alert('任务创建成功');
      this.newTask = { task_title: '', task_content: '', deadline: '' };
      this.viewTeamDetail(this.selectedTeam);
    },

    async updateTaskStatus(task, status) {
      const url = `/api/community/tasks/tasks/${task.task_id}/status`;
      await this.apiRequest(url, { method: 'PATCH', body: { status } });
      window.alert('任务状态已更新');
      this.viewTeamDetail(this.selectedTeam);
    },

    async deleteTask(task) {
      const url = `/api/community/tasks/tasks/${task.task_id}`;
      await this.apiRequest(url, { method: 'DELETE' });
      window.alert('任务已删除');
      this.viewTeamDetail(this.selectedTeam);
    },

    /* 自习室 */
    async fetchRooms(page = 1) {
      const data = await this.apiRequest(
        `/api/community/rooms?page=${page}&limit=20&current_user_id=${this.currentUserId}`
      );
      // 确保显示正确的人数信息
      this.rooms = (data.data || []).map(room => ({
        ...room,
        member_count: room.online_count || room.current_participants || 0,
        max_members: room.max_participants || room.max_members || 50
      }));
    },

    async viewRoomDetail(room) {
      this.$router.push({
        name: 'StudyRoom',
        params: { roomId: room.room_id }
      });
    },

    // 打开创建自习室表单
    openCreateRoomForm() {
      this.createForms.room.show = true;
      this.createForms.room = {
        show: true,
        room_name: '',
        description: '',
        max_members: 20,
        schedule_time: '',
        rules: ''
      };
    },

    // 创建自习室（真实数据）
    async createRoom() {
      if (!this.createForms.room.room_name.trim()) {
        window.alert('请输入自习室名称');
        return;
      }

      const payload = {
        room_name: this.createForms.room.room_name,
        description: this.createForms.room.description,
        max_members: this.createForms.room.max_members,
        schedule_time: this.createForms.room.schedule_time,
        rules: this.createForms.room.rules,
        creator_id: this.currentUserId,
        tags: ['学习']
      };

      try {
        await this.apiRequest('/api/community/rooms', {
          method: 'POST',
          body: payload
        });
        window.alert('自习室创建成功');
        this.createForms.room.show = false;
        this.fetchRooms();
      } catch (error) {
        console.error('创建自习室失败:', error);
      }
    },

    async joinRoom(room) {
      await this.apiRequest(`/api/community/rooms/${room.room_id}/join`, {
        method: 'POST',
        body: { user_id: this.currentUserId }
      });
      window.alert('加入自习室成功');
      this.fetchRooms();
    },

    async leaveRoom(room) {
      await this.apiRequest(`/api/community/rooms/${room.room_id}/leave`, {
        method: 'DELETE',
        body: { user_id: this.currentUserId }
      });
      window.alert('已离开自习室');
      this.fetchRooms();
    },

    async deleteRoom(room) {
      if (!window.confirm('确定删除该自习室吗？')) return;
      await this.apiRequest(`/api/community/rooms/${room.room_id}`, {
        method: 'DELETE',
        body: { user_id: this.currentUserId }
      });
      window.alert('自习室已删除');
      if (this.selectedRoom && this.selectedRoom.room_id === room.room_id) {
        this.selectedRoom = null;
        this.roomMessages = [];
      }
      this.fetchRooms();
    },

    async createMessage() {
      if (!this.selectedRoom) {
        window.alert('请先选择一个自习室');
        return;
      }
      if (!this.newMessage.content.trim()) {
        window.alert('内容不能为空');
        return;
      }
      const url = `/api/community/messages/${this.selectedRoom.room_id}`;
      const payload = {
        user_id: this.currentUserId,
        content: this.newMessage.content,
        message_type: 'text'
      };
      await this.apiRequest(url, { method: 'POST', body: payload });
      this.newMessage.content = '';
      this.viewRoomDetail(this.selectedRoom);
    },

    async deleteMessage(msg) {
      await this.apiRequest(`/api/community/messages/${msg.message_id}`, {
        method: 'DELETE'
      });
      this.viewRoomDetail(this.selectedRoom);
    },

    /* 帖子 & 评论 */
async fetchDiscussionPosts(page = 1) {
    try {
        const data = await this.apiRequest(
            `/api/community/posts?post_type=discussion&page=${page}&limit=20&current_user_id=${this.currentUserId}`
        );
        
        console.log('获取讨论帖子数据:', data.data);
        
        this.discussionPosts = (data.data || []).map((p) => ({
            ...p,
            user_has_liked: false,
            showComments: false,
            // 确保评论数正确显示
            comment_count: p.comment_count || 0
        }));
        
        // 预加载有评论的帖子的评论数据
        this.preloadCommentsWithComments();
        
    } catch (error) {
        console.error('获取讨论帖子失败:', error);
        this.discussionPosts = [];
    }
},

// 添加预加载评论的方法
async preloadCommentsWithComments() {
    const postsWithComments = this.discussionPosts.filter(post => post.comment_count > 0);
    
    for (const post of postsWithComments) {
        try {
            const res = await this.apiRequest(
                `/api/community/comments/post/${post.post_id}?current_user_id=${this.currentUserId}`
            );
            this.commentsByPost[post.post_id] = res.data || [];
        } catch (error) {
            console.error(`预加载帖子 ${post.post_id} 的评论失败:`, error);
            this.commentsByPost[post.post_id] = [];
        }
    }
},

    async createDiscussionPostExample() {
      const payload = {
        user_id: this.currentUserId,
        post_type: 'discussion',
        title: '前端创建示例帖子 ' + Date.now().toString().slice(-4),
        content: '这是通过前端示例按钮创建的帖子，用于测试帖子接口。',
        course_id: this.availableData.courses[0]?.course_id || null,
        tags: ['示例', '讨论']
      };
      await this.apiRequest('/api/community/posts', {
        method: 'POST',
        body: payload
      });
      window.alert('示例帖子已创建');
      this.fetchDiscussionPosts();
    },

    async createDiscussionPostReal() {
      if (!this.newPost.title.trim() || !this.newPost.content.trim()) {
        window.alert('标题和内容不能为空');
        return;
      }
      const tags = this.newPost.tags
        ? this.newPost.tags
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      const payload = {
        user_id: this.currentUserId,
        post_type: 'discussion',
        title: this.newPost.title,
        content: this.newPost.content,
        course_id: this.availableData.courses[0]?.course_id || null,
        tags
      };
      await this.apiRequest('/api/community/posts', {
        method: 'POST',
        body: payload
      });
      window.alert('帖子发布成功');
      this.newPost = { title: '', content: '', tags: '', course_id: null };
      this.fetchDiscussionPosts();
    },

    async deleteDiscussionPost(post) {
      if (!window.confirm('确定删除这个帖子吗？')) return;
      
      await this.apiRequest(`/api/community/posts/${post.post_id}`, {
        method: 'DELETE',
        body: { user_id: this.currentUserId }
      });
      window.alert('帖子删除成功');
      this.fetchDiscussionPosts();
    },

    async togglePostLike(post) {
      const url = `/api/community/posts/${post.post_id}/like`;
      if (post.user_has_liked) {
        const res = await this.apiRequest(url, {
          method: 'DELETE',
          body: { user_id: this.currentUserId }
        });
        post.like_count = res.data.like_count;
        post.user_has_liked = false;
      } else {
        const res = await this.apiRequest(url, {
          method: 'POST',
          body: { user_id: this.currentUserId }
        });
        post.like_count = res.data.like_count;
        post.user_has_liked = true;
      }
    },

    // 修改 toggleComments 方法
async toggleComments(post) {
    post.showComments = !post.showComments;
    
    if (post.showComments) {
        // 如果已经有预加载的评论，直接显示
        if (this.commentsByPost[post.post_id] && this.commentsByPost[post.post_id].length > 0) {
            console.log('使用预加载的评论:', this.commentsByPost[post.post_id]);
            return;
        }
        
        // 否则从API获取
        try {
            console.log('获取帖子评论:', post.post_id);
            const res = await this.apiRequest(
                `/api/community/comments/post/${post.post_id}?current_user_id=${this.currentUserId}`
            );
            console.log('获取到的评论数据:', res.data);
            this.commentsByPost[post.post_id] = res.data || [];
        } catch (error) {
            console.error('获取评论失败:', error);
            this.commentsByPost[post.post_id] = [];
        }
    }
},

    async createComment(post) {
    const content = this.newCommentContent[post.post_id];
    if (!content || !content.trim()) {
        window.alert('评论内容不能为空');
        return;
    }
    
    try {
        const payload = {
            post_id: post.post_id,
            user_id: this.currentUserId,
            content: content,
            parent_comment_id: null,
            // 根据帖子类型设置评论类型
            comment_type: post.post_type === 'qa_help' ? 'qa_answer' : 'discussion'
        };
        
        console.log('创建评论请求:', payload);
        
        await this.apiRequest('/api/community/comments', {
            method: 'POST',
            body: payload
        });
        
        this.newCommentContent[post.post_id] = '';
        
        // 更新帖子评论数
        post.comment_count = (post.comment_count || 0) + 1;
        
        // 重新加载评论列表以确保数据同步
        if (post.showComments) {
            const res = await this.apiRequest(
                `/api/community/comments/post/${post.post_id}?current_user_id=${this.currentUserId}`
            );
            this.commentsByPost[post.post_id] = res.data || [];
        }
        
        window.alert('评论成功');
    } catch (error) {
        console.error('创建评论失败:', error);
        window.alert('评论失败: ' + error.message);
    }
},

    async toggleCommentLike(comment) {
      const url = `/api/community/comments/${comment.comment_id}/like`;
      if (comment.user_has_liked) {
        const res = await this.apiRequest(url, {
          method: 'DELETE',
          body: { user_id: this.currentUserId }
        });
        comment.like_count = res.data.like_count;
        comment.user_has_liked = false;
      } else {
        const res = await this.apiRequest(url, {
          method: 'POST',
          body: { user_id: this.currentUserId }
        });
        comment.like_count = res.data.like_count;
        comment.user_has_liked = true;
      }
    },

    async deleteComment(comment) {
  if (!window.confirm('确定删除这个评论吗？')) return;

  try {
    const result = await this.apiRequest(`/api/community/comments/${comment.comment_id}`, {
      method: 'DELETE',
      body: { user_id: this.currentUserId }
    });

    const postId = comment.post_id;
    const newCommentCount = result.data.comment_count;

    // 更新公共讨论区帖子的评论数
    this.discussionPosts.forEach(post => {
      if (post.post_id === postId) {
        post.comment_count = newCommentCount;
      }
    });

    // 更新互助学习帖子的评论数
    this.qaHelp.forEach(post => {
      if (post.post_id === postId) {
        post.comment_count = newCommentCount;
      }
    });

    // 从评论列表中移除
    if (this.commentsByPost[postId]) {
      this.commentsByPost[postId] = this.commentsByPost[postId].filter(
        c => c.comment_id !== comment.comment_id
      );
    }

    window.alert('评论删除成功');
  } catch (error) {
    console.error('删除评论失败:', error);
    window.alert('删除评论失败: ' + error.message);
  }
},

    async fetchQATeachers(page = 1) {
      const data = await this.apiRequest(
        `/api/community/qa/teachers?page=${page}&limit=20&current_user_id=${this.currentUserId}`
      );
      this.qaTeachers = data.data || [];
    },

    async fetchQAHelp(page = 1) {
  try {
    const data = await this.apiRequest(
      `/api/community/qa/help?page=${page}&limit=20&current_user_id=${this.currentUserId}`
    );
    
    this.qaHelp = (data.data || []).map(post => ({
      ...post,
      is_solved: post.status === 'closed',
      showAnswers: false, // 默认不显示回答
      showAnswerInput: false, // 默认不显示回答输入框
      comment_count: post.comment_count || 0
    }));

  } catch (error) {
    console.error('获取互助学习失败:', error);
    this.qaHelp = [];
  }
},

    // 创建名师答疑问题
    async createTeacherQuestion() {
      const title = window.prompt('请输入问题标题:');
      if (!title) return;
      
      const content = window.prompt('请输入问题详情:');
      if (!content) return;
      
      const payload = {
        user_id: this.currentUserId,
        title: title,
        content: content,
        course_id: this.availableData.courses[0]?.course_id || null,
        tags: ['提问']
      };
      
      await this.apiRequest('/api/community/qa-posts/teacher-question', {
        method: 'POST',
        body: payload
      });
      window.alert('问题提交成功！');
      this.fetchQATeachers();
    },

    // 创建互助学习帖子
    async createHelpPost() {
      const title = window.prompt('请输入求助标题:');
      if (!title) return;
      
      const content = window.prompt('请输入求助详情:');
      if (!content) return;
      
      const payload = {
        user_id: this.currentUserId,
        title: title,
        content: content,
        course_id: this.availableData.courses[0]?.course_id || null,
        tags: ['互助']
      };
      
      await this.apiRequest('/api/community/qa-posts/help-post', {
        method: 'POST',
        body: payload
      });
      window.alert('互助请求提交成功！');
      this.fetchQAHelp();
    },

   // 删除QA帖子
    async deleteQAPost(post) {
      if (!window.confirm('确定删除这个帖子吗？')) return;
      
      await this.apiRequest(`/api/community/qa-posts/${post.post_id}`, {
        method: 'DELETE',
        body: { user_id: this.currentUserId }
      });
      window.alert('帖子删除成功');
      // 根据帖子类型刷新对应的列表
      if (post.post_type === 'qa_teacher') {
        this.fetchQATeachers();
      } else if (post.post_type === 'qa_help') {
        this.fetchQAHelp();
      }
    },

    /* 互助学习回答功能 */
    
    // 打开回答输入框
    openAnswerInput(post) {
      // 关闭其他帖子的回答输入框
      this.qaHelp.forEach(p => {
        if (p.post_id !== post.post_id) {
          p.showAnswerInput = false;
        }
      });
      post.showAnswerInput = !post.showAnswerInput;
      this.newHelpAnswer = '';
    },

    // 在 submitHelpAnswer 方法中，成功提交后刷新数据
async submitHelpAnswer(post) {
  if (!this.newHelpAnswer.trim()) {
    window.alert('请输入回答内容');
    return;
  }

  try {
    const payload = {
      post_id: post.post_id,
      user_id: this.currentUserId,
      content: this.newHelpAnswer.trim(),
      parent_comment_id: null,
      comment_type: 'qa_answer'
    };

    console.log('提交互助回答:', payload);

    await this.apiRequest('/api/community/comments', {
      method: 'POST',
      body: payload
    });

    // 更新帖子评论数
    post.comment_count = (post.comment_count || 0) + 1;
    
    // 关闭输入框
    post.showAnswerInput = false;
    this.newHelpAnswer = '';
    
    // 强制刷新回答列表
    if (post.showAnswers) {
      // 先重置为加载中状态
      this.helpAnswers = {
        ...this.helpAnswers,
        [post.post_id]: undefined
      };
      // 重新加载数据
      await this.fetchHelpAnswers(post.post_id);
    }
    
    window.alert('回答提交成功！');
  } catch (error) {
    console.error('提交回答失败:', error);
    window.alert('提交回答失败: ' + error.message);
  }
},

   // 修复后的 fetchHelpAnswers 方法
async fetchHelpAnswers(postId) {
  try {
    console.log('🚀 开始获取互助学习回答，帖子ID:', postId);
    
    const url = `/api/community/comments/post/${postId}?current_user_id=${this.currentUserId}&comment_type=qa_answer`;
    console.log('🔗 请求URL:', url);
    
    const res = await this.apiRequest(url);
    console.log('✅ API响应状态:', res.success);
    console.log('📊 响应数据:', res.data);
    
    let answers = [];
    
    if (res.success && Array.isArray(res.data)) {
      answers = res.data;
      console.log(`📈 成功获取 ${answers.length} 条回答`);
    } else {
      console.log('❌ 数据格式异常或请求失败');
      answers = [];
    }
    
    this.helpAnswers = {
      ...this.helpAnswers,
      [postId]: answers
    };
    
    console.log('🔄 更新后的 helpAnswers:', this.helpAnswers);
    
    return answers;
  } catch (error) {
    console.error('❌ 获取帮助帖子回答失败:', error);
    // 确保出错时也设置空数组，避免一直显示加载中
    this.helpAnswers = {
      ...this.helpAnswers,
      [postId]: []
    };
    return [];
  }
},

   // 修复后的 toggleHelpAnswers 方法
async toggleHelpAnswers(post) {
  // 如果当前是显示状态，直接隐藏
  if (post.showAnswers) {
    post.showAnswers = false;
    return;
  }
  
  // 显示回答区域
  post.showAnswers = true;
  
  console.log('开始加载回答数据，帖子ID:', post.post_id);
  console.log('当前 helpAnswers 状态:', this.helpAnswers);
  
  // 检查是否已经有缓存数据
  if (this.helpAnswers[post.post_id] && this.helpAnswers[post.post_id].length > 0) {
    console.log('使用缓存数据');
    return;
  }
  
  // 设置为加载中状态
  this.helpAnswers = {
    ...this.helpAnswers,
    [post.post_id]: undefined // 使用 undefined 表示加载中
  };
  
  try {
    // 加载数据
    await this.fetchHelpAnswers(post.post_id);
    console.log('回答数据加载完成');
  } catch (error) {
    console.error('加载回答数据失败:', error);
    // 加载失败时设置为空数组
    this.helpAnswers = {
      ...this.helpAnswers,
      [post.post_id]: []
    };
  }
},

    // 删除互助学习的回答
    async deleteHelpAnswer(answer, post) {
      if (!window.confirm('确定删除这个回答吗？')) return;

      try {
        await this.apiRequest(`/api/community/comments/${answer.comment_id}`, {
          method: 'DELETE',
          body: { user_id: this.currentUserId }
        });

        // 更新帖子评论数
        if (post.comment_count > 0) {
          post.comment_count--;
        }

        // 从回答列表中移除
        if (this.helpAnswers[post.post_id]) {
          this.helpAnswers[post.post_id] = this.helpAnswers[post.post_id].filter(
            a => a.comment_id !== answer.comment_id
          );
        }

        window.alert('回答删除成功');
      } catch (error) {
        console.error('删除回答失败:', error);
        window.alert('删除回答失败: ' + error.message);
      }
    },

    // 标记互助学习问题为已解决
    async markHelpSolved(post) {
      if (!window.confirm('确定标记为已解决吗？')) return;
      
      try {
        // 这里需要先选择一个回答作为解决方案
        const answers = this.helpAnswers[post.post_id] || [];
        if (answers.length === 0) {
          window.alert('请先添加回答后再标记解决');
          return;
        }
        
        // 简单选择第一个回答作为解决方案
        const solvedCommentId = answers[0].comment_id;
        
        await this.apiRequest(`/api/community/qa/${post.post_id}/solve`, {
          method: 'PATCH',
          body: { 
            solved_comment_id: solvedCommentId,
            user_id: this.currentUserId 
          }
        });
        
        window.alert('已标记为已解决');
        this.fetchQAHelp(); // 刷新列表
      } catch (error) {
        console.error('标记解决失败:', error);
        window.alert('标记解决失败: ' + error.message);
      }
    },

    openQaPost(post) {
      window.alert(
        '这里可以做成弹窗 / 新页面查看问答详情，当前 post_id = ' + post.post_id
      );
    },

    async markSolved(post) {
      const commentId = window.prompt('请输入被采纳回答的 comment_id：');
      if (!commentId) return;
      const url = `/api/community/qa/${post.post_id}/solve`;
      await this.apiRequest(url, {
        method: 'PATCH',
        body: { 
          solved_comment_id: Number(commentId),
          user_id: this.currentUserId 
        }
      });
      window.alert('已标记为已解决');
      this.fetchQATeachers();
    },

    /* 工具函数 */
    calcRunningDays(create_time) {
      if (!create_time) return 0;
      const t = new Date(create_time).getTime();
      if (Number.isNaN(t)) return 0;
      const now = Date.now();
      return Math.max(1, Math.floor((now - t) / (1000 * 60 * 60 * 24)));
    },

    formatDate(str) {
      if (!str) return '';
      const d = new Date(str);
      if (Number.isNaN(d.getTime())) return str;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${y}-${m}-${day} ${hh}:${mm}`;
    }
  }
};
</script>

<style>
:root {
  --primary: #1a73e8;
  --primary-light: #e8f0fe;
  --secondary: #34a853;
  --danger: #ea4335;
  --dark: #202124;
  --light: #f8f9fa;
  --gray: #5f6368;
  --border: #dadce0;
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

/* 容器：横向 100% 铺满 */
.container {
  width: 100%;
  max-width: none;
  margin: 0 auto;
  padding: 0 32px;
}

/* 头部 */
.community-header {
  background: linear-gradient(135deg, var(--primary), #6c8ef5);
  color: #fff;
  padding: 50px 0;
  margin-bottom: 30px;
  text-align: center;
}

.community-header h1 {
  font-size: 2.5rem;
  margin-bottom: 15px;
}

.community-header p {
  font-size: 1.2rem;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto;
}

/* 状态栏 */
.status-bar {
  margin-bottom: 10px;
  font-size: 0.9rem;
  color: var(--gray);
  display: flex;
  align-items: center;
  gap: 15px;
}

.status-ok {
  color: var(--secondary);
}

.status-error {
  color: var(--danger);
}

.status-btn {
  padding: 6px 12px;
  font-size: 0.8rem;
}

/* Tabs */
.tabs {
  display: flex;
  background: #fff;
  border-radius: 15px;
  padding: 10px;
  margin-bottom: 30px;
  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 15px;
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.tab.active {
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 600;
}

/* 内容区域 */
.content-section {
  background: #fff;
  border-radius: 15px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 1.5rem;
  margin-bottom: 25px;
  color: var(--dark);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: var(--primary);
  color: #fff;
}

.btn-primary:hover {
  background: #0d5bb9;
}

.btn-secondary {
  background: var(--light);
  color: var(--dark);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: var(--primary-light);
}

.btn-small {
  padding: 6px 12px;
  font-size: 0.8rem;
}

.btn-full {
  width: 100%;
}

.select {
  padding: 8px 10px;
}

/* Team cards */
.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
}

.team-card {
  background: var(--light);
  border-radius: 12px;
  padding: 25px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  cursor: pointer;
}

.team-card:hover {
  border-color: var(--primary);
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.team-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.team-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), #6c8ef5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: bold;
  font-size: 1.2rem;
}

.team-info h3 {
  margin-bottom: 5px;
}

.team-days {
  color: var(--gray);
  font-size: 0.9rem;
}

.team-desc {
  margin-bottom: 10px;
}

.team-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 10px 0 15px;
}

.tag {
  background: var(--primary-light);
  color: var(--primary);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.team-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--gray);
  font-size: 0.9rem;
  margin-top: 10px;
  gap: 10px;
  flex-wrap: wrap;
}

.team-btn-row {
  margin-top: 8px;
}

/* Detail sections */
.section-detail {
  margin-top: 30px;
}

.detail-desc {
  margin: 8px 0;
}

.detail-meta {
  font-size: 0.9rem;
  color: var(--gray);
  margin-bottom: 10px;
}

.sub-title {
  margin: 20px 0 10px;
}

.empty-tip {
  font-size: 0.9rem;
  color: var(--gray);
  margin-bottom: 10px;
}

.task-create {
  margin-top: 15px;
}

.task-input-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

/* Inputs */
.input {
  padding: 8px;
  border-radius: 6px;
  border: 1px solid var(--border);
  min-width: 200px;
}

.input.full {
  width: 100%;
}

.input.flex-1 {
  flex: 1;
}

.textarea {
  width: 100%;
  min-height: 60px;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid var(--border);
  margin-bottom: 8px;
}

/* Study rooms */
.study-rooms {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
}

.room-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.room-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.room-header {
  padding: 20px;
  border-bottom: 1px solid var(--border);
}

.room-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.room-meta {
  display: flex;
  gap: 15px;
  color: var(--gray);
  font-size: 0.9rem;
}

.room-desc {
  padding: 0 20px 15px;
  color: var(--gray);
  font-size: 0.9rem;
  line-height: 1.4;
}

.room-participants {
  padding: 15px 20px;
  border-bottom: 1px solid var(--border);
}

.participants-list {
  display: flex;
  gap: 10px;
}

.participant {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
}

.room-actions {
  padding: 15px 20px;
  display: flex;
  gap: 10px;
}

.flex-1 {
  flex: 1;
}

/* Posts & comments */
.discussion-feed {
  max-height: 600px;
  overflow-y: auto;
}

.room-feed {
  max-height: 300px;
}

.post {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.post:hover {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.post-create {
  margin-top: 10px;
}

.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}

.post-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.post-user {
  font-weight: 600;
}

.post-time {
  color: var(--gray);
  font-size: 0.8rem;
  margin-left: auto;
}

.post-content h4 {
  margin-bottom: 6px;
}

.post-content p {
  line-height: 1.6;
}

.post-actions {
  display: flex;
  gap: 20px;
  color: var(--gray);
  margin-top: 10px;
}

.post-action {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: color 0.3s ease;
}

.post-action:hover {
  color: var(--primary);
}

.post-input {
  width: 100%;
  padding: 15px;
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 1rem;
  resize: none;
  height: 100px;
  margin-bottom: 15px;
}

.post-input.small {
  height: 60px;
}

.post-input:focus {
  outline: none;
  border-color: var(--primary);
}

.post-footer {
  display: flex;
  justify-content: flex-end;
}

.post-bottom-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Comments */
.comment-list {
  margin-top: 15px;
  border-top: 1px solid var(--border);
  padding-top: 10px;
}

.comment-item {
  padding: 8px 0;
  border-bottom: 1px dashed var(--border);
  font-size: 0.9rem;
}

.comment-meta {
  display: flex;
  justify-content: space-between;
  color: var(--gray);
  font-size: 0.8rem;
}

.comment-text {
  margin: 4px 0;
}

.comment-create {
  margin-top: 10px;
}

/* Teachers */
.teachers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
  margin-top: 20px;
}

.teacher-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 25px;
  text-align: center;
  transition: all 0.3s ease;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.teacher-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.teacher-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), #6c8ef5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0 auto 15px;
}

.teacher-name {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 5px;
}

.teacher-title {
  color: var(--primary);
  margin-bottom: 10px;
}

.teacher-desc {
  font-size: 0.95rem;
}

.teacher-stats {
  display: flex;
  justify-content: space-around;
  margin: 15px 0;
}

.teacher-stat {
  text-align: center;
}

.teacher-stat-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--primary);
}

.teacher-stat-label {
  font-size: 0.8rem;
  color: var(--gray);
}

/* Help cards */
.help-requests {
  display: grid;
  gap: 20px;
}

.help-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  gap: 15px;
  transition: all 0.3s ease;
}

.help-card:hover {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.help-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.help-content {
  flex: 1;
}

.help-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.help-text {
  font-size: 0.95rem;
}

.help-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  color: var(--gray);
  font-size: 0.9rem;
  margin-top: 10px;
}

.help-actions {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* Footer */
.footer {
  background: var(--dark);
  color: #fff;
  padding: 30px 32px 20px;
  margin-top: 50px;
}

.footer-bottom {
  text-align: center;
  padding-top: 10px;
  border-top: 1px solid #3c4043;
  color: #9aa0a6;
  font-size: 0.85rem;
}

/* 创建表单样式 */
.create-form {
  background: #f8f9fa;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 25px;
}

.create-form h3 {
  margin-bottom: 20px;
  color: var(--dark);
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: var(--dark);
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

/* 互助学习相关样式 */
.status-solved {
  color: var(--secondary);
  font-weight: 500;
}

.status-unsolved {
  color: var(--danger);
  font-weight: 500;
}

/* 回答输入区域样式 */
.answer-input-section {
  margin-top: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.answer-input-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

/* 回答列表样式 */
.answers-list {
  margin-top: 15px;
  border-top: 1px solid var(--border);
  padding-top: 15px;
}

.answer-item {
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 10px;
  background: #fafafa;
}

.answer-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.answer-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.8rem;
}

.answer-user {
  font-weight: 500;
}

.answer-time {
  color: var(--gray);
  font-size: 0.8rem;
  margin-left: auto;
}

.answer-content {
  line-height: 1.5;
  margin-bottom: 8px;
}

.answer-actions {
  display: flex;
  gap: 15px;
}

/* 响应式 */
@media (max-width: 768px) {
  .nav-links {
    display: none;
  }

  .team-grid,
  .study-rooms,
  .teachers-grid {
    grid-template-columns: 1fr;
  }

  .community-header h1 {
    font-size: 2rem;
  }

  .container {
    padding: 0 16px;
  }

  .status-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .post-bottom-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .help-actions {
    flex-direction: column;
  }
  
  .answer-input-actions {
    flex-direction: column;
  }
}

/* 确保社区页面不被全局导航栏遮挡 */
.community {
  padding-top: 20px;
}

/* 名师答疑 - 讲师卡片样式（参照首页） */
.instructor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
  margin-bottom: 30px;
}

.instructor-card {
  background: #ffffff;
  border: 1px solid rgba(14, 66, 120, 0.12);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 6px 14px rgba(11, 45, 70, 0.04);
  transition: all 0.3s ease;
}

.instructor-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(11, 45, 70, 0.1);
}

.instructor-media {
  background: #ffffff;
  padding: 16px 16px 12px;
}

.instructor-avatar {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  background: linear-gradient(135deg, #4a7fc1, #6b9bd1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 48px;
  overflow: hidden;
}

.instructor-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
}

.instructor-body {
  padding: 8px 16px 16px;
}

.instructor-name {
  font-size: 1.15rem;
  font-weight: 600;
  color: #0b3757;
  margin-bottom: 6px;
}

.instructor-desc {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 14px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.instructor-stats {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 14px;
}

.instructor-stats .stat {
  flex: 1;
  background: linear-gradient(135deg, #f0f5ff, #e8f0fe);
  border: none;
  padding: 10px 8px;
  border-radius: 10px;
  text-align: center;
}

.instructor-stats .stat-label {
  display: block;
  color: #6b7e90;
  font-size: 0.75rem;
  margin-bottom: 4px;
}

.instructor-stats .stat-value {
  display: block;
  color: var(--primary);
  font-weight: 700;
  font-size: 1.1rem;
}

/* 问答列表样式 */
.qa-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

.qa-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.qa-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.qa-card:hover {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.qa-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.qa-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.qa-info {
  flex: 1;
}

.qa-user {
  font-weight: 600;
  color: var(--dark);
}

.qa-course {
  font-size: 0.85rem;
  color: var(--gray);
}

.qa-status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.qa-status.solved {
  background: rgba(52, 168, 83, 0.1);
  color: var(--secondary);
}

.qa-status.unsolved {
  background: rgba(234, 67, 53, 0.1);
  color: var(--danger);
}

.qa-content h4 {
  margin-bottom: 8px;
  color: var(--dark);
}

.qa-content p {
  color: var(--gray);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.qa-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.qa-stats {
  display: flex;
  gap: 15px;
  color: var(--gray);
  font-size: 0.9rem;
}

.qa-stats span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.qa-actions {
  display: flex;
  gap: 8px;
}

@media (min-width: 1200px) {
  .instructor-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 768px) {
  .instructor-grid {
    grid-template-columns: 1fr;
  }
  
  .qa-footer {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .qa-actions {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>