const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const Filter = require('bad-words');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shareanote';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// Mongoose schema
const noteSchema = new mongoose.Schema({
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Note = mongoose.model('Note', noteSchema);

// Filtering logic
const filter = new Filter();
const threatKeywords = ['kill', 'bomb', 'shoot', 'attack', 'threaten', 'explode'];

function containsThreat(message) {
  const lower = message.toLowerCase();
  return threatKeywords.some(word => lower.includes(word));
}

// Routes
app.post('/notes', async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Invalid message format' });
  }

  if (filter.isProfane(message)) {
    return res.status(403).json({ error: 'rejected profanity' });
  }

  if (containsThreat(message)) {
    return res.status(403).json({ error: 'rejected threat' });
  }

  try {
    const note = new Note({ message });
    await note.save();
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Error saving note:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/notes/random', async (req, res) => {
  try {
    const count = await Note.countDocuments();
    if (count === 0) return res.json({ message: "No notes available." });

    const random = Math.floor(Math.random() * count);
    const note = await Note.findOne().skip(random);
    res.json({ message: note.message });
  } catch (err) {
    console.error('Error retrieving note:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
