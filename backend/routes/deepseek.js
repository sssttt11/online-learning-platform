const express = require('express');
const router  = express.Router();
const { askDeepSeek } = require('../services/deepseekService');

// POST /api/deepseek/chat
router.post('/chat', async (req, res) => {
  try {
    const { messages, temperature } = req.body;
    if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages 必须为数组' });
    const answer = await askDeepSeek(messages, temperature);
    res.json({ success: true, data: answer });
  } catch (e) {
    res.json({ success: false, msg: e.message });
  }
});

module.exports = router;