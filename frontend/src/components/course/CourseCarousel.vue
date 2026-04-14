<template>
  <div class="course-carousel" v-if="courses && courses.length">
    <div class="carousel-block">
      <!-- 左侧：现有轮播内容 -->
      <div class="carousel-left">
        <div class="carousel-inner">
          <div class="carousel-slide" :style="backgroundStyle" @click="goDetail">
            <div class="carousel-info">
              <h2 class="carousel-title">{{ currentCourse.title }}</h2>
              <p class="carousel-desc">{{ currentCourse.description }}</p>
              <div class="carousel-meta">
                <span class="teacher">{{ currentCourse.instructor }}</span>
                <span class="stat">{{ currentCourse.students }} 人学习</span>
              </div>
            </div>
          </div>
          <button class="nav-btn prev" @click="prev">‹</button>
          <button class="nav-btn next" @click="next">›</button>
        </div>
        <div class="dots">
          <span
            v-for="(c, index) in courses"
            :key="c.id"
            class="dot"
            :class="{ active: index === currentIndex }"
            @click="goIndex(index)"
          />
        </div>
      </div>

      <!-- 右侧：个人信息卡 -->
      <div class="carousel-right">
        <div class="profile-card" :style="profileCardStyle">
          <div class="profile-top centered">
            <img
              v-if="userAvatar"
              :src="userAvatar"
              alt="avatar"
              class="profile-avatar centered-avatar clickable-avatar"
              @click="goPersonal"
              role="button"
              tabindex="0"
              @keyup.enter="goPersonal"
            />
            <div
              v-else
              class="profile-avatar placeholder centered-avatar clickable-avatar"
              @click="goPersonal"
              role="button"
              tabindex="0"
              @keyup.enter="goPersonal"
            >
              {{ userInitial }}
            </div>
          </div>

          <div class="profile-name">{{ userName || '未登录用户' }}</div>

          <div class="learning-list card-like">
            <h4>我的课程</h4>
            <ul :style="{ gap: enrolledGap + 'px' }">
              <li v-for="(c, idx) in enrolled.slice(0,3)" :key="c.course_id">
                <a href="#" @click.prevent="goCourse(c.course_id)">{{ c.course_name }}</a>
              </li>
              <li v-if="enrolled.length === 0">暂无课程</li>
            </ul>
          </div>

          <div class="profile-actions">
            <button class="btn-primary full" @click="goPersonal">个人中心</button>
            <button class="btn-ghost full" v-if="!isLogged" @click="goLogin">去登录</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user.js'

const props = defineProps({
  courses: {
    type: Array,
    default: () => []
  }
})

const router = useRouter()
const userStore = useUserStore()
const currentIndex = ref(0)
const enrolled = ref([])
// 以 store 的登录状态为准（响应式），若没有则回退到 token 判断
const isLogged = computed(() => userStore.isLoggedIn || !!localStorage.getItem('token'))

// 优先使用 store 中的用户名（响应式），其次尝试 localStorage 中的 user 字段
const userName = computed(() => {
  if (userStore.userName) return userStore.userName
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}')
    return u.user_name || u.userName || ''
  } catch (e) {
    return ''
  }
})

const userAvatar = computed(() => {
  if (userStore.avatar) return userStore.avatar
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}')
    return u.avatar_url || u.avatarUrl || ''
  } catch (e) {
    return ''
  }
})

const userInitial = computed(() => {
  try {
    const name = userStore.userName || (() => { const u = JSON.parse(localStorage.getItem('user')||'{}'); return u.user_name || u.userName || '' })()
    if (!name) return '用'
    return name.trim().charAt(0).toUpperCase()
  } catch (e) {
    return '用'
  }
})

watch(
  () => props.courses,
  (list) => {
    if (!list || !list.length) {
      currentIndex.value = 0
    } else if (currentIndex.value >= list.length) {
      currentIndex.value = 0
    }
  },
  { immediate: true }
)

const currentCourse = computed(() => {
  return props.courses[currentIndex.value] || {}
})

onMounted(async () => {
  // 尝试拉取用户信息和正在学习的课程（如果已登录）
  const token = localStorage.getItem('token')
  // 如果有 token，并且 store 中尚未有用户名，尝试拉取用户信息到 store
  if (token && !userStore.userName) {
    try {
      await userStore.fetchUserProfile()
    } catch (err) {
      console.warn('拉取用户信息失败:', err)
    }
  }
  if (!isLogged.value) return
  try {
    const res = await fetch('http://localhost:4000/api/personal/library', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      const body = await res.json()
      enrolled.value = body.data || []
    } else {
      // 忽略错误（比如 401），不阻塞轮播显示
      enrolled.value = []
    }
  } catch (err) {
    console.warn('拉取已报名课程失败:', err)
    enrolled.value = []
  }
})

// 动态计算课程列表间距（根据已报名课程数量自动调整）
const enrolledGap = computed(() => {
  const n = Math.min(3, enrolled.value.length)
  if (n === 0) return 18
  if (n === 1) return 18
  if (n === 2) return 14
  return 10
})

// 让右侧卡高度与左侧轮播对齐（使用 CSS grid stretch）；profileCardStyle 作为补充样式
const profileCardStyle = computed(() => ({ height: '100%' }))

const backgroundStyle = computed(() => {
  const c = currentCourse.value
  if (c.cover_img) {
    return {
      backgroundImage: `linear-gradient(120deg, rgba(0,0,0,0.55), rgba(0,0,0,0.35)), url(${c.cover_img})`
    }
  }
  if (c.image) {
    return {
      background: c.image
    }
  }
  return {
    background: 'linear-gradient(135deg, #667eea, #764ba2)'
  }
})

const next = () => {
  if (!props.courses.length) return
  currentIndex.value = (currentIndex.value + 1) % props.courses.length
}

const prev = () => {
  if (!props.courses.length) return
  currentIndex.value = (currentIndex.value - 1 + props.courses.length) % props.courses.length
}

const goIndex = (index) => {
  currentIndex.value = index
}

const goDetail = () => {
  const c = currentCourse.value
  if (c && c.id) {
    router.push(`/course/${c.id}`)
  }
}

const goCourse = (id) => {
  if (!id) return
  router.push(`/course/${id}`)
}

const goPersonal = () => {
  router.push('/personal')
}

const goLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.course-carousel{ margin: 32px 0 }

.carousel-block{ display:grid; grid-template-columns: 1fr 320px; gap:20px; align-items:stretch }

.carousel-left{ display:flex; flex-direction:column }
.carousel-inner{ position:relative; border-radius:12px; overflow:hidden; box-shadow:0 12px 30px rgba(0,0,0,0.08); flex:1; display:flex; flex-direction:column }
.carousel-slide{ flex:1; min-height:360px; background-size:cover; background-position:center; display:flex; align-items:flex-end; cursor:pointer }
.carousel-info{ 
  padding:28px 34px; 
  /* background: linear-gradient(180deg, rgba(0,0,0,0.0), rgba(0,0,0,0.18)); */
  background: rgba(0,0,0,0.0);
  color:#fff 
}
.carousel-title{ 
  font-size:2rem; 
  font-weight:800; 
  /* margin:0 0 10px  */
  text-align: left;
  margin-bottom: 10px;
  color: rgb(247, 247, 249);
}
.carousel-desc{ font-size:15px; opacity:0.95; line-height:1.6; max-height:4.2em; overflow:hidden }
.carousel-meta{ margin-top:10px; font-size:13px; opacity:0.9; display:flex; gap:14px }

.nav-btn{ position:absolute; top:50%; transform:translateY(-50%); width:36px; height:36px; border-radius:50%; border:none; background:rgba(255,255,255,0.95); box-shadow:0 6px 16px rgba(0,0,0,0.08); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:20px }
.nav-btn.prev{ left:12px }
.nav-btn.next{ right:12px }

.dots{ display:flex; justify-content:center; gap:8px; margin-top:12px }
.dot{ width:9px; height:9px; border-radius:50%; background:#e6e9ef }
.dot.active{ background:var(--mz-primary,#1a73e8) }

/* 右侧个人卡 */

.profile-card{
  background: linear-gradient(180deg,#ffffff 0%, #fbfdff 100%);
  border-radius:14px;
  padding:18px;
  box-shadow: 0 10px 30px rgba(16,40,60,0.08);
  display:flex;
  flex-direction:column;
  gap:14px;
  height:100%;
  border: 1px solid rgba(11,45,70,0.03);
}
.profile-top{
  display:flex;
  align-items:center;
  gap:12px;
  padding-bottom:6px;
  border-bottom: 1px dashed rgba(11,45,70,0.03);
}
.profile-top.centered{ justify-content:center }
.centered-avatar{ width:72px; height:72px; border-radius:50%; object-fit:cover }
.profile-avatar{ width:72px; height:72px; border-radius:50%; object-fit:cover; border: 3px solid rgba(255,255,255,0.6); box-shadow: 0 6px 18px rgba(26,115,232,0.08); }
.profile-avatar.placeholder{ width:72px; height:72px; display:flex; align-items:center; justify-content:center; background:linear-gradient(90deg,var(--mz-primary,#1a73e8),#764ba2); color:white; border-radius:50%; font-weight:800; font-size:24px }
.profile-name{ text-align:center; font-weight:700; color:#0b2b3b; margin:0; font-size:2.05rem }

.learning-list.card-like{ background:transparent; border-radius:10px; padding:12px; border:1px solid rgba(11,45,70,0.04) }
.learning-list h4{ margin:0 0 8px; font-size:1.05rem; color:#334155; text-align: center; font-size: 1.2rem;}
.learning-list ul{ list-style:none; padding:0; margin:0; display:flex; flex-direction:column }
.learning-list a{ color:#0b63c6; text-decoration:none; font-size:0.95rem }
.learning-list a:hover{ text-decoration:underline }

.profile-actions{ margin-top:auto; display:flex; gap:10px; flex-direction:column }
.btn-primary{ background: linear-gradient(90deg,var(--mz-primary,#1a73e8),#764ba2); color:white; padding:10px 14px; border-radius:10px; border:none; cursor:pointer; box-shadow: 0 8px 20px rgba(26,115,232,0.12); transition: transform .12s ease, box-shadow .12s ease }
.btn-primary.full{ width:100% }
.btn-primary:hover{ transform: translateY(-2px); box-shadow: 0 14px 30px rgba(26,115,232,0.18) }
.btn-ghost{ background:transparent; border:1px solid rgba(11,45,70,0.08); padding:8px 12px; border-radius:10px; cursor:pointer }
.btn-ghost.full{ width:100% }

/* 可点击头像样式 */
.clickable-avatar{ cursor: pointer }
.clickable-avatar:focus{ outline: 3px solid rgba(26,115,232,0.14); outline-offset: 2px; border-radius:50% }

@media (max-width: 992px){
  .carousel-block{ grid-template-columns: 1fr }
  .profile-card{ order:2 }
}

</style>
