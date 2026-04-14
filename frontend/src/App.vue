<template>
  <div id="app">
    <!-- 全局导航栏，只在需要的页面显示 -->
    <HeaderNav v-if="shouldShowNav" />
    <router-view />
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import HeaderNav from '@/components/layout/HeaderNav.vue'

export default {
  name: 'App',
  components: {
    HeaderNav
  },
  setup() {
    const route = useRoute()
    
    // 定义不需要显示导航栏的页面
    const noNavPages = ['/login', '/register']
    
    // 计算是否应该显示导航栏
    const shouldShowNav = computed(() => {
      return !noNavPages.includes(route.path)
    })
    
    return {
      shouldShowNav
    }
  }
}
</script>

<style>
/* 全局样式 */
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
  min-height: 100vh;
  /* 允许页面纵向滚动（之前设置为 hidden 导致整个页面无法滚动） */
  overflow-y: auto;
}

#app {
  min-height: 100vh;
}

/* 确保页面内容不被导航栏遮挡 */
.search-results,
.community,
.course-detail,
.course-video,
.personal-center {
  padding-top: 20px;
}
</style>