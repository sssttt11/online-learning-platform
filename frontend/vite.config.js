import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  test: {
    // 必须使用 jsdom 模拟浏览器 DOM 环境，才能挂载和测试 Vue 组件
    environment: 'jsdom',
    
    // 覆盖率配置模块
    coverage: {
      provider: 'v8', // 默认且推荐的覆盖率引擎
      all: true,      // 【关键开关】：强制收集 include 目录下所有文件的覆盖率，即使没有对应的测试文件
      include: [
        'src/views/**/*.vue',      // 包含 views 下的所有页面组件
        'src/components/**/*.vue'  // 如果你有公共组件目录，也一并包含进去
      ],
      exclude: [
        'src/main.js',             // 排除项目入口文件（通常不需要单元测试）
        'src/**/index.js'          // 排除一些纯导出的统一出口文件
      ]
    },
    
    // 依赖处理
    deps: {
      // 将 element-plus 组件视为内部依赖处理，防止控制台报大量“未解析组件”的警告
      inline: ['element-plus'] 
    }
  }
})