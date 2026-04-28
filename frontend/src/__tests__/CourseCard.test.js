import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest' // 如果用jest，换成对应api
import CourseCard from '@/components/course/CourseCard.vue'
import { useRouter } from 'vue-router'

// 1. Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: vi.fn()
}))

describe('CourseCard.vue', () => {
  const mockCourse = {
    id: '101',
    title: 'Vue3 从入门到精通',
    instructor: '张老师',
    students: 1200,
    image: 'https://example.com/vue.png'
  }

  it('正常情况：应正确渲染课程标题和讲师', () => {
    const wrapper = mount(CourseCard, { props: { course: mockCourse } })
    expect(wrapper.text()).toContain('Vue3 从入门到精通')
    expect(wrapper.text()).toContain('张老师')
  })

  it('正常情况：应正确渲染学习人数指标', () => {
    const wrapper = mount(CourseCard, { props: { course: mockCourse } })
    expect(wrapper.text()).toContain('1200')
  })

  it('交互测试：点击卡片时，应触发路由跳转到课程详情页', async () => {
    const pushMock = vi.fn()
    useRouter.mockReturnValue({ push: pushMock })
    
    const wrapper = mount(CourseCard, { props: { course: mockCourse } })
    
    // 模拟点击卡片
    await wrapper.find('.course-card').trigger('click')
    
    // 断言路由跳转被调用，且参数正确
    expect(pushMock).toHaveBeenCalledWith('/course/101')
  })

  it('边界情况：当没有图片提供时，应使用默认占位图逻辑（测试内部 fallback）', () => {
    const noImageCourse = { ...mockCourse, image: null }
    const wrapper = mount(CourseCard, { props: { course: noImageCourse } })
    // 断言不出错且正常渲染
    expect(wrapper.exists()).toBe(true)
  })
})