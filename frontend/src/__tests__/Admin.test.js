import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Admin from '../views/Admin.vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import ElementPlus from 'element-plus'

vi.mock('echarts', () => ({
  init: vi.fn(() => ({ setOption: vi.fn(), resize: vi.fn() })),
  graphic: { LinearGradient: vi.fn() }
}))
vi.mock('axios')
vi.mock('vue-router', () => ({ useRouter: vi.fn() }))

describe('Admin.vue 真实交互测试', () => {
  beforeEach(() => {
    useRouter.mockReturnValue({ push: vi.fn() })
    axios.get.mockImplementation((url) => {
      if (url.includes('users/count')) return Promise.resolve({ data: { success: true, count: 100 } })
      if (url.includes('courses/1/chapters')) return Promise.resolve({ data: { success: true, data: [] } })
      if (url.includes('courses')) return Promise.resolve({ data: { success: true, data: [{id: 1, title: '物理'}] } })
      if (url.includes('posts')) return Promise.resolve({ data: { success: true, data: [{id: 1, title: '违规贴'}] } })
      return Promise.resolve({ data: { success: true, data: [] } })
    })
    axios.post.mockResolvedValue({ data: { success: true } })
    axios.put.mockResolvedValue({ data: { success: true } })
    axios.delete.mockResolvedValue({ data: { success: true } })
  })

  it('场景1：直接触发课程的编辑与新增', async () => {
    const wrapper = mount(Admin, { global: { plugins: [ElementPlus] } })
    await flushPromises()
    
    // 打开弹窗并编辑
    wrapper.vm.handleEditCourse({ id: 1, title: '旧物理', category: '理学' })
    expect(wrapper.vm.isEditMode).toBe(true)
    
    // 保存课程 (触发 PUT)
    await wrapper.vm.saveCourse()
    expect(axios.put).toHaveBeenCalled()
    
    // 新增课程 (触发 POST)
    wrapper.vm.openAddDialog()
    wrapper.vm.courseForm.title = '新课'
    wrapper.vm.courseForm.category = '外语考级'
    await wrapper.vm.saveCourse()
    expect(axios.post).toHaveBeenCalled()
  })

  it('场景2：触发下架课程与删除违规帖子', async () => {
    const wrapper = mount(Admin, { global: { plugins: [ElementPlus] } })
    await flushPromises()
    
    await wrapper.vm.handleDeleteCourse(1)
    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('courses/1'))

    await wrapper.vm.handleDeletePost(1)
    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('posts/1'))
  })

  it('场景3：章节管理', async () => {
    const wrapper = mount(Admin, { global: { plugins: [ElementPlus] } })
    await flushPromises()
    
    await wrapper.vm.openChapterManager({ id: 1, title: '物理' })
    
    wrapper.vm.newChapterForm.title = '新章节'
    wrapper.vm.newChapterForm.video_url = 'mp4'
    await wrapper.vm.addChapter()
    expect(axios.post).toHaveBeenCalled()
  })
})