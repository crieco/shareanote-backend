const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Filter = require('bad-words');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const crypto = require('crypto');
const helmet = require('helmet');

dotenv.config();
const app = express();

// ✅ Required for Render and proxies (fixes rate-limit error)
app.set('trust proxy', true);

const port = process.env.PORT || 10000;
const Note = require('./note');
const threats = require('./threatWords');
const filter = new Filter();

const recentMessages = new Set();

// ✅ Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// ✅ Rate limiting to prevent spam (max 3 per minute per IP)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { status: 'rate limit exceeded' },
});
app.use('/notes', limiter);

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // Optional: crash app on DB failure
  });

// ✅ Helper to detect broader threats
function containsThreat(message) {
  const normalized = message.toLowerCase().replace(/[^\w\s]/gi, '');
  return threats.some(threat => normalized.includes(threat));
}

// ✅ POST /notes
app.post('/notes', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();
  const hash = crypto.createHash('md5').update(lower).digest('hex');

  if (recentMessages.has(hash)) {
    return res.status(429).json({ status: 'duplicate message' });
  }

  if (filter.isProfane(trimmed)) {
    console.log("🔴 Profanity detected:", trimmed);
    return res.status(403).json({ status: 'rejected profanity' });
  }

  if (containsThreat(trimmed)) {
    console.log("🔴 Threat detected:", trimmed);
    return res.status(403).json({ status: 'rejected threat' });
  }

  try {
    const note = new Note({ message: trimmed });
    await note.save();
    recentMessages.add(hash);
    setTimeout(() => recentMessages.delete(hash), 5 * 60 * 1000); // expire in 5 min
    res.json({ status: 'success' });
  } catch (err) {
    console.error('❌ Error saving note:', err);
    res.status(500).json({ error: 'Failed to save note' });
  }
});

// ✅ GET /notes/random
app.get('/notes/random', async (req, res) => {
  try {
    const count = await Note.countDocuments();
    if (count === 0) return res.json({ message: '' });
    const random = Math.floor(Math.random() * count);
    const note = await Note.findOne().skip(random);
    res.json({ message: note.message });
  } catch (err) {
    console.error('❌ Error fetching note:', err);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server listening on port ${port}`);
});
