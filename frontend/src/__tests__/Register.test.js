import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Register from '../views/Register.vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import ElementPlus from 'element-plus'

vi.mock('axios')
vi.mock('vue-router', () => ({ useRouter: vi.fn() }))

describe('Register.vue 真实交互测试', () => {
  let pushMock
  beforeEach(() => {
    pushMock = vi.fn()
    useRouter.mockReturnValue({ push: pushMock })
    vi.useFakeTimers() // 接管 setTimeout
  })
  afterEach(() => { vi.useRealTimers() })

  it('场景1：密码与确认密码不一致应拦截', async () => {
    const wrapper = mount(Register, { global: { plugins: [ElementPlus] } })
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('newuser')
    await inputs[1].setValue('123')
    await inputs[2].setValue('456') // 密码不一致
    
    await wrapper.find('.submit-btn').trigger('click')
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('场景2：注册成功并延迟跳转登录页', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true, message: '注册成功' } })
    const wrapper = mount(Register, { global: { plugins: [ElementPlus] } })
    
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('newuser')
    await inputs[1].setValue('123')
    await inputs[2].setValue('123')
    
    await wrapper.find('.submit-btn').trigger('click')
    await flushPromises()
    
    // 模拟等待 1 秒
    vi.advanceTimersByTime(1000)
    expect(pushMock).toHaveBeenCalledWith('/login')
  })
})