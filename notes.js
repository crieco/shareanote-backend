const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const db = getDb();
    const result = await db.collection('notes').insertOne({ message, createdAt: new Date() });

    res.status(200).json({ success: true, id: result.insertedId });
  } catch (err) {
    console.error('❌ Failed to save note:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;