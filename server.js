const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Filter = require('bad-words');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const port = process.env.PORT || 10000;
const Note = require('./note');
const threats = require('./threatWords');
const filter = new Filter();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });

app.post('/notes', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  const lowerMessage = message.toLowerCase();

  if (filter.isProfane(message)) {
    console.log('🔴 Profanity detected:', message);
    return res.status(403).json({ status: 'rejected profanity' });
  }

  if (threats.some(word => lowerMessage.includes(word))) {
    console.log('🔴 Threat detected:', message);
    return res.status(403).json({ status: 'rejected threat' });
  }

  try {
    const note = new Note({ message });
    await note.save();
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save note' });
  }
});

app.get('/notes/random', async (req, res) => {
  try {
    const count = await Note.countDocuments();
    if (count === 0) return res.json({ message: '' });
    const random = Math.floor(Math.random() * count);
    const note = await Note.findOne().skip(random);
    res.json({ message: note.message });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server listening on port ${port}`);
});