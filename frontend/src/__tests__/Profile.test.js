import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Profile from '../views/Profile.vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import ElementPlus from 'element-plus'

vi.mock('axios')
vi.mock('vue-router', () => ({ useRouter: vi.fn() }))

describe('Profile.vue 真实交互测试', () => {
  let pushMock
  beforeEach(() => {
    pushMock = vi.fn()
    useRouter.mockReturnValue({ push: pushMock })
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify({ id: 1, username: '测试用户' }))
    vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {})
    
    axios.get.mockImplementation((url) => {
      if (url.includes('enrolled-courses')) return Promise.resolve({ data: { success: true, data: [{id: 1, title: '已选课程'}] } })
      if (url.includes('all-notes')) return Promise.resolve({ data: { success: true, data: [{id: 1, content: '时光笔记'}] } })
      return Promise.resolve({ data: { success: true, user: { username: '云端名字', grade: '大二' } } })
    })
  })

  it('场景1：修改基本资料', async () => {
    axios.put.mockResolvedValueOnce({ data: { success: true } })
    const wrapper = mount(Profile, { global: { plugins: [ElementPlus] } })
    await flushPromises()
    
    wrapper.vm.editForm.username = '新名字'
    await wrapper.vm.handleUpdateProfile()
    await flushPromises()
    expect(axios.put).toHaveBeenCalled()
  })

  it('场景2：修改密码并重新登录', async () => {
    axios.put.mockResolvedValueOnce({ data: { success: true } })
    const wrapper = mount(Profile, { global: { plugins: [ElementPlus] } })
    await flushPromises()
    
    wrapper.vm.pwdForm.oldPassword = 'old'
    wrapper.vm.pwdForm.newPassword = 'new'
    await wrapper.vm.handleUpdatePassword()
    await flushPromises()
    
    expect(axios.put).toHaveBeenCalled()
    expect(pushMock).toHaveBeenCalledWith('/login') // 验证密码修改后跳转登录
  })
})