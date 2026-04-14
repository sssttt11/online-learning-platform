// src/api/deepseek.js
import request from '@/utils/request';

export const chatDeepSeek = async (messages, temperature = 0.7) => {
  console.log('🚀 发送DeepSeek请求...');
  
  try {
    // 增加超时时间到30秒
    const response = await request.post('/deepseek/chat', {
      messages,
      temperature
    }, {
      timeout: 30000
    });
    
    console.log('✅ DeepSeek响应成功');
    return response;
    
  } catch (error) {
    console.error('❌ DeepSeek请求失败:', error.message);
    
    // 如果是超时错误
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        message: 'AI服务响应超时，请稍后再试',
        isTimeout: true
      };
    }
    
    return {
      success: false,
      message: 'AI服务暂时不可用'
    };
  }
};

// 智能学习问答
export const askAIQuestion = async (question, context = {}) => {
  console.log('🤖 用户问题:', question);
  
  const systemPrompt = `你是课程学习助手"小墨"，请用中文回答问题。
课程：${context.course_name || '当前课程'}
视频：${context.video_title || '当前视频'}`;
  
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: question }
  ];

  return await chatDeepSeek(messages, 0.7);
};