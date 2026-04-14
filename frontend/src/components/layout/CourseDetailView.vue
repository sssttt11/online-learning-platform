<template>
  <div class="course-detail">
    <!-- 课程头部：左右两栏，左侧封面，右侧信息和操作 -->
    <section class="course-header">
      <div class="container">
        <div class="course-header-grid">
          <div class="course-cover" :style="getCoverStyle()" aria-hidden="true"></div>

          <div class="course-info">
            <span class="course-category">{{ course.categoryName }}</span>
            <h1>{{ course.title }}</h1>
            <p class="course-description">{{ course.description }}</p>
            <div class="course-meta">
              <div class="meta-item">
                <i class="fas fa-star"></i>
                <span>{{ course.rating }} ({{ course.reviewCount }} 评价)</span>
              </div>
              <div class="meta-item">
                <i class="fas fa-users"></i>
                <span>{{ course.studentCount }} 名学生</span>
              </div>
              <div class="meta-item">
                <i class="fas fa-clock"></i>
                <span>{{ course.duration }} 小时</span>
              </div>
              <div class="meta-item">
                <i class="fas fa-signal"></i>
                <span>{{ course.difficulty }}</span>
              </div>
            </div>
            <div class="course-actions">
              <!-- 报名/开始学习按钮（保持原有事件与行为） -->
              <button 
                class="btn btn-primary" 
                @click="$emit('enroll-course')"
                :disabled="isTogglingLibrary"
              >
                <i :class="isEnrolled ? 'fas fa-play' : 'fas fa-pen-alt'"></i>
                {{ isTogglingLibrary ? '处理中...' : (isEnrolled ? '开始学习' : '立即报名') }}
              </button>

              <!-- 收藏按钮 -->
              <button 
                class="btn btn-secondary" 
                :class="{ 'btn-secondary-active': isFavorite }" 
                @click="$emit('toggle-favorite')"
              >
                <i :class="isFavorite ? 'fas fa-heart' : 'far fa-heart'"></i>
                收藏
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="container">
      <!-- 标签页 -->
      <div class="tabs">
        <div 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab" 
          :class="{ active: activeTab === tab.id }"
          @click="$emit('update:active-tab', tab.id)"
        >
          {{ tab.name }}
        </div>
      </div>

      <!-- 课程介绍 -->
      <div v-if="activeTab === 'overview'" class="tab-content">
        <div class="content-section">
          <h2 class="section-title">课程介绍</h2>
          <div class="course-overview">
            <div class="overview-content">
              <p>{{ courseOverview || course.description || '暂无课程介绍' }}</p>
              
              <h3>学习目标</h3>
              <ul v-if="learningObjectives && learningObjectives.length > 0">
                <li v-for="objective in learningObjectives" :key="objective">{{ objective }}</li>
              </ul>
              <ul v-else>
                <li>掌握课程核心知识点</li>
                <li>提升实际应用能力</li>
                <li>培养解决问题的思维</li>
              </ul>
              
              <div class="features-grid" v-if="courseFeatures && courseFeatures.length > 0">
                <div 
                  v-for="feature in courseFeatures" 
                  :key="feature.title"
                  class="feature-item"
                >
                  <div class="feature-icon">
                    <i :class="feature.icon || 'fas fa-star'"></i>
                  </div>
                  <h4>{{ feature.title }}</h4>
                  <p>{{ feature.description }}</p>
                </div>
              </div>
              <div class="features-grid" v-else>
                <div class="feature-item">
                  <div class="feature-icon">
                    <i class="fas fa-laptop-code"></i>
                  </div>
                  <h4>实战驱动</h4>
                  <p>通过真实项目学习编程</p>
                </div>
                <div class="feature-item">
                  <div class="feature-icon">
                    <i class="fas fa-graduation-cap"></i>
                  </div>
                  <h4>循序渐进</h4>
                  <p>系统学习路径</p>
                </div>
                <div class="feature-item">
                  <div class="feature-icon">
                    <i class="fas fa-comments"></i>
                  </div>
                  <h4>社区支持</h4>
                  <p>互动交流学习</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 课程大纲（已报名才能查看） -->
      <div v-if="activeTab === 'curriculum'" class="tab-content">
        <div class="content-section">
          <h2 class="section-title">课程大纲</h2>
          
          <!-- 调试信息：显示当前状态 -->
          <div style="background: #f0f0f0; padding: 10px; margin-bottom: 15px; border-radius: 5px; font-size: 12px;">
            <div>调试信息：</div>
            <div>isEnrolled: {{ isEnrolled }}</div>
            <div>chapters 长度: {{ chapters?.length || 0 }}</div>
            <div>activeTab: {{ activeTab }}</div>
          </div>
          
          <div v-if="!isEnrolled" class="locked-content">
            <div class="locked-icon">
              <i class="fas fa-lock"></i>
            </div>
            <h3>课程内容已锁定</h3>
            <p>请先报名课程以查看所有章节和视频内容</p>
            <button class="btn-enroll-locked" @click="$emit('enroll-course')">
              <i class="fas fa-pen-alt"></i>
              立即报名
            </button>
          </div>
          
          <div v-else class="curriculum-content">
            <!-- 如果没有章节数据，显示提示 -->
            <div v-if="!chapters || chapters.length === 0" class="no-chapters">
              <i class="fas fa-book-open"></i>
              <h3>暂无课程大纲</h3>
              <p>课程大纲正在准备中，请稍后再来查看</p>
            </div>
            
            <!-- 有章节数据时才显示 -->
            <div v-else>
              <div 
                v-for="chapter in chapters" 
                :key="chapter.id"
                class="chapter" 
                :class="{ active: chapter.isOpen }"
              >
                <div class="chapter-header" @click="$emit('toggle-chapter', chapter.id)">
                  <div class="chapter-title">
                    <i :class="chapter.isOpen ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"></i>
                    <span>{{ chapter.title }}</span>
                  </div>
                  <span>{{ chapter.lessonCount }}个视频</span>
                </div>
                <div class="chapter-content">
                  <div 
                    v-for="lesson in chapter.lessons" 
                    :key="lesson.id"
                    class="lesson lesson-clickable"
                    @click="$emit('go-to-video', lesson.id)"
                  >
                    <div class="lesson-icon">
                      <i class="fas fa-play-circle"></i>
                    </div>
                    <div class="lesson-info">
                      <div class="lesson-title">{{ lesson.title }}</div>
                      <div class="lesson-meta">{{ lesson.duration }}分钟</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 讲师介绍 -->
      <div v-if="activeTab === 'instructor'" class="tab-content">
        <div class="content-section">
          <h2 class="section-title">讲师介绍</h2>
          <div class="instructor-card">
            <div class="instructor-avatar" v-if="!instructor.avatar">{{ instructor.name ? instructor.name.charAt(0) : '讲' }}</div>
            <img v-else :src="instructor.avatar" class="instructor-avatar-img" alt="讲师头像">
            <div class="instructor-info">
              <h3>{{ instructor.name }}</h3>
              <div class="instructor-title">{{ instructor.title }}</div>
              <p style="margin-bottom: 15px; line-height: 1.5;">
                {{ instructor.intro }}
              </p>
              <div class="instructor-stats">
                <div class="stat">
                  <div class="stat-value">{{ course.rating }}/5.0</div>
                  <div class="stat-label">讲师评分</div>
                </div>
                <div class="stat">
                  <div class="stat-value">{{ course.studentCount }}</div>
                  <div class="stat-label">学生人数</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 学生评价 -->
      <div v-if="activeTab === 'reviews'" class="tab-content">
        <div class="content-section">
          <h2 class="section-title">学生评价</h2>
          
          <!-- 评价表单 -->
          <div class="review-form">
            <h3 class="form-title">发表你的评价</h3>
            <div class="rating-selector">
              <label>课程评分：</label>
              <div class="stars">
                <i 
                  v-for="star in 5" 
                  :key="star"
                  class="star-icon"
                  :class="star <= newRating ? 'fas fa-star active' : 'far fa-star'"
                  @click="$emit('update:new-rating', star)"
                ></i>
              </div>
            </div>
            <div class="review-input">
              <label>评价内容：</label>
              <textarea 
                :value="newReviewContent" 
                @input="$emit('update:new-review-content', $event.target.value)"
                placeholder="请分享你对这门课程的看法和建议..."
                rows="4"
                maxlength="500"
              ></textarea>
              <div class="char-count">{{ newReviewContent.length }}/500</div>
            </div>
            <button 
              class="btn-submit" 
              @click="$emit('handle-submit-review')"
              :disabled="isSubmitting || !newReviewContent.trim()"
            >
              {{ isSubmitting ? '提交中...' : '提交评价' }}
            </button>
          </div>
          
          <div class="reviews-grid">
            <div 
              v-for="review in reviews" 
              :key="review.id"
              class="review-card"
            >
              <div class="review-header">
                <div class="reviewer">
                  <div class="reviewer-avatar">{{ review.avatar }}</div>
                  <div>
                    <div style="font-weight: 600;">{{ review.name }}</div>
                    <div style="font-size: 0.8rem; color: #5f6368;">{{ review.job }}</div>
                  </div>
                </div>
                <div class="rating">
                  <i v-for="n in 5" :key="n" class="fas fa-star"></i>
                </div>
              </div>
              <div class="review-content">
                {{ review.content }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 相关课程 -->
      <div class="content-section">
        <h2 class="section-title">相关课程推荐</h2>
        <div class="related-courses">
          <CourseCard 
            v-for="relatedCourse in (relatedCourses || []).slice(0, 3)" 
            :key="relatedCourse.id"
            :course="relatedCourse"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import CourseCard from '@/components/course/CourseCard.vue'
import { computed, toRefs } from 'vue'

const props = defineProps({
  course: Object,
  instructor: Object,
  chapters: Array,
  reviews: Array,
  relatedCourses: Array,
  courseOverview: String,
  learningObjectives: Array,
  courseFeatures: Array,
  activeTab: String,
  isFavorite: Boolean,
  isEnrolled: Boolean,  // 修改：将 isInLearningLibrary 改为 isEnrolled
  isTogglingLibrary: Boolean,
  newRating: Number,
  newReviewContent: String,
  isSubmitting: Boolean
})

// 导出为响应式引用，模板和脚本都可以安全使用 `course` 等变量
const { course, instructor, chapters, reviews, relatedCourses, courseOverview, learningObjectives, courseFeatures, activeTab, isFavorite, isEnrolled, isTogglingLibrary, newRating, newReviewContent, isSubmitting } = toRefs(props)

defineEmits([
  'update:active-tab',
  'toggle-chapter', 
  'go-to-first-video',
  'go-to-video',
  'enroll-course',  // 修改：添加 enroll-course 事件
  'toggle-favorite',
  'update:new-rating',
  'update:new-review-content',
  'handle-submit-review'
])

const tabs = [
  { id: 'overview', name: '课程介绍' },
  { id: 'curriculum', name: '课程大纲' },
  { id: 'instructor', name: '讲师介绍' },
  { id: 'reviews', name: '学生评价' }
]

// 与 CourseCard.vue 保持一致的图片处理逻辑（优先使用 course.image，再兼容其他字段）
const isPlaceholderDomain = (url) => {
  if (!url || typeof url !== 'string') return false
  const host = url.replace(/^https?:\/\//, '').split('/')[0]
  const blocked = [
    'via.placeholder.com',
    'placehold.it',
    'placehold.co'
  ]
  return blocked.some(b => host.includes(b))
}

// 运行时计算封面样式，避免首次渲染时使用旧值导致回退
const getCoverStyle = () => {
  // 兼容父组件传入的 `course` 既可能是普通对象也可能是 ref
  const courseObj = (course && course.value) ? course.value : course
  const img = (typeof courseObj === 'object' && (courseObj.image || courseObj.cover_img || courseObj.imageUrl || courseObj.cover || courseObj.coverUrl)) || ''
  // 调试输出，便于排查时序问题
  console.log('🧭 CourseDetailView.getCoverStyle img raw:', img)
  let imageUrl = img
  const isPlaceholder = isPlaceholderDomain(imageUrl)
  console.log('🧭 isPlaceholderDomain:', isPlaceholder)
  if (!imageUrl || isPlaceholder) {
    console.log('🧭 fallback to default course image')
    imageUrl = '/default-course.svg'
  }

  if (typeof imageUrl === 'string' && (imageUrl.startsWith('http') || imageUrl.startsWith('/'))) {
    return {
      backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.08)), url(${imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }
  }

  return {
    background: 'linear-gradient(135deg, #667eea, #764ba2)'
  }
}
</script>

<style scoped>
/* 原有的所有样式保持不变 */
.course-detail {
  min-height: 100vh;
}

/* 课程头部样式 */
.course-header {
  /* 更柔和的头部背景，减少视觉突兀 */
  background: linear-gradient(180deg, #5b7be6 0%, #8fa9ff 60%, #eef4ff 100%);
  color: white;
  padding: 40px 0;
  margin-bottom: 30px;
  /* 轻微叠层暗角，增强可读性同时不突兀 */
  box-shadow: inset 0 -40px 80px rgba(24, 35, 58, 0.06);
}

.course-header-grid{
  display:flex;
  gap:24px;
  align-items:stretch;
}
.course-cover{
  flex:1;
  min-height:260px;
  border-radius:12px;
  overflow:hidden;
  background-size:cover;
  background-position:center;
  box-shadow: 0 10px 30px rgba(16,40,60,0.12);
}
.course-info{ flex:1 }

@media (max-width: 992px){
  .course-header-grid{ flex-direction:column }
  .course-cover{ min-height:200px }
}

.course-category {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.9);
  color: #1a73e8;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 1rem;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  margin-bottom: 16px;
}

.course-info h1 {
  font-size: 2rem;
  margin-bottom: 10px;
}

.course-description {
  font-size: 1rem;
  margin-bottom: 20px;
  opacity: 0.9;
  line-height: 1.5;
}

.course-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  color: rgba(255,255,255,0.95);
}

.meta-item i {
  background: rgba(255,255,255,0.2);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.3);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
}

.meta-item:nth-child(1) i { color: #f9ab00; background: rgba(249,171,0,0.18); border-color: rgba(249,171,0,0.35); }
.meta-item:nth-child(2) i { color: rgb(60, 220, 102); background: rgba(52,168,83,0.18); border-color: rgba(52,168,83,0.35); }
.meta-item:nth-child(3) i { color: #1a73e8; background: rgba(26,115,232,0.18); border-color: rgba(26,115,232,0.35); }
.meta-item:nth-child(4) i { color: #9c27b0; background: rgba(156,39,176,0.18); border-color: rgba(156,39,176,0.35); }


.course-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #1a73e8;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0d5bb9;
}

.btn-preview {
  background: #34a853;
  color: white;
}

.btn-preview:hover:not(:disabled) {
  background: #2d9249;
}

.btn-library {
  background: #fbbc04;
  color: white;
}

.btn-library:hover:not(:disabled) {
  background: #e0a800;
}

.btn-library-added {
  background: #0b8043;
  color: white;
}

.btn-library-added:hover:not(:disabled) {
  background: #0a6d39;
}

.btn-secondary {
  background: rgba(255,255,255,0.2);
  color: white;
  border: 1px solid rgba(255,255,255,0.3);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255,255,255,0.3);
}

.btn-secondary-active {
  background: #ffc107;
  color: #202124;
  border-color: #ffc107;
}

/* 标签页样式 */
.tabs {
  display: flex;
  background: white;
  border-radius: 10px;
  padding: 8px;
  margin-bottom: 25px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  overflow-x: auto;
}

.tab {
  padding: 12px 20px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.3s ease;
  white-space: nowrap;
  font-size: 0.9rem;
}

.tab.active {
  background: #e8f0fe;
  color: #1a73e8;
  font-weight: 600;
}

/* 内容区域样式 */
.content-section {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 25px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.section-title {
  font-size: 1.3rem;
  margin-bottom: 20px;
  color: #202124;
}

/* 课程介绍样式 */
.course-overview {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.overview-content {
  line-height: 1.6;
}

.overview-content h3 {
  margin: 15px 0 8px;
  color: #202124;
  font-size: 1rem;
}

.overview-content ul {
  margin-left: 20px;
  margin-bottom: 15px;
}

.overview-content li {
  margin-bottom: 5px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.feature-item {
  text-align: center;
  padding: 15px;
  background: white;
  border-radius: 6px;
}

.feature-icon {
  font-size: 1.5rem;
  color: #1a73e8;
  margin-bottom: 8px;
}

.feature-item h4 {
  font-size: 0.9rem;
  margin-bottom: 5px;
}

.feature-item p {
  font-size: 0.8rem;
  color: #5f6368;
}

/* 章节样式 */
.chapter {
  margin-bottom: 20px;
  border: 1px solid #dadce0;
  border-radius: 8px;
  overflow: hidden;
}

.chapter-header {
  background: #f8f9fa;
  padding: 15px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chapter-title {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
}

.chapter-content {
  padding: 0;
  max-height: 0;
  overflow: hidden;
  transition: all 0.3s ease;
}

.chapter.active .chapter-content {
  padding: 15px;
  max-height: 1000px;
}

.lesson {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #dadce0;
}

.lesson-clickable {
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 6px;
  padding: 10px 8px;
  margin: 0 -8px;
}

.lesson-clickable:hover {
  background: #f8f9fa;
  transform: translateX(4px);
}

.lesson:last-child {
  border-bottom: none;
}

.lesson-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e8f0fe;
  color: #1a73e8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.lesson-info {
  flex: 1;
}

.lesson-title {
  font-weight: 500;
  margin-bottom: 2px;
  font-size: 0.9rem;
}

.lesson-meta {
  font-size: 0.8rem;
  color: #5f6368;
}

/* 无章节数据提示样式 */
.no-chapters {
  text-align: center;
  padding: 40px 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #dadce0;
}

.no-chapters i {
  font-size: 3rem;
  color: #dadce0;
  margin-bottom: 15px;
}

.no-chapters h3 {
  font-size: 1.2rem;
  color: #202124;
  margin-bottom: 8px;
}

.no-chapters p {
  color: #5f6368;
  margin-bottom: 20px;
}

/* 讲师信息样式 */
.instructor-card {
  display: flex;
  gap: 15px;
  align-items: center;
}

.instructor-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a73e8, #6c8ef5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  font-weight: bold;
}

.instructor-avatar-img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.instructor-info h3 {
  font-size: 1.1rem;
  margin-bottom: 5px;
}

.instructor-title {
  color: #1a73e8;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.instructor-stats {
  display: flex;
  gap: 15px;
}

.stat {
  text-align: center;
}

.stat-value {
  font-size: 1rem;
  font-weight: bold;
  color: #1a73e8;
}

.stat-label {
  font-size: 0.8rem;
  color: #5f6368;
}

/* 评价表单样式 */
.review-form {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.form-title {
  font-size: 1.1rem;
  margin-bottom: 15px;
  color: #202124;
}

.rating-selector {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.rating-selector label {
  font-weight: 500;
  color: #5f6368;
}

.stars {
  display: flex;
  gap: 5px;
}

.star-icon {
  font-size: 1.5rem;
  color: #dadce0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.star-icon.active {
  color: #f9ab00;
}

.star-icon:hover {
  transform: scale(1.1);
}

.review-input {
  margin-bottom: 15px;
}

.review-input label {
  display: block;
  font-weight: 500;
  color: #5f6368;
  margin-bottom: 8px;
}

.review-input textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #dadce0;
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
}

.review-input textarea:focus {
  outline: none;
  border-color: #1a73e8;
}

.char-count {
  text-align: right;
  font-size: 0.8rem;
  color: #5f6368;
  margin-top: 5px;
}

.btn-submit {
  background: #1a73e8;
  color: white;
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-submit:hover:not(:disabled) {
  background: #0d5bb9;
}

.btn-submit:disabled {
  background: #dadce0;
  cursor: not-allowed;
}

/* 评价列表样式 */
.reviews-grid {
  display: grid;
  gap: 15px;
}

.review-card {
  padding: 15px;
  border: 1px solid #dadce0;
  border-radius: 8px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 10px;
}

.reviewer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reviewer-avatar {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: #1a73e8;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
}

.rating {
  color: #f9ab00;
  font-size: 0.9rem;
}

.review-content {
  color: #202124;
  line-height: 1.5;
  font-size: 0.9rem;
}

/* 相关课程样式 */
.related-courses {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 报名提示区域样式 */
.enroll-hint,
.enroll-success {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
}

.enroll-hint {
  background: rgba(255, 245, 204, 0.3);
  color: #ffc107;
  border: 1px solid rgba(255, 193, 7, 0.3);
}

.enroll-hint i {
  color: #ffc107;
}

.enroll-success {
  background: rgba(52, 168, 83, 0.1);
  color: #34a853;
  border: 1px solid rgba(52, 168, 83, 0.3);
}

.enroll-success i {
  color: #34a853;
}

/* 课程大纲锁定状态样式 */
.locked-content {
  text-align: center;
  padding: 40px 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #dadce0;
}

.locked-icon {
  font-size: 3rem;
  color: #dadce0;
  margin-bottom: 15px;
}

.locked-content h3 {
  font-size: 1.2rem;
  color: #202124;
  margin-bottom: 8px;
}

.locked-content p {
  color: #5f6368;
  margin-bottom: 20px;
}

.btn-enroll-locked {
  background: #1a73e8;
  color: white;
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-enroll-locked:hover {
  background: #0d5bb9;
}

@media (max-width: 768px) {
  .course-meta {
    gap: 15px;
  }
  
  .course-actions {
    flex-direction: column;
  }
  
  .course-actions .btn {
    width: 100%;
    justify-content: center;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .related-courses {
    grid-template-columns: 1fr;
  }
}
</style>