<template>
  <div class="modal" :class="{active: modelValue}" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h3>修改用户名</h3>
        <button class="close-btn" @click="close">&times;</button>
      </div>
      <div class="form-group">
        <label>新用户名</label>
        <input 
          v-model="draft" 
          type="text" 
          class="form-input"
          :placeholder="currentName"
          maxlength="20"
          @keydown.enter="save"
        >
        <div class="input-hint">用户名长度为2-20个字符</div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" @click="close">取消</button>
        <button class="btn btn-primary" @click="save" :disabled="!canSave">保存</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NameModal',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    currentName: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue', 'name-updated'],
  data() {
    return {
      draft: ''
    }
  },
  computed: {
    canSave() {
      return this.draft.trim().length >= 2 && 
             this.draft.trim().length <= 20 && 
             this.draft.trim() !== this.currentName;
    }
  },
  watch: {
    modelValue(newVal) {
      if (newVal) {
        this.draft = this.currentName;
      }
    }
  },
  methods: {
    close() {
      this.$emit('update:modelValue', false);
      this.draft = '';
    },
    
    async save() {
      if (!this.canSave) return;
      
      try {
        this.$emit('name-updated', this.draft.trim());
        this.close();
      } catch (error) {
        console.error('更新用户名失败:', error);
        alert('更新用户名失败，请重试');
      }
    }
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
  padding: 2rem;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #1a73e8;
}

.input-hint {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #666;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #1a73e8;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1557b0;
}

.btn-secondary {
  background: #f8f9fa;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background: #e9ecef;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
