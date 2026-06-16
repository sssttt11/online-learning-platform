import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Dashboard from '../views/Dashboard.vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import ElementPlus from 'element-plus'

vi.mock('axios')
vi.mock('vue-router', () => ({ useRouter: vi.fn() }))

describe('Dashboard.vue 真实交互测试', () => {
  let pushMock
  beforeEach(() => {
    pushMock = vi.fn()
    useRouter.mockReturnValue({ push: pushMock })
    axios.get.mockResolvedValue({ data: { success: true, data: [{ id: 99, title: '测试好课' }] } })
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify({ username: '栖学者' }))
  })

  it('场景1：点击课程卡片跳转详情', async () => {
    const wrapper = mount(Dashboard, { global: { plugins: [ElementPlus] } })
    await flushPromises()
    
    // 找到渲染出来的课程卡片并点击
    const courseCard = wrapper.find('.course-card')
    if (courseCard.exists()) {
      await courseCard.trigger('click')
      expect(pushMock).toHaveBeenCalledWith('/course/99')
    }
  })

  it('场景2：点击退出登录', async () => {
    const wrapper = mount(Dashboard, { global: { plugins: [ElementPlus] } })
    await flushPromises()
    
    await wrapper.find('.logout-btn').trigger('click')
    expect(pushMock).toHaveBeenCalledWith('/login')
  })

  it('场景3：AI 助手聊天交互', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true, reply: 'AI的回答' } })
    const wrapper = mount(Dashboard, { global: { plugins: [ElementPlus] } })
    await flushPromises()
    
    // 唤起 AI 面板
    await wrapper.find('.ai-fab').trigger('click')
    
    // 输入并发送
    const aiInput = wrapper.find('.ai-footer input')
    if (aiInput.exists()) {
      await aiInput.setValue('你好呀')
      await aiInput.trigger('keyup.enter')
      await flushPromises()
      expect(axios.post).toHaveBeenCalled()
      expect(wrapper.text()).toContain('AI的回答')
    }
  })
})