<template>
  <div class="modal" :class="{active: modelValue}" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h3>更换头像</h3>
        <button class="close-btn" @click="close">&times;</button>
      </div>
      <div class="avatar-upload">
        <div class="preview-area">
          <img v-if="preview" :src="preview" alt="预览" class="preview-img">
          <span v-else>预览</span>
        </div>
        <label for="avatar-file" class="upload-btn"><i class="fas fa-upload"></i> 选择图片</label>
        <input id="avatar-file" type="file" accept="image/*" @change="onFile" style="display: none;">
      </div>
      <button class="btn btn-primary" style="width:100%; margin-top: 1rem;" @click="save" :disabled="!preview">
        保存头像
      </button>
    </div>
  </div>
</template>

<script>
const API_BASE = 'http://localhost:4000';

export default {
  name: 'AvatarModal',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'avatar-updated'],
  data() {
    return {
      preview: '',
      selectedFile: null
    }
  },
  methods: {
    close() {
      this.$emit('update:modelValue', false);
      this.preview = '';
      this.selectedFile = null;
    },
    
    onFile(e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      
      this.selectedFile = file;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        this.preview = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    
    async save() {
      if (!this.selectedFile) return;
      
      try {
        const formData = new FormData();
        formData.append('avatar', this.selectedFile);
        
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/personal/avatar`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        const data = await res.json();
        
        if (data.success) {
          this.$emit('avatar-updated', data.data.avatarUrl);
          this.close();
        } else {
          alert('上传失败: ' + data.message);
        }
      } catch (error) {
        console.error('上传头像失败:', error);
        alert('上传失败，请重试');
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

.avatar-upload {
  text-align: center;
}

.preview-area {
  width: 120px;
  height: 120px;
  border: 2px dashed #ddd;
  border-radius: 50%;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-btn {
  display: inline-block;
  background: #f0f0f0;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.upload-btn:hover {
  background: #e0e0e0;
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
