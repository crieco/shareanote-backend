const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Filter = require('bad-words');
const { containsProfanity } = require('leo-profanity');

const app = express();
const port = process.env.PORT || 10000;

const filter = new Filter();
filter.addWords(...['terrorist', 'bomb', 'kill', 'gun', 'attack', 'shoot']); // Add threat keywords

app.use(cors());
app.use(express.json());

// MongoDB setup
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

const noteSchema = new mongoose.Schema({
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const Note = mongoose.model('Note', noteSchema);

// POST note
app.post('/notes', async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Invalid message.' });
  }

  const lowered = message.toLowerCase();

  // Check for vulgar/profane/threatening content
  if (filter.isProfane(message) || containsProfanity(message)) {
    return res.status(403).json({ error: 'rejected profanity' });
  }

  if (lowered.includes('kill') || lowered.includes('bomb') || lowered.includes('terrorist') || lowered.includes('shoot') || lowered.includes('attack')) {
    return res.status(403).json({ error: 'rejected threat' });
  }

  try {
    const note = new Note({ message });
    await note.save();
    res.status(201).json({ message: 'Note saved successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error saving note.' });
  }
});

// GET random note
app.get('/notes/random', async (req, res) => {
  try {
    const count = await Note.countDocuments();
    if (count === 0) {
      return res.status(404).json({ error: 'No notes found.' });
    }
    const random = Math.floor(Math.random() * count);
    const note = await Note.findOne().skip(random);
    res.json({ note: note.message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching note.' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server listening on port ${port}`);
});