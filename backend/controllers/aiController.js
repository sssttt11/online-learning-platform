// controllers/aiController.js - 修复版
const https = require('https');

exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: '消息不能为空' });

    const postData = JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: message }],
      temperature: 0.7,
      max_tokens: 1000
    });

    const options = {
      hostname: 'api.deepseek.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 确保 DEEPSEEK_API_KEY 环境变量已正确加载
        'Authorization': 'Bearer ' + process.env.DEEPSEEK_API_KEY,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    let body = '';
    const request = https.request(options, (response) => {
      response.on('data', chunk => body += chunk);
      response.on('end', () => {
        const statusCode = response.statusCode;

        try {
          const obj = JSON.parse(body);

          // 核心修复：检查 API 状态码
          if (statusCode !== 200) {
            console.error('DeepSeek API Error:', obj);
            let errorMessage = `DeepSeek API 请求失败 (状态码: ${statusCode})`;
            if (obj.error?.message) {
              errorMessage += `: ${obj.error.message}`;
            } else if (obj.message) {
              errorMessage += `: ${obj.message}`;
            } else if (statusCode === 401) {
              errorMessage += ': 可能是 API 密钥无效或已过期。';
            }

            return res.status(statusCode).json({ success: false, data: { answer: errorMessage } });
          }

          // 成功解析 DeepSeek 响应
          const answer = obj.choices?.[0]?.message?.content || 'API 返回成功，但内容为空。';
          res.json({ success: true, data: { answer, timestamp: new Date().toISOString() } });

        } catch (e) {
          console.error('API Response Parsing Error:', e, 'Raw Body:', body);
          res.status(500).json({ success: false, data: { answer: 'DeepSeek API 响应解析失败' } });
        }
      });
    });

    request.on('error', err => {
      console.error('Network Request Error:', err);
      res.status(500).json({ success: false, data: { answer: '网络连接 DeepSeek API 失败' } });
    });

    request.write(postData);
    request.end();

  } catch (err) {
    console.error('Server Internal Error:', err);
    res.status(500).json({ success: false, data: { answer: '服务器内部错误' } });
  }
};