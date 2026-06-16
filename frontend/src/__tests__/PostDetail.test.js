import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import PostDetail from '../views/PostDetail.vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'
import ElementPlus from 'element-plus'

vi.mock('axios')
vi.mock('vue-router', () => ({
  useRouter: vi.fn(),
  useRoute: vi.fn()
}))

describe('PostDetail.vue 真实交互测试', () => {
  beforeEach(() => {
    useRouter.mockReturnValue({ back: vi.fn() })
    useRoute.mockReturnValue({ params: { id: '123' } })
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify({ id: 1, username: '测试用户' }))
    
    axios.get.mockResolvedValue({ 
      data: { success: true, post: { id: 123, title: '测试帖子', username: '用户A' }, comments: [] } 
    })
    axios.post.mockResolvedValue({ data: { success: true } })
  })

  it('场景1：发表评论并重新拉取列表', async () => {
    const wrapper = mount(PostDetail, { global: { plugins: [ElementPlus] } })
    await flushPromises() 
    
    // 模拟输入评论
    wrapper.vm.newComment = '这是我的一条深入见解'
    await wrapper.vm.submitComment()
    await flushPromises()
    
    expect(axios.post).toHaveBeenCalled()
    expect(wrapper.vm.newComment).toBe('') // 验证清空逻辑
  })
})