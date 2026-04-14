<template>
  <div class="search-results">
    <div class="container">
      <div class="search-meta" v-if="searchQuery || hasSearched">
        <span class="result-count">找到 {{ searchResults.length }} 个相关结果</span>
        <span v-if="searchQuery" class="search-keyword">关键词: "{{ searchQuery }}"</span>
      </div>

      <!-- 搜索建议（无搜索结果时显示） -->
      <div v-if="!searchQuery && !hasSearched" class="suggestions-section">
        <!-- 轮播图展示5分课程 -->
        <CourseCarousel 
          v-if="topRatedCourses && topRatedCourses.length" 
          :courses="topRatedCourses" 
        />

        <!-- 趋势课程 三栏区块 -->
        <!-- 顶部三项横排组件（查漏补缺 / 获得新知识 / 获得紧缺技能） -->
        <div class="benefit-row">
          <div class="benefit-card">
            <div class="benefit-text">查漏补缺</div>
            <div class="benefit-icon"><i class="fas fa-search"></i></div>
          </div>
          <div class="benefit-card">
            <div class="benefit-text">获得新知识</div>
            <div class="benefit-icon"><i class="fas fa-book-open"></i></div>
          </div>
          <div class="benefit-card">
            <div class="benefit-text">获得紧缺技能</div>
            <div class="benefit-icon"><i class="fas fa-award"></i></div>
          </div>
        </div>

        <div class="trending-section">
          <h2 class="section-title">趋势课程</h2>
          <div class="trending-grid">
            <!-- 最受欢迎 -->
            <div class="trend-card">
              <div class="trend-header">最受欢迎</div>
              <div class="trend-list">
                <div 
                  v-for="course in (featuredCourses || []).slice(0,3)" 
                  :key="course.id" 
                  class="trend-item"
                  @click="goToCourse(course.id)"
                >
                  <img :src="getThumbSrc(course.image)" class="trend-thumb" alt="thumb">
                  <div class="trend-info">
                    <div class="trend-provider">{{ course.instructor }}</div>
                    <div class="trend-title">{{ course.title }}</div>
                    <div class="trend-meta">课程 · ★ {{ course.rating || 4.6 }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 每周聚焦 -->
            <div class="trend-card">
              <div class="trend-header">每周聚焦</div>
              <div class="trend-list">
                <div 
                  v-for="course in (recommendedCourses || []).slice(0,3)" 
                  :key="course.id" 
                  class="trend-item"
                  @click="goToCourse(course.id)"
                >
                  <img :src="getThumbSrc(course.image)" class="trend-thumb" alt="thumb">
                  <div class="trend-info">
                    <div class="trend-provider">{{ course.instructor }}</div>
                    <div class="trend-title">{{ course.title }}</div>
                    <div class="trend-meta">课程 · ★ {{ course.rating || 4.7 }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 紧缺的 AI 技能 -->
            <div class="trend-card">
              <div class="trend-header">紧缺的 AI 技能</div>
              <div class="trend-list">
                <div 
                  v-for="course in (topRatedCourses || []).slice(0,3)" 
                  :key="course.id" 
                  class="trend-item"
                  @click="goToCourse(course.id)"
                >
                  <img :src="getThumbSrc(course.image)" class="trend-thumb" alt="thumb">
                  <div class="trend-info">
                    <div class="trend-provider">{{ course.instructor }}</div>
                    <div class="trend-title">{{ course.title }}</div>
                    <div class="trend-meta">专业证书 · ★ {{ course.rating || 4.8 }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="popular-searches">
          <h3>探索类别</h3>
          <div class="popular-tags">
            <span 
              v-for="tag in popularTags" 
              :key="tag"
              class="search-tag"
              @click="$emit('search-by-tag', tag)"
            >
              <i :class="['tag-icon', tagIconClass(tag)]"></i>
              <span class="tag-text">{{ tag }}</span>
            </span>
          </div>
        </div>

        <!-- 中间静态精选卡片区域 -->
        <div class="featured-section">
          <h2 class="section-title">精选课程</h2>
          <div class="courses-grid">
            <CourseCard 
              v-for="course in featuredCourses" 
              :key="course.id"
              :course="course"
            />
          </div>
        </div>

        <!-- 热门讲师 -->
        <div class="hot-instructors">
          <h2 class="section-title">热门讲师</h2>
          <div class="instructor-grid">
            <div class="instructor-card" v-for="inst in hotInstructors" :key="inst.id">
              <div class="instructor-media">
                <div class="instructor-avatar">
                  <i class="fas fa-user"></i>
                </div>
              </div>
              <div class="instructor-body">
                <div class="instructor-name">{{ inst.name }}</div>
                <div class="instructor-desc">{{ inst.bio }}</div>
                <div class="instructor-stats">
                  <div class="stat"><span class="stat-label">学生数：</span><span class="stat-value"> {{ inst.students }}</span></div>
                  <div class="stat"><span class="stat-label">课程数：</span><span class="stat-value"> {{ inst.courses }}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 热门类别（新增） -->
        <div class="popular-categories">
          <h2 class="section-title">最受欢迎的类别</h2>
          <div class="category-grid">
            <div class="category-card">
              <div class="category-header">热门行业</div>
              <div class="category-list">
                <div 
                  v-for="course in (featuredCourses || []).slice(0,3)" 
                  :key="'cat-a-' + course.id" 
                  class="category-item"
                  @click="goToCourse(course.id)"
                >
                  <img :src="getThumbSrc(course.image)" class="category-thumb" alt="thumb">
                  <div class="category-info">
                    <div class="category-provider">{{ course.instructor }}</div>
                    <div class="category-title">{{ course.title }}</div>
                    <div class="category-meta">课程 · ★ {{ course.rating || 4.8 }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="category-card">
              <div class="category-header">热门数据</div>
              <div class="category-list">
                <div 
                  v-for="course in (recommendedCourses || []).slice(0,3)" 
                  :key="'cat-b-' + course.id" 
                  class="category-item"
                  @click="goToCourse(course.id)"
                >
                  <img :src="getThumbSrc(course.image)" class="category-thumb" alt="thumb">
                  <div class="category-info">
                    <div class="category-provider">{{ course.instructor }}</div>
                    <div class="category-title">{{ course.title }}</div>
                    <div class="category-meta">课程 · ★ {{ course.rating || 4.7 }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="category-card">
              <div class="category-header">热门技术</div>
              <div class="category-list">
                <div 
                  v-for="course in (topRatedCourses || []).slice(0,3)" 
                  :key="'cat-c-' + course.id" 
                  class="category-item"
                  @click="goToCourse(course.id)"
                >
                  <img :src="getThumbSrc(course.image)" class="category-thumb" alt="thumb">
                  <div class="category-info">
                    <div class="category-provider">{{ course.instructor }}</div>
                    <div class="category-title">{{ course.title }}</div>
                    <div class="category-meta">课程 · ★ {{ course.rating || 4.6 }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- 下方全部推荐课程列表 -->
        <div v-if="recommendedCourses.length > 0" class="all-courses-section">
          <h2 class="section-title">全部推荐课程</h2>
          <div class="courses-grid">
            <CourseCard 
              v-for="course in recommendedCourses" 
              :key="course.id"
              :course="course"
            />
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-else-if="isLoading" class="loading-section">
          <div class="loading-spinner"></div>
          <p>正在加载课程...</p>
        </div>
      </div>

      <!-- 搜索结果 -->
      <div v-else class="search-results-content">
        <!-- 加载状态 -->
        <div v-if="isLoading" class="loading-section">
          <div class="loading-spinner"></div>
          <p>正在搜索中...</p>
        </div>

        <!-- 无结果 -->
        <div v-else-if="searchResults.length === 0 && hasSearched" class="no-results">
          <div class="no-results-icon">
            <i class="fas fa-search"></i>
          </div>
          <h3>没有找到相关课程</h3>
          <p>建议您尝试其他关键词或浏览课程分类</p>
          <button class="btn-primary" @click="$emit('clear-search')">返回浏览课程</button>
        </div>

        <!-- 有结果 -->
        <div v-else-if="searchResults.length > 0" class="results-section">
          <div class="results-header">
            <h2 class="section-title">搜索结果</h2>
            <div class="sort-options">
              <select :value="sortBy" @change="$emit('update:sort-by', $event.target.value)" class="sort-select">
                <option value="relevance">按相关性</option>
                <option value="rating">按评分</option>
                <option value="students">按学习人数</option>
                <option value="newest">按最新发布</option>
              </select>
            </div>
          </div>

          <div class="results-grid">
            <CourseCard 
              v-for="course in sortedResults" 
              :key="course.id"
              :course="course"
            />
          </div>
        </div>
      </div>

      <!-- 推荐课程（搜索后显示） -->
      <div v-if="hasSearched && searchResults.length > 0" class="recommended-section">
        <h2 class="section-title">相关推荐</h2>
        <div class="courses-grid">
          <CourseCard 
            v-for="course in recommendedCourses" 
            :key="course.id"
            :course="course"
          />
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import CourseCard from '@/components/course/CourseCard.vue'
import CourseCarousel from '@/components/course/CourseCarousel.vue'
import Footer from '@/components/layout/Footer.vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

defineProps({
  searchQuery: String,
  searchResults: Array,
  isLoading: Boolean,
  hasSearched: Boolean,
  sortBy: String,
  popularTags: Array,
  featuredCourses: Array,
  recommendedCourses: Array,
  sortedResults: Array,
  topRatedCourses: Array
})

defineEmits(['update:sort-by', 'search-by-tag', 'clear-search', 'perform-search'])
// 热门讲师模拟数据（占位头像、名称与统计）
const hotInstructors = [
  { id: 1, name: '李老师', bio: '后端开发与算法讲师，擅长高效编码教学。', students: '13,210', courses: 24 },
  { id: 2, name: '王老师', bio: '机器学习与数据分析专家，项目驱动教学。', students: '9,870', courses: 18 },
  { id: 3, name: '赵老师', bio: '英语提分与学习方法论实践者。', students: '6,320', courses: 12 },
  { id: 4, name: '陈老师', bio: '数学基础与微积分系统课程讲师。', students: '11,560', courses: 20 }
]

// 为热门标签提供简易图标映射（使用 Font Awesome）
const tagIconClass = (tag) => {
  const map = {
    '考公务员': 'fas fa-briefcase',
    '考研': 'fas fa-graduation-cap',
    '四六级': 'fas fa-language',
    '教师资格证': 'fas fa-chalkboard-teacher',
    '会计师': 'fas fa-calculator',
    '建造师': 'fas fa-drafting-compass',
    '法考': 'fas fa-balance-scale',
    '医师资格': 'fas fa-notes-medical'
  }
  return map[tag] || 'fas fa-tag'
}

// 与 CourseCard 一致的占位域名判断
const isPlaceholderDomain = (url) => {
  if (!url || typeof url !== 'string') return false
  const host = url.replace(/^https?:\/\//, '').split('/')[0]
  const blocked = ['via.placeholder.com', 'placehold.it', 'placehold.co']
  return blocked.some(b => host.includes(b))
}

// 趋势区缩略图占位图处理
const getThumbSrc = (image) => {
  let imageUrl = image
  if (!imageUrl || isPlaceholderDomain(imageUrl)) {
    return '/default-course.svg'
  }
  return imageUrl
}

const router = useRouter()

const goToCourse = (id) => {
  if (!id) return
  router.push(`/course/${id}`)
}
</script>

<style scoped>
/* 搜索结果容器 */
.search-results {
  background: #f8f9fa;
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 顶部搜索结果信息条 */
.search-meta {
  padding-top: 20px;
  padding-bottom: 10px;
  display: flex;
  justify-content: flex-start;
  gap: 20px;
  flex-wrap: wrap;
  font-size: 0.9rem;
  color: #5f6368;
}

.result-count,
.search-keyword {
  opacity: 0.9;
}

/* 搜索建议 */
.suggestions-section {
  /* 上下内边距过大导致整体位置偏下，缩小以上移 */
  padding: 14px 0;
  text-align: center;
}

.featured-section {
  margin: 40px 0;
}

.featured-section .section-title {
  margin-bottom: 30px;
  text-align: center;
}

.popular-searches h3 {
  margin-bottom: 26px;
  color: black;
  font-size: 1.5rem;
  text-align: left;
}

.popular-tags {
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 12px;
}

.search-tag {
  background: rgba(66, 180, 246, 0.12);
  color: #0b3757;
  padding: 10px 16px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid rgba(66, 180, 246, 0.22);
  font-size: 0.92rem;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.search-tag:hover {
  background: rgba(66, 180, 246, 0.2);
  border-color: rgba(66, 180, 246, 0.38);
}

.tag-icon {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #2b7bb9;
  background: rgba(66, 180, 246, 0.16);
  font-size: 0.9rem;
}

.tag-text {
  line-height: 1;
}

/* 搜索结果 */
.search-results-content {
  /* 缩小结果区的上下间距以整体上移 */
  padding: 20px 0;
}

.loading-section {
  text-align: center;
  padding: 60px 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1a73e8;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-results {
  text-align: center;
  padding: 80px 0;
}

.no-results-icon {
  font-size: 4rem;
  color: #dadce0;
  margin-bottom: 20px;
}

.no-results h3 {
  margin-bottom: 10px;
  color: #202124;
}

.no-results p {
  color: #5f6368;
  margin-bottom: 30px;
}

.btn-primary {
  background: #1a73e8;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s ease;
}

.btn-primary:hover {
  background: #0d5bb9;
}

/* 结果头部 */
.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 20px;
}

.section-title {
  font-size: 1.5rem;
  color: #202124;
}

.sort-select {
  padding: 8px 16px;
  border: 1px solid #dadce0;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 50px;
}

/* 推荐课程 */
.recommended-section {
  padding: 40px 0;
  border-top: 1px solid #dadce0;
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  width: 100%;
}

@media (min-width: 1200px) {
  .courses-grid {
    grid-template-columns: repeat(5, 1fr);
    max-width: 100%;
  }
}

.all-courses-section {
  padding: 40px 0 60px;
}

.all-courses-section .section-title {
  margin-bottom: 30px;
  text-align: center;
}

/* 热门讲师样式 */
.hot-instructors {
  padding: 16px 0 8px;
}

.instructor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 18px;
}

.instructor-card {
  background: #ffffff;
  border: 1px solid rgba(14,66,120,0.12);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 6px 14px rgba(11,45,70,0.04);
  margin-bottom: 20px;
  text-align: left;
}

.instructor-card .instructor-name {
  font-size: 20px;
  font-weight: 600;
  color: balck;
  margin-bottom: 8px;
  margin-left: 5px;
}

.instructor-card .instructor-desc {
  font-size: 14px;
  color: #666;
  margin-left: 5px;
  margin-bottom: 10px;
}

.instructor-media {
  background: #ffffff;
  padding: 12px;
}

.instructor-avatar {
  width: 100%;
  height: 110px;
  border-radius: 10px;
  background: #abcdfa84;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #395b84;
  font-size: 34px;
}

/* 使所有卡片中的图片看起来有白底、内边距和圆角（匹配示例） */
.instructor-media img,
.instructor-avatar img,
.trend-thumb,
.category-thumb {
  background: #ffffff;
  border-radius: 10px;
  padding: 6px;
  border: 1px solid rgba(14,66,120,0.06);
  box-shadow: none;
  object-fit: cover;
}

.instructor-body {
  padding: 10px 12px 12px;
}

.instructor-name {
  font-size: 0.98rem;
  font-weight: 700;
  color: #0b3757;
  margin-bottom: 4px;
}

.instructor-desc {
  color: #567593;
  font-size: 0.86rem;
  line-height: 1.5;
  margin-bottom: 8px;
}

.instructor-stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stat {
  background: #ffffff;
  border: 1px solid rgba(11,45,70,0.06);
  padding: 6px 10px;
  border-radius: 8px;
}

.stat-value {
  color: #0b3757;
  font-weight: 600;
  font-size: 0.9rem;
}

.stat-label {
  color: #6b7e90;
  margin-left: 6px;
  font-size: 0.84rem;
}

@media (min-width: 1200px) {
  .instructor-grid { grid-template-columns: repeat(4, 1fr); }
}

/* 顶部三项横排组件样式 */
.benefit-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin: 10px 0 18px;
}
.benefit-card {
  background: linear-gradient(270deg, #eee6f9, #d8e9f9);
  border-radius: 14px;
  padding: 18px 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 14px rgba(99, 72, 234, 0.04);
  margin-top: 20px;
  margin-bottom: 20px;
}
.benefit-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: #12263b;
  margin-left: 25px;
}
.benefit-icon {
  width: 64px;
  height: 64px;
  background: rgba(99,72,234,0.06);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b28c9;
  font-size: 1.4rem;
}

@media (max-width: 900px) {
  .benefit-row { grid-template-columns: 1fr; }
}

/* 趋势课程 三栏样式 */
.trending-section {
  /* 不要整体背景色，仅留外边距 */
  background: transparent;
  padding: 0;
  margin: 20px 0 24px;
}

.trending-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.trend-card {
  /* 三个独立框，底色稍微深一点 */
  background: #deebff;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 20px;
}

.trend-header {
  font-weight: 700;
  color: #173c64;
  margin-bottom: 10px;
  text-align: left;
}

.trend-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.trend-item {
  display: flex;
  gap: 12px;
  align-items: center;
  background: #ffffff;
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 4px 10px rgba(11,45,70,0.06);
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}

.trend-thumb {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  object-fit: cover;
  transition: transform 0.22s ease;
}

.trend-info {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.trend-provider {
  font-size: 0.85rem;
  color: #517ea3;
  text-align: left;
}

.trend-title {
  font-size: 0.98rem;
  color: #0b3757;
  font-weight: 700;
  text-align: left;
}

.trend-meta {
  font-size: 0.82rem;
  color: #5a6e80;
  text-align: left;
}

/* 热门类别（新增样式） */
.popular-categories {
  margin: 20px 0 28px;
}
.category-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.category-card {
  background: #deebff;
  border-radius: 12px;
  padding: 12px;
}
.category-header {
  font-weight: 700;
  color: #173c64;
  margin-bottom: 10px;
  text-align: left;
}
.category-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.category-item {
  display: flex;
  gap: 12px;
  align-items: center;
  background: #ffffff;
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 4px 10px rgba(11,45,70,0.06);
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}
.category-thumb {
  width: 64px;
  height: 64px;
  border-radius: 10px;
  object-fit: cover;
  transition: transform 0.22s ease;
}

/* Hover effects: slight lift and stronger shadow, thumbnail mild scale */
.trend-item:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(11,45,70,0.12);
}
.trend-item:hover .trend-thumb { transform: scale(1.06); }

.category-item:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(11,45,70,0.12);
}
.category-item:hover .category-thumb { transform: scale(1.04); }
.category-info { display: flex; flex-direction: column; text-align: left; }
.category-provider { font-size: 0.85rem; color: #517ea3; }
.category-title { font-size: 0.98rem; color: #0b3757; font-weight: 700; }
.category-meta { font-size: 0.82rem; color: #5a6e80; }

@media (max-width: 768px) {
  .trending-grid { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .results-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .results-grid,
  .courses-grid {
    grid-template-columns: 1fr;
  }
  
  .search-meta {
    flex-direction: column;
    gap: 10px;
  }
}
</style>