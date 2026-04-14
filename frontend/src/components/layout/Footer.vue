<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h3><i class="fas fa-graduation-cap"></i> 墨知课堂</h3>
          <p>AI赋能的个性化在线教育平台，致力于让每个人都能享受优质教育资源。</p>
        </div>
        <div class="footer-section">
          <h3>快速链接</h3>
          <ul class="footer-links">
            <li><a href="#">课程广场</a></li>
            <li><a href="#">学习路径</a></li>
            <li><a href="#">教师入驻</a></li>
            <li><a href="#">企业合作</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h3>联系我们</h3>
          <ul class="footer-links">
            <li><a href="#">客服中心</a></li>
            <li><a href="#">意见反馈</a></li>
            <li><a href="#">合作咨询</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h3>关注我们</h3>
          <ul class="footer-links">
            <li><a href="#">微信公众号</a></li>
            <li><a href="#">微博</a></li>
            <li><a href="#">知乎</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2025 墨知课堂 AI+在线教育平台. 保留所有权利.</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
// 页脚组件逻辑
</script>

<style scoped>
.footer {
  background: #202124;
  color: white;
  padding: 50px 0 20px;
  margin-top: 50px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
  margin-bottom: 30px;
}

.footer-section h3 {
  margin-bottom: 20px;
  color: white;
  font-size: 1.1rem;
}

.footer-section p {
  color: #bdc1c6;
  line-height: 1.6;
  font-size: 0.9rem;
}

.footer-links {
  list-style: none;
}

.footer-links li {
  margin-bottom: 10px;
}

.footer-links a {
  color: #bdc1c6;
  text-decoration: none;
  transition: color 0.3s ease;
  font-size: 0.9rem;
}

.footer-links a:hover {
  color: white;
}

.footer-bottom {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #3c4043;
  color: #9aa0a6;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: 1fr;
    gap: 30px;
  }
}
</style>