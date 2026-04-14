<template>
  <div class="course-card" @click="handleCardClick">
    <div class="card-shell">
      <div class="media-wrapper">
        <div class="course-image" :style="getImageStyle(course.image)">
          <div class="expand-icon" aria-hidden="true"><i class="fas fa-expand"></i></div>
          <!-- 覆盖在图片上的指标条 -->
          <div class="metrics-overlay">
            <div class="pill"><i class="fas fa-heart"></i> 22</div>
            <div class="pill"><i class="fas fa-comment"></i> 12</div>
            <div class="pill"><i class="fas fa-eye"></i> {{ course.students }}</div>
          </div>
        </div>
      </div>

      <div class="card-body">
        <h3 class="course-title">{{ course.title }}</h3>
        <div class="instructor">{{ course.instructor }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  course: {
    type: Object,
    required: true
  }
})

const router = useRouter()

const handleCardClick = () => {
  router.push(`/course/${props.course.id}`)
}

// 检测是否为常见的外部占位图域名
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

const getImageStyle = (image) => {
  let imageUrl = image
  if (!imageUrl || isPlaceholderDomain(imageUrl)) {
    // 使用本地回退图，避免外部占位图导致的 DNS/加载错误
    imageUrl = '/default-course.svg'
  }

  if (typeof imageUrl === 'string' && (imageUrl.startsWith('http') || imageUrl.startsWith('/'))) {
    return {
      backgroundImage: `url(${imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }
  }

  // 如果不是 URL，则回退为柔和渐变
  return {
    background: 'linear-gradient(135deg, #eef7ff, #f7fbff)'
  }
}
</script>

<style scoped>
:root{
  --primary: rgb(41,180,246); /* 更明亮的淡蓝色 */
  --primary-dark: #12a7d9;
  --card-bg: #f9fbfe; /* 更轻的卡片外壳 */
  --panel-bg: #26292b; /* 媒体深色面板 */
  --muted: #6f7377;
}

.course-card{
  width:100%;
  cursor:pointer;
  display:block;
}

.card-shell{
  background: var(--card-bg);
  border-radius: 12px;
  padding: 10px;
  transition: transform 0.28s ease, box-shadow 0.28s ease;
  box-shadow: 0 10px 0 rgba(0,0,0,0.04);
  overflow: visible;
}

.media-wrapper{
  position:relative;
}

.course-image{
  background:#222;
  height:160px;
  border-radius:10px;
  box-shadow: 0 8px 24px rgba(41,180,246,0.06) inset, 0 12px 30px rgba(0,0,0,0.20);
  transition: transform 0.28s ease;
  position:relative;
}

.expand-icon{
  position:absolute;
  top:12px;
  right:12px;
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.85);
  padding:8px;
  border-radius:8px;
  font-size:12px;
  display:flex;
  align-items:center;
  justify-content:center;
}

/* 移除小头像块 */

.card-body{
  padding: 12px 10px 8px 10px;
  background: transparent;
}

.course-title{
  font-size:1rem;
  font-weight:700;
  color:#0b2b3b;
  margin:0 0 4px 0;
  line-height: 1.4;
  /* 保留两行的占位空间，短标题也留白 */
  min-height: 2.8em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.instructor{
  color: rgba(11,43,59,0.78);
  font-size:0.85rem;
}

/* 指标行改为覆盖显示在图片内 */
.metrics-overlay{
  position:absolute;
  left:0;
  right:0;
  bottom:0;
  display:flex;
  gap:14px;
  align-items:center;
  /* 方形的，上浅下深的灰黑色渐变，宽度与图片一致 */
  background: linear-gradient(180deg, rgba(252, 252, 252, 0.741), rgba(36, 36, 36, 0.352));
  border-radius:0 0 10px 10px;
  padding: 8px 14px;
  backdrop-filter: none;
}

.pill{
  display:inline-flex;
  align-items:center;
  gap:6px;
  background: transparent; /* 去掉每个组件自身背景 */
  color: #0b2b3b;
  padding:0;
  border-radius:0;
  font-weight:600;
  font-size:0.82rem;
}

/* .pill i{ color: rgba(255, 255, 255, 0.9); } */
.pill:has(.fa-heart) i {
  color: rgba(249, 72, 36, 0.934);
}

/* 评论 */
.pill:has(.fa-comment) i {
  color: rgba(74, 74, 74, 0.9);
}

/* 浏览 */
.pill:has(.fa-eye) i {
  color: rgba(43, 43, 43, 0.9); 
}

.card-shell .course-title, .card-shell .instructor, .card-shell .pill{ color: #0b2b3b; }

.course-card:hover .card-shell{
  transform: translateY(-6px) scale(1.005);
  /* 更中性且柔和的悬停效果：几乎白色的浅渐变 + 轻微边框与阴影 */
  box-shadow: 0 18px 36px rgba(11,45,70,0.06);
  background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,252,255,0.98));
  border: 1px solid rgba(11,45,70,0.04);
}

.course-card:hover .course-image{
  transform: scale(1.02);
  box-shadow: 0 18px 40px rgba(0,0,0,0.24);
}

.course-card:hover .card-body{ background: transparent; }

@media (max-width:768px){
  .course-image{ height:140px; }
}
</style>