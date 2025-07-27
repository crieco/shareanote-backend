const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Filter = require('bad-words');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Schema & Model
const noteSchema = new mongoose.Schema({
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Note = mongoose.model('Note', noteSchema);

// Profanity and threat filtering
const filter = new Filter();
const blocklist = ['kill', 'bomb', 'shoot', 'terrorist', 'explode', 'die'];

function containsThreatOrVulgarity(text) {
  const lowerText = text.toLowerCase();
  return blocklist.some(word => lowerText.includes(word));
}

// Routes
app.post('/notes', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'No message provided' });

  if (filter.isProfane(message)) {
    return res.status(403).json({ error: 'rejected profanity' });
  }

  if (containsThreatOrVulgarity(message)) {
    return res.status(403).json({ error: 'rejected threat' });
  }

  try {
    const note = new Note({ message });
    await note.save();
    res.status(201).json({ success: true, message: 'Note saved successfully.' });
  } catch (err) {
    console.error('Error saving note:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/notes/random', async (req, res) => {
  try {
    const count = await Note.countDocuments();
    if (count === 0) return res.status(404).json({ message: 'No notes found' });

    const random = Math.floor(Math.random() * count);
    const note = await Note.findOne().skip(random);
    res.json({ message: note.message });
  } catch (err) {
    console.error('Error retrieving random note:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fallback
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
