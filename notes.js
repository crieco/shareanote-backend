const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const Filter = require('bad-words');
const crypto = require('crypto');
const threats = require('../threatWords');

const filter = new Filter();
const recentMessages = new Set(); // Optional: Move to global scope if needed

function containsThreat(message) {
  const normalized = message.toLowerCase();
  return threats.some(threat => {
    const escaped = threat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(normalized);
  });
}

router.post('/', async (req, res) => {
  try {
    let { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    message = message.trim();
    const hash = crypto.createHash('md5').update(message.toLowerCase()).digest('hex');

    if (recentMessages.has(hash)) {
      return res.status(429).json({ error: 'Duplicate message' });
    }

    if (filter.isProfane(message)) {
      console.log('🔴 Profanity detected:', message);
      return res.status(403).json({ error: 'Profanity not allowed' });
    }

    if (containsThreat(message)) {
      console.log('🔴 Threat detected:', message);
      return res.status(403).json({ error: 'Threat detected' });
    }

    const db = getDb();
    const result = await db.collection('notes').insertOne({ message, createdAt: new Date() });

    recentMessages.add(hash);
    setTimeout(() => recentMessages.delete(hash), 5 * 60 * 1000); // expire after 5 mins

    res.status(200).json({ success: true, id: result.insertedId });
  } catch (err) {
    console.error('❌ Failed to save note:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
