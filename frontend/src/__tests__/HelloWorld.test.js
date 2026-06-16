import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HelloWorld from '../components/HelloWorld.vue'

describe('HelloWorld.vue 基础组件测试', () => {
  
  it('场景1：成功渲染传入的 msg 属性', () => {
    const testMsg = '你好，栖学课堂！'
    const wrapper = mount(HelloWorld, {
      props: {
        msg: testMsg
      }
    })
    
    // 断言：h1 标签里的文本应该等于我们传入的 msg
    expect(wrapper.find('h1').text()).toBe(testMsg)
  })

  it('场景2：点击按钮能够正确增加 count 的值', async () => {
    const wrapper = mount(HelloWorld, {
      props: { msg: '测试点击' }
    })
    
    // 找到页面上的 button 元素
    const button = wrapper.find('button')
    
    // 断言：初始状态应该是 0
    expect(button.text()).toBe('count is 0')
    
    // 模拟用户点击一次按钮
    await button.trigger('click')
    
    // 断言：点击后应该变成 1
    expect(button.text()).toBe('count is 1')
    
    // 模拟再点两次
    await button.trigger('click')
    await button.trigger('click')
    
    // 断言：最后应该变成 3
    expect(button.text()).toBe('count is 3')
  })
})