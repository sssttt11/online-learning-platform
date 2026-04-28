import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Login from '@/views/Login.vue'
import { useRouter, useRoute } from 'vue-router'
import { login, register } from '@/api/auth'

// 1. Mock 外部依赖
vi.mock('vue-router', () => ({
  useRouter: vi.fn(),
  useRoute: vi.fn()
}))

vi.mock('@/api/auth', () => ({
  login: vi.fn(),
  register: vi.fn()
}))

describe('Login.vue', () => {
  let pushMock

  beforeEach(() => {
    pushMock = vi.fn()
    useRouter.mockReturnValue({ push: pushMock })
    useRoute.mockReturnValue({ name: 'Login', query: {} })
    vi.clearAllMocks()
    localStorage.clear()
  })

  // --- 组件交互测试 ---
  it('正常情况：默认显示登录表单，不显示注册表单', () => {
    const wrapper = mount(Login)
    expect(wrapper.find('h1.auth-title').text()).toBe('课程中心')
    expect(wrapper.find('button[type="submit"]').text()).toBe('登录')
  })

  it('交互测试：点击注册 Tab，应切换到注册表单', async () => {
    const wrapper = mount(Login)
    const tabs = wrapper.findAll('.auth-tab')
    
    // 点击第二个 Tab (注册)
    await tabs[1].trigger('click')
    expect(wrapper.find('button[type="submit"]').text()).toBe('注册并登录')
  })

  // --- Mock API 测试 (涵盖成功和失败) ---
  it('Mock API: 登录成功态 - 应保存 token 并跳转路由', async () => {
    // 模拟 API 返回成功
    login.mockResolvedValueOnce({
      data: { user: { id: 1, user_name: 'test', role: 'learner' }, token: 'mock-token-123' }
    })
    
    const wrapper = mount(Login)
    
    // 填入账号密码
    await wrapper.findAll('input[type="text"]')[0].setValue('testuser')
    await wrapper.findAll('input[type="password"]')[0].setValue('123456')
    
    // 提交表单
    await wrapper.find('form').trigger('submit.prevent')
    
    // 1. 验证加载态 (按钮文字变化) - 可选测试点
    // 2. 验证 API 调用参数
    expect(login).toHaveBeenCalledWith({ username: 'testuser', password: '123456' })
    // 3. 验证本地存储
    expect(localStorage.getItem('token')).toBe('mock-token-123')
    // 4. 验证路由跳转
    expect(pushMock).toHaveBeenCalledWith('/')
  })

  it('Mock API: 登录失败态 - 密码错误应显示错误信息', async () => {
    // 模拟 API 抛出错误
    login.mockRejectedValueOnce({
      response: { data: { message: '账号或密码错误' } }
    })
    
    const wrapper = mount(Login)
    await wrapper.findAll('input[type="text"]')[0].setValue('testuser')
    await wrapper.findAll('input[type="password"]')[0].setValue('wrongpass')
    await wrapper.find('form').trigger('submit.prevent')
    
    // 等待 DOM 更新
    await wrapper.vm.$nextTick() 
    
    // 验证错误提示渲染
    expect(wrapper.find('.error-msg').exists()).toBe(true)
    expect(wrapper.find('.error-msg').text()).toBe('账号或密码错误')
  })

  it('Mock API: 注册成功态 - 应发送带角色的请求并跳转', async () => {
    register.mockResolvedValueOnce({
      data: { user: { id: 2, role: 'instructor' }, token: 'new-token' }
    })
    
    // 强制挂载在注册模式
    useRoute.mockReturnValue({ name: 'Register', query: { mode: 'register' } })
    const wrapper = mount(Login)
    
    await wrapper.findAll('input[type="text"]')[0].setValue('newTeacher')
    await wrapper.findAll('input[type="password"]')[0].setValue('pwd123')
    
    // 选择老师身份
    const radioInputs = wrapper.findAll('input[type="radio"]')
    await radioInputs[1].setValue(true) // 选择 instructor
    
    await wrapper.find('form').trigger('submit.prevent')
    
    expect(register).toHaveBeenCalledWith({
      user_name: 'newTeacher',
      password: 'pwd123',
      role: 'instructor'
    })
    expect(pushMock).toHaveBeenCalledWith('/')
  })

  it('Mock API: 注册失败态 - 网络异常应显示默认错误', async () => {
    register.mockRejectedValueOnce(new Error('Network Error'))
    useRoute.mockReturnValue({ name: 'Register', query: { mode: 'register' } })
    const wrapper = mount(Login)
    
    await wrapper.findAll('input[type="text"]')[0].setValue('newTeacher')
    await wrapper.findAll('input[type="password"]')[0].setValue('pwd123')
    await wrapper.find('form').trigger('submit.prevent')
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.error-msg').text()).toBe('注册失败，请稍后重试')
  })
})