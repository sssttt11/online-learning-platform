<template>
  <div class="chapters-sidebar">
    <div class="chapters-header">
      <h3>课程章节</h3>
    </div>
    <div class="chapters-list">
      <div 
        v-for="chapter in chapters" 
        :key="chapter.chapter_id" 
        class="chapter"
        :class="{ active: isChapterActive(chapter.chapter_id) }"
      >
        <div class="chapter-header" @click="toggleChapter(chapter.chapter_id)">
          <div class="chapter-title">
            <i :class="getChapterIcon(chapter.chapter_id)"></i>
            <span>{{ chapter.chapter_title }}</span>
          </div>
          <span style="font-size: 0.8rem;">{{ chapter.videos?.length || 0 }}个视频</span>
        </div>
        <div class="lessons-list" v-if="isChapterActive(chapter.chapter_id)">
          <div 
            v-for="video in chapter.videos" 
            :key="video.video_id" 
            class="lesson"
            :class="{ active: isVideoActive(video.video_id) }"
            @click="handleVideoSelect(video)"
          >
            <i :class="getVideoIcon(video.video_id)"></i>
            <span>{{ video.video_title }}</span>
            <span class="lesson-duration">{{ formatDuration(video.duration_seconds) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'ChapterList',
  props: {
    chapters: {
      type: Array,
      default: () => []
    },
    currentVideo: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['video-change'],
  setup(props, { emit }) {
    const expandedChapters = ref(new Set())

    // 计算当前章节的活跃状态
    const isChapterActive = (chapterId) => {
      return expandedChapters.value.has(chapterId)
    }

    // 计算当前视频的活跃状态
    const isVideoActive = (videoId) => {
      return props.currentVideo.video_id === videoId
    }

    // 获取章节图标
    const getChapterIcon = (chapterId) => {
      return isChapterActive(chapterId) ? 'fas fa-chevron-down' : 'fas fa-chevron-right'
    }

    // 获取视频图标
    const getVideoIcon = (videoId) => {
      return isVideoActive(videoId) ? 'fas fa-play-circle' : 'far fa-play-circle'
    }

    // 切换章节展开/收起
    const toggleChapter = (chapterId) => {
      if (expandedChapters.value.has(chapterId)) {
        expandedChapters.value.delete(chapterId)
      } else {
        expandedChapters.value.add(chapterId)
      }
    }

    // 处理视频选择
    const handleVideoSelect = (video) => {
      emit('video-change', video)
    }

    // 格式化视频时长
    const formatDuration = (seconds) => {
      if (!seconds) return '00:00'
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    // 自动展开包含当前视频的章节
    const autoExpandCurrentChapter = () => {
      if (props.currentVideo.video_id && props.chapters.length > 0) {
        const currentChapter = props.chapters.find(chapter => 
          chapter.videos?.some(video => video.video_id === props.currentVideo.video_id)
        )
        if (currentChapter) {
          expandedChapters.value.add(currentChapter.chapter_id)
        }
      }
    }

    // 监听当前视频变化
    const unwatch = computed(() => {
      autoExpandCurrentChapter()
      return props.currentVideo
    })

    // 初始化时自动展开
    autoExpandCurrentChapter()

    return {
      expandedChapters,
      isChapterActive,
      isVideoActive,
      getChapterIcon,
      getVideoIcon,
      toggleChapter,
      handleVideoSelect,
      formatDuration
    }
  }
}
</script>

<style scoped>
.chapters-sidebar {
  background: white;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chapters-header {
  padding: 20px;
  border-bottom: 1px solid var(--border);
}

.chapters-header h3 {
  font-size: 1.1rem;
  color: var(--dark);
}

.chapters-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.chapter {
  border-bottom: 1px solid var(--border);
}

.chapter-header {
  padding: 15px 20px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.3s ease;
}

.chapter-header:hover {
  background: var(--primary-light);
}

.chapter-title {
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
}

.lessons-list {
  background: var(--light);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.lesson {
  padding: 10px 20px 10px 45px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}

.lesson:hover {
  background: rgba(26, 115, 232, 0.05);
}

.lesson.active {
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 500;
}

.lesson:last-child {
  border-bottom: none;
}

.lesson-duration {
  color: var(--gray);
  font-size: 0.75rem;
  margin-left: auto;
}

/* 滚动条样式 */
.chapters-list::-webkit-scrollbar {
  width: 6px;
}

.chapters-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.chapters-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.chapters-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>