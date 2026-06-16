import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Login from '../views/Login.vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import ElementPlus from 'element-plus'

vi.mock('axios')
vi.mock('vue-router', () => ({ useRouter: vi.fn() }))

describe('Login.vue 真实交互测试', () => {
  let pushMock
  beforeEach(() => {
    pushMock = vi.fn()
    useRouter.mockReturnValue({ push: pushMock })
    vi.clearAllMocks()
  })

  it('场景1：空表单点击登录，应当拦截且不发请求', async () => {
    const wrapper = mount(Login, { global: { plugins: [ElementPlus] } })
    await wrapper.find('.login-btn').trigger('click')
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('场景2：输入正确账号密码，登录成功并跳转', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true, token: 'fake', user: { username: 'test' } } })
    const wrapper = mount(Login, { global: { plugins: [ElementPlus] } })
    
    // 模拟输入
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('admin')
    await inputs[1].setValue('123456')
    
    await wrapper.find('.login-btn').trigger('click')
    await flushPromises() // 等待请求完成
    
    expect(axios.post).toHaveBeenCalled()
    expect(pushMock).toHaveBeenCalledWith('/dashboard')
    expect(localStorage.getItem('token')).toBe('fake')
  })

  it('场景3：网络报错或密码错误', async () => {
    axios.post.mockRejectedValueOnce({ response: { data: { message: '密码错误' } } })
    const wrapper = mount(Login, { global: { plugins: [ElementPlus] } })
    
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('admin')
    await inputs[1].setValue('wrong_pwd')
    
    await wrapper.find('.login-btn').trigger('click')
    await flushPromises()
    // 此时走入 catch 分支，覆盖率提升
    expect(wrapper.vm.loading).toBe(false)
  })
})