const express = require('express');
const cors = require('cors');
const app = express();
const { connectToMongo } = require('./db');
const notesRouter = require('./routes/notes');

app.use(cors());
app.use(express.json());

app.use('/notes', notesRouter);

const PORT = process.env.PORT || 10000;
connectToMongo().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}`);
  });
});