import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'happy-dom', // 保持不变，用于模拟DOM
    globals: true,
    coverage: {
      reporter: ['text', 'lcov'], // 👈 新增：必须包含 lcov 才能生成 lcov.info 给 Codecov
      reportsDirectory: './coverage'
    }
  }
})