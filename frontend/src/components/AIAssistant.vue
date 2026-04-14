<template>
  <div class="ai-assistant-container">
    <!-- 对话历史 -->
    <div class="conversation-history" ref="historyRef">
      <!-- 欢迎消息 -->
      <div v-if="conversation.length === 0" class="welcome-message">
        <div class="avatar">
          <i class="fas fa-robot"></i>
        </div>
        <div class="content">
          <div class="text">你好！我是小墨，你的课程学习助手。我可以帮你：</div>
          <ul class="welcome-features">
            <li>📖 解释课程知识点</li>
            <li>🎯 解答学习疑问</li>
            <li>💡 提供学习建议</li>
            <li>📝 总结课程内容</li>
          </ul>
          <div class="quick-questions">
            <div class="quick-title">试试问我：</div>
            <div class="quick-buttons">
              <button v-for="(question, index) in quickQuestions" 
                      :key="index"
                      @click="sendQuickQuestion(question)"
                      class="quick-btn">
                {{ question }}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 对话历史列表 -->
      <div v-for="(msg, index) in conversation" :key="index" 
           :class="['message', msg.role]">
        <div class="avatar">
          <i :class="msg.role === 'user' ? 'fas fa-user' : 'fas fa-robot'"></i>
        </div>
        <div class="content">
          <div class="text" v-html="formatMessage(msg.content)"></div>
          <div class="meta">
            <span class="time">{{ formatTime(msg.timestamp) }}</span>
            <div class="actions" v-if="msg.role === 'assistant'">
              <button @click="copyToClipboard(msg.content)" title="复制">
                <i class="fas fa-copy"></i>
              </button>
              <button @click="regenerateResponse(index)" title="重新生成">
                <i class="fas fa-redo"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="isLoading" class="message assistant loading">
        <div class="avatar">
          <i class="fas fa-robot"></i>
        </div>
        <div class="content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 输入区域 -->
    <div class="input-container">
      <div class="input-wrapper">
        <textarea
          v-model="userInput"
          @keydown.enter.prevent="handleEnterKey"
          placeholder="向小墨提问关于这个视频的问题..."
          :disabled="isLoading"
          rows="2"
        ></textarea>
        <div class="input-actions">
          <button @click="clearConversation" title="清空对话" :disabled="isLoading || conversation.length === 0">
            <i class="fas fa-trash"></i>
          </button>
          <button @click="sendMessage" :disabled="!userInput.trim() || isLoading" class="send-btn">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { chatDeepSeek } from '@/api/deepseek'

const props = defineProps({
  videoId: Number,
  courseId: Number,
  currentTime: Number,
  videoTitle: String,
  courseName: String
})

const emit = defineEmits(['question-submit'])

/* ---------- 响应式状态 ---------- */
const userInput = ref('')
const conversation = ref([])
const isLoading = ref(false)
const error = ref(null)
const historyRef = ref(null)

/* ---------- 快捷问题 ---------- */
const quickQuestions = [
  '这个视频的主要内容是什么？',
  '这个知识点怎么理解？',
  '帮我总结一下重点',
  '有没有相关的练习题？',
  '这个技术在什么场景下使用？'
]

/* ---------- 方法 ---------- */
const scrollToBottom = () => {
  nextTick(() => {
    if (historyRef.value) {
      historyRef.value.scrollTop = historyRef.value.scrollHeight
    }
  })
}

const sendMessage = async () => {
  const message = userInput.value.trim()
  if (!message || isLoading.value) return
  
  // 添加用户消息到对话历史
  const userMessage = {
    role: 'user',
    content: message,
    timestamp: Date.now()
  }
  conversation.value.push(userMessage)
  userInput.value = ''
  
  // 滚动到底部
  scrollToBottom()
  
  try {
    isLoading.value = true
    
    // 构建系统提示词
    const systemPrompt = `你是课程学习助手"小墨"，请用中文回答问题。
当前课程：${props.courseName || '未知课程'}
当前视频：${props.videoTitle || '未知视频'}
请根据课程内容帮助学生解答问题，回答要简洁明了。`

    // 构建消息数组
    const messages = [
      { role: "system", content: systemPrompt }
    ]
    
    // 添加历史对话（最近5轮）
    const recentHistory = conversation.value.slice(-11, -1) // 排除刚添加的用户消息
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })
    })
    
    // 添加当前问题
    messages.push({ role: "user", content: message })

    console.log('🤖 发送AI请求:', messages)
    
    // 直接调用 DeepSeek API
    const response = await chatDeepSeek(messages, 0.7)
    console.log('🤖 AI响应:', response)
    
    if (response && response.success && response.data) {
      // 添加AI回复到对话历史
      const aiMessage = {
        role: 'assistant',
        content: response.data,
        timestamp: Date.now()
      }
      conversation.value.push(aiMessage)
    } else {
      // 添加错误消息
      const errorMessage = {
        role: 'assistant',
        content: response?.msg || '抱歉，AI服务暂时不可用，请稍后再试。',
        timestamp: Date.now(),
        isError: true
      }
      conversation.value.push(errorMessage)
    }
    
    scrollToBottom()
    
  } catch (err) {
    console.error('发送消息失败:', err)
    const errorMessage = {
      role: 'assistant',
      content: '网络连接失败，请检查网络后重试。',
      timestamp: Date.now(),
      isError: true
    }
    conversation.value.push(errorMessage)
    scrollToBottom()
  } finally {
    isLoading.value = false
  }
}

const sendQuickQuestion = (question) => {
  userInput.value = question
  sendMessage()
}

const handleEnterKey = (event) => {
  if (event.shiftKey) {
    // Shift+Enter 换行
    return
  }
  // Enter 发送
  event.preventDefault()
  sendMessage()
}

const clearConversation = () => {
  conversation.value = []
  error.value = null
}

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    // 可以添加复制成功的提示
    console.log('已复制到剪贴板')
  }).catch(err => {
    console.error('复制失败:', err)
  })
}

const regenerateResponse = (index) => {
  // 重新生成指定位置的回复
  if (index > 0 && conversation.value[index].role === 'assistant') {
    const previousUserMessage = conversation.value[index - 1]
    if (previousUserMessage.role === 'user') {
      // 移除当前AI回复
      conversation.value.splice(index, 1)
      // 重新提问
      userInput.value = previousUserMessage.content
      sendMessage()
    }
  }
}

const formatMessage = (content) => {
  // 简单的Markdown转换
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

/* ---------- 生命周期 ---------- */
onMounted(() => {
  scrollToBottom()
})

// 监听videoId变化，重置对话
watch(() => props.videoId, () => {
  clearConversation()
})
</script>

<style scoped>
.ai-assistant-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8f9fa;
}

.conversation-history {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: white;
}

.welcome-message {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #f0f7ff, #e3eeff);
  border-radius: 12px;
  border-left: 4px solid var(--primary-color, #1a73e8);
}

.welcome-message .avatar {
  width: 32px;
  height: 32px;
  background: var(--primary-color, #1a73e8);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.welcome-features {
  margin: 12px 0;
  padding-left: 20px;
  color: #5f6368;
  font-size: 0.9rem;
}

.welcome-features li {
  margin-bottom: 6px;
  padding-left: 4px;
}

.quick-questions {
  margin-top: 16px;
}

.quick-title {
  font-size: 0.85rem;
  color: #5f6368;
  margin-bottom: 8px;
}

.quick-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-btn {
  padding: 6px 12px;
  background: white;
  border: 1px solid #dadce0;
  border-radius: 16px;
  font-size: 0.85rem;
  color: #5f6368;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-btn:hover {
  background: #f0f7ff;
  border-color: var(--primary-color, #1a73e8);
  color: var(--primary-color, #1a73e8);
}

.message {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message.user {
  flex-direction: row-reverse;
}

.message.user .content {
  background: #e3eeff;
  border-radius: 12px 12px 0 12px;
}

.message.assistant .content {
  background: #f8f9fa;
  border-radius: 12px 12px 12px 0;
  border: 1px solid #e9ecef;
}

.message.user .avatar {
  background: #4285f4;
}

.message.assistant .avatar {
  background: #34a853;
}

.message.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.message.content {
  max-width: 80%;
  padding: 12px;
}

.message.user .content {
  margin-left: auto;
}

.message.assistant .content {
  margin-right: auto;
}

.message .text {
  line-height: 1.5;
  font-size: 0.9rem;
  color: #202124;
  word-break: break-word;
}

.message .text code {
  background: #f1f3f4;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.85em;
}

.message .meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.message .time {
  font-size: 0.75rem;
  color: #5f6368;
}

.message .actions {
  display: flex;
  gap: 8px;
}

.message .actions button {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #5f6368;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.message .actions button:hover {
  background: #e9ecef;
  color: var(--primary-color, #1a73e8);
}

.message.loading .content {
  background: transparent;
  border: none;
}

.typing-indicator {
  display: flex;
  gap: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #5f6368;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-8px); }
}

.input-container {
  padding: 16px;
  border-top: 1px solid #dadce0;
  background: white;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-wrapper textarea {
  flex: 1;
  padding: 12px;
  border: 1px solid #dadce0;
  border-radius: 12px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: none;
  min-height: 44px;
  max-height: 120px;
  transition: all 0.2s ease;
}

.input-wrapper textarea:focus {
  outline: none;
  border-color: var(--primary-color, #1a73e8);
  box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.1);
}

.input-wrapper textarea:disabled {
  background: #f8f9fa;
  cursor: not-allowed;
}

.input-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.input-actions button {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: #f8f9fa;
  color: #5f6368;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.input-actions button:hover:not(:disabled) {
  background: #e9ecef;
  color: var(--primary-color, #1a73e8);
}

.input-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-actions .send-btn {
  background: var(--primary-color, #1a73e8);
  color: white;
}

.input-actions .send-btn:hover:not(:disabled) {
  background: #0d5bb9;
}
</style>