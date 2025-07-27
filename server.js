
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Mongoose Schema and Model
const noteSchema = new mongoose.Schema({
  message: String,
  createdAt: { type: Date, default: Date.now },
});

const Note = mongoose.model('Note', noteSchema);

// Helper function to detect profanity/threats (basic example)
const bannedWords = ['badword1', 'badword2', 'kill', 'bomb'];
function isInappropriate(text) {
  const lower = text.toLowerCase();
  return bannedWords.some(word => lower.includes(word));
}

// Routes
app.post('/notes', async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Invalid note format.' });
  }
  if (isInappropriate(message)) {
    return res.status(403).json({ error: 'Message rejected due to inappropriate content.' });
  }
  try {
    const note = new Note({ message });
    await note.save();
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save note.' });
  }
});

app.get('/notes/random', async (req, res) => {
  try {
    const count = await Note.countDocuments();
    const random = Math.floor(Math.random() * count);
    const note = await Note.findOne().skip(random);
    res.json(note || { message: "No notes available." });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch note.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
