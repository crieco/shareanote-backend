const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectToDB, getDB, closeDB } = require('./db');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

connectToDB()
  .then(() => {
    const db = getDB();
    const notesCollection = db.collection('notes');

    app.post('/notes', async (req, res) => {
      try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });
        const result = await notesCollection.insertOne({ message, createdAt: new Date() });
        res.status(201).json({ success: true, id: result.insertedId });
      } catch (err) {
        console.error('Error saving note:', err);
        res.status(500).json({ error: 'Failed to save note' });
      }
    });

    app.get('/', (req, res) => res.send('ShareANote backend is running.'));
    app.listen(PORT, () => console.log(`✅ Server listening on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ Failed to connect to MongoDB:', err);
    process.exit(1);
  });

process.on('SIGINT', async () => {
  await closeDB();
  process.exit();
});
