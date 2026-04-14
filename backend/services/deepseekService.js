const axios = require('axios');
const { baseURL, chatCompletion, timeout } = require('../config/deepseek');

// 延迟创建 client，确保 dotenv 已加载
let client = null;
function getClient() {
  if (!client) {
    client = axios.create({
      baseURL,
      timeout,
      headers: { 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` }
    });
  }
  return client;
}

/**
 * 调用 DeepSeek ChatCompletion
 * @param {Array} messages  格式 [{role:'user',content:'你好'}]
 * @param {Number} temperature 0~2
 */
async function askDeepSeek(messages, temperature = 0.7) {
  try {
    const { data } = await getClient().post(chatCompletion, {
      model: 'deepseek-chat',
      messages,
      temperature
    });
    return data.choices[0].message.content;
  } catch (err) {
    // 统一包装，前端永远收到 200，错误信息在 msg
    throw new Error(err.response?.data?.error?.message || 'DeepSeek 调用失败');
  }
}

module.exports = { askDeepSeek };