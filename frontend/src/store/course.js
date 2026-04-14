import { defineStore } from 'pinia'
import { courseAPI } from '@/api/courses'

export const useCourseStore = defineStore('course', {
  state: () => ({
    // 主页数据
    homeData: null,
    // 课程列表
    courses: [],
    // 课程详情
    currentCourse: null,
    // 分类数据
    categories: [],
    // 讲师数据
    instructors: [],
    // 搜索结果
    searchResults: [],
    // 加载状态
    loading: false
  }),

  actions: {
    // 获取主页数据
    async fetchHomeData() {
      this.loading = true
      try {
        const data = await courseAPI.getHomeData()
        this.homeData = data
        return data
      } catch (error) {
        console.error('获取主页数据失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取课程列表
    async fetchCourses(params = {}) {
      this.loading = true
      try {
        const data = await courseAPI.getCourses(params)
        this.courses = data
        return data
      } catch (error) {
        console.error('获取课程列表失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 搜索课程
    async searchCourses(keyword, params = {}) {
      this.loading = true
      try {
        const data = await courseAPI.searchCourses(keyword, params)
        this.searchResults = data
        return data
      } catch (error) {
        console.error('搜索课程失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取课程详情
    async fetchCourseDetail(courseId) {
      this.loading = true
      try {
        const data = await courseAPI.getCourseDetail(courseId)
        this.currentCourse = data
        return data
      } catch (error) {
        console.error('获取课程详情失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取分类
    async fetchCategories() {
      try {
        const data = await courseAPI.getCategories()
        this.categories = data
        return data
      } catch (error) {
        console.error('获取分类失败:', error)
        throw error
      }
    },

    // 获取讲师
    async fetchInstructors() {
      try {
        const data = await courseAPI.getInstructors()
        this.instructors = data
        return data
      } catch (error) {
        console.error('获取讲师失败:', error)
        throw error
      }
    }
  }
})