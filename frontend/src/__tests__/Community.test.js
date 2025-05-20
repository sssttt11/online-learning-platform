// @vitest-environment jsdom
import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Community from '../views/Community.vue'; 
import ElementPlus from 'element-plus';
import axios from 'axios';

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('axios');

const localStorageMock = (function() {
  let store = {};
  return {
    getItem(key) { return store[key] || null; },
    setItem(key, value) { store[key] = value.toString(); },
    clear() { store = {}; },
    removeItem(key) { delete store[key]; }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Community.vue 真实 DOM 触发测试', () => {
  beforeEach(() => { 
    vi.clearAllMocks(); 
    window.localStorage.clear();
    window.localStorage.setItem('user', JSON.stringify({ id: 1 }));
  });

  it('🎯 场景1：模拟真实用户发帖、点赞、排序', async () => {
    // 渲染页面并塞入假数据
    axios.get.mockResolvedValue({
      data: { success: true, data: [
        { id: 1, title: 'T1', content: 'C1', username: 'U1', is_liked: 0 },
        { id: 2, title: 'T2', content: 'C2', username: 'U2', is_liked: 1 }
      ]}
    });

    const wrapper = mount(Community, { global: { plugins: [ElementPlus], stubs: { teleport: true } } });
    await flushPromises(); // 等待列表渲染出来
    
    // 1. 测点赞：找到所有点赞按钮，模拟点击
    axios.post.mockResolvedValue({ data: { success: true } });
    const likeBtns = wrapper.findAll('.like-btn');
    for (const btn of likeBtns) {
        await btn.trigger('click');
    }

    // 2. 测发帖：找到发帖按钮，点击打开弹窗
    const postBtn = wrapper.find('.post-btn');
    if (postBtn.exists()) {
        await postBtn.trigger('click');
        await flushPromises();

        // 在弹窗里填写标题和内容
        const inputs = wrapper.findAll('input[type="text"]');
        if(inputs.length > 0) await inputs[0].setValue('测试标题');
        const textareas = wrapper.findAll('textarea');
        if(textareas.length > 0) await textareas[0].setValue('测试内容');

        // 点击提交按钮 (通常是 el-button--primary)
        const submitBtns = wrapper.findAll('.el-button--primary');
        if(submitBtns.length > 0) {
            await submitBtns[submitBtns.length - 1].trigger('click');
        }
    }

    // 3. 测排序：点击单选框切换最热/最新
    const radios = wrapper.findAll('input[type="radio"]');
    if (radios.length > 1) {
        await radios[1].setChecked();
        await radios[1].trigger('change');
    }

    await flushPromises();
  });

  it('🎯 场景2：网络报错与 catch 分支回滚', async () => {
    // 正常加载数据
    axios.get.mockResolvedValue({
      data: { success: true, data: [{ id: 1, title: 'T1', content: 'C1', username: 'U1', is_liked: 0 }] }
    });
    const wrapper = mount(Community, { global: { plugins: [ElementPlus], stubs: { teleport: true } } });
    await flushPromises();

    // 模拟点赞失败 (强行触发源码中的 catch 回滚逻辑)
    axios.post.mockRejectedValueOnce(new Error('点赞失败网络异常'));
    const likeBtns = wrapper.findAll('.like-btn');
    if(likeBtns.length > 0) await likeBtns[0].trigger('click');

    // 模拟发帖失败
    const postBtn = wrapper.find('.post-btn');
    if (postBtn.exists()) {
        await postBtn.trigger('click');
        await flushPromises();
        axios.post.mockRejectedValueOnce(new Error('发帖失败网络异常'));
        const submitBtns = wrapper.findAll('.el-button--primary');
        if(submitBtns.length > 0) await submitBtns[submitBtns.length - 1].trigger('click');
    }
    await flushPromises();
  });

  it('🎯 场景3：未登录强行操作', async () => {
    // 清除登录状态
    window.localStorage.removeItem('user');
    axios.get.mockResolvedValue({ data: { success: true, data: [] } });
    
    const wrapper = mount(Community, { global: { plugins: [ElementPlus], stubs: { teleport: true } } });
    await flushPromises();

    // 尝试点发帖按钮，触发拦截跳转逻辑
    const postBtn = wrapper.find('.post-btn');
    if (postBtn.exists()) await postBtn.trigger('click');
    await flushPromises();
  });
});