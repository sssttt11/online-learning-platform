import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import CourseDetail from '../views/CourseDetail.vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'
import ElementPlus from 'element-plus'

vi.mock('axios')
vi.mock('vue-router', () => ({
  useRouter: vi.fn(),
  useRoute: vi.fn()
}))

describe('CourseDetail.vue 真实交互测试', () => {
  // 定义一个全局变量，用来控制当前用例中用户是否已选课
  let mockIsEnrolled = true

  beforeEach(() => {
    mockIsEnrolled = true // 每个用例开始前，默认恢复为已选课
    useRouter.mockReturnValue({ push: vi.fn(), back: vi.fn() })
    useRoute.mockReturnValue({ params: { id: '1' } })
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify({ id: 1, username: '测试用户' }))
    
    // 拦截所有的 GET 请求并【精准匹配】URL
    axios.get.mockImplementation((url) => {
      if (url.includes('/chapters')) return Promise.resolve({ data: { success: true, data: [{id: 1, title: '第一讲', chapter_number: 1}] } })
      if (url.includes('/comments')) return Promise.resolve({ data: { success: true, data: [] } })
      if (url.includes('/check')) return Promise.resolve({ data: { success: true, isEnrolled: mockIsEnrolled } }) // 根据变量返回状态
      if (url.includes('/notes')) return Promise.resolve({ data: { success: true, data: [] } })
      if (url.includes('/progress')) return Promise.resolve({ data: { success: true, data: [1] } })
      // 课程详情请求
      if (url.includes('/courses/')) return Promise.resolve({ data: { success: true, data: { id: 1, title: '物理课', description: '探索物理的奥秘', video_url: 'test.mp4' } } })
      return Promise.resolve({ data: { success: true, data: [] } })
    })
    
    // 拦截所有的 POST 请求
    axios.post.mockResolvedValue({ data: { success: true, message: '操作成功', reply: 'AI回复内容' } })
  })

  it('场景1：正常挂载并获取各类信息', async () => {
    const wrapper = mount(CourseDetail, { global: { plugins: [ElementPlus] } })
    await flushPromises()
    
    // 因为 H1 标题被第一讲覆盖了，我们通过断言课程描述和章节名来验证渲染成功
    expect(wrapper.text()).toContain('探索物理的奥秘')
    expect(wrapper.text()).toContain('第一讲')
  })

  it('场景2：未选课用户点击选修', async () => {
    // 针对此用例，将 mock 状态改为未选课
    mockIsEnrolled = false 
    const wrapper = mount(CourseDetail, { global: { plugins: [ElementPlus] } })
    await flushPromises()
    
    // 找到大大的选修按钮并触发点击
    const enrollBtn = wrapper.find('.enroll-btn')
    expect(enrollBtn.exists()).toBe(true)
    await enrollBtn.trigger('click')
    await flushPromises()
    
    // 验证是否成功发起了选修课程的请求
    expect(axios.post).toHaveBeenCalledWith('http://localhost:3000/api/enrollments', expect.any(Object))
  })

  it('场景3：提交笔记与提交作业', async () => {
    const wrapper = mount(CourseDetail, { global: { plugins: [ElementPlus] } })
    await flushPromises()
    
    // 模拟写笔记
    wrapper.vm.newNoteContent = '这是一条测试笔记'
    await wrapper.vm.saveTimelineNote()
    expect(axios.post).toHaveBeenCalled()

    // 模拟提交作业
    wrapper.vm.assignmentContent = '这是我的作业答案'
    await wrapper.vm.submitAssignment()
    expect(wrapper.vm.isSubmitted).toBe(true)
  })

  it('场景4：标记进度与 AI 聊天', async () => {
    const wrapper = mount(CourseDetail, { global: { plugins: [ElementPlus] } })
    await flushPromises()
    
    // 标记完成
    await wrapper.vm.markChapterCompleted()
    expect(axios.post).toHaveBeenCalled()

    // AI 聊天
    wrapper.vm.aiInput = '讲解一下牛顿定律'
    await wrapper.vm.sendAiMessage()
    expect(wrapper.vm.chatMessages.length).toBeGreaterThan(1)
  })
})