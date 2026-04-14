<template>
  <div class="modal" :class="{ active: modelValue }" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h3>编辑个人资料</h3>
        <button class="close-btn" @click="close">&times;</button>
      </div>
      <div class="form-group">
        <label>昵称 <span class="required">*</span></label>
        <input 
          v-model="form.userName" 
          type="text" 
          class="form-input" 
          placeholder="请输入昵称"
          maxlength="20"
          :class="{ 'error': errors.userName }"
        />
        <div v-if="errors.userName" class="error-text">{{ errors.userName }}</div>
      </div>
      <div class="form-group">
        <label>邮箱 <span class="required">*</span></label>
        <input 
          v-model="form.email" 
          type="email" 
          class="form-input" 
          placeholder="请输入邮箱"
          :class="{ 'error': errors.email }"
        />
        <div v-if="errors.email" class="error-text">{{ errors.email }}</div>
      </div>
      <div class="form-group">
        <label>个性签名</label>
        <textarea 
          v-model="form.userIntro" 
          class="form-input" 
          rows="3" 
          placeholder="写点什么介绍自己吧～"
          maxlength="100"
        />
        <div class="char-count">{{ form.userIntro.length }}/100</div>
      </div>
      <button class="btn btn-primary" @click="save" :disabled="saving">
        {{ saving ? '保存中...' : '保存' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, ref } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  userName: { type: String, default: '' },
  email: { type: String, default: '' },
  userIntro: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'save'])

const form = reactive({
  userName: '',
  email: '',
  userIntro: ''
})

const errors = reactive({
  userName: '',
  email: ''
})

const saving = ref(false)

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      form.userName = props.userName || ''
      form.email = props.email || ''
      form.userIntro = props.userIntro || ''
    }
  }
)

function close() {
  if (saving.value) return
  emit('update:modelValue', false)
}

function validateForm() {
  errors.userName = ''
  errors.email = ''
  
  if (!form.userName.trim()) {
    errors.userName = '昵称不能为空'
  } else if (form.userName.length < 2) {
    errors.userName = '昵称至少需要2个字符'
  }
  
  if (!form.email.trim()) {
    errors.email = '邮箱不能为空'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = '请输入有效的邮箱地址'
  }
  
  return !errors.userName && !errors.email
}

async function save() {
  if (!validateForm()) {
    return
  }
  
  saving.value = true
  try {
    await emit('save', { ...form })
    emit('update:modelValue', false)
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.modal.active {
  opacity: 1;
  visibility: visible;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 1.8rem;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: #666;
}

.form-group {
  margin-bottom: 1rem;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
}

.btn {
  width: 100%;
  padding: 0.7rem 1.2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary {
  background: #1a73e8;
  color: white;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.required {
  color: #e74c3c;
}

.form-input.error {
  border-color: #e74c3c;
}

.error-text {
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 0.3rem;
}

.char-count {
  text-align: right;
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.3rem;
}
</style>
