<template>
  <div class="modal" :class="{active: modelValue}" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h3>账户设置</h3>
        <button class="close-btn" @click="close">&times;</button>
      </div>
      
      <div class="settings-section">
        <h4>修改密码</h4>
        <div class="form-group">
          <label>当前密码</label>
          <input 
            v-model="passwordForm.oldPassword" 
            type="password" 
            class="form-input"
            placeholder="请输入当前密码"
          >
        </div>
        <div class="form-group">
          <label>新密码</label>
          <input 
            v-model="passwordForm.newPassword" 
            type="password" 
            class="form-input"
            placeholder="请输入新密码（6-20位）"
          >
        </div>
        <div class="form-group">
          <label>确认新密码</label>
          <input 
            v-model="passwordForm.confirmPassword" 
            type="password" 
            class="form-input"
            placeholder="请再次输入新密码"
          >
        </div>
        <button class="btn btn-primary" @click="changePassword" :disabled="!canChangePassword">
          <i class="fas fa-key"></i> 修改密码
        </button>
      </div>
      
      <div class="settings-section">
        <h4>账户操作</h4>
        <button class="btn btn-danger" @click="logout" style="width: 100%;">
          <i class="fas fa-sign-out-alt"></i> 退出登录
        </button>
      </div>
    </div>
  </div>
</template>

<script>
const API_BASE = 'http://localhost:4000';

export default {
  name: 'SettingsModal',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      passwordForm: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    }
  },
  computed: {
    canChangePassword() {
      return this.passwordForm.oldPassword.length > 0 &&
             this.passwordForm.newPassword.length >= 6 &&
             this.passwordForm.newPassword.length <= 20 &&
             this.passwordForm.newPassword === this.passwordForm.confirmPassword;
    }
  },
  methods: {
    close() {
      this.$emit('update:modelValue', false);
      this.resetForm();
    },
    
    resetForm() {
      this.passwordForm = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
    },
    
    async changePassword() {
      if (!this.canChangePassword) return;
      
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/personal/password`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            oldPassword: this.passwordForm.oldPassword,
            newPassword: this.passwordForm.newPassword
          })
        });
        
        const data = await res.json();
        
        if (data.success) {
          alert('密码修改成功');
          this.close();
        } else {
          alert('密码修改失败: ' + data.message);
        }
      } catch (error) {
        console.error('修改密码失败:', error);
        alert('修改密码失败，请重试');
      }
    },
    
    logout() {
      if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.$router.push('/login');
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
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  max-height: 80vh;
  overflow-y: auto;
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

.settings-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

.settings-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.settings-section h4 {
  margin-bottom: 1rem;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
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

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #1a73e8;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1557b0;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
