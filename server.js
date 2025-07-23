const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PERSPECTIVE_API_KEY = process.env.PERSPECTIVE_API_KEY;

async function analyzeText(text) {
  const response = await axios.post(
    \`https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=\${PERSPECTIVE_API_KEY}\`,
    {
      comment: { text },
      requestedAttributes: {
        TOXICITY: {},
        PROFANITY: {},
        INSULT: {},
        THREAT: {},
      },
    }
  );

  return response.data.attributeScores;
}

app.post('/api/note', async (req, res) => {
  const { content } = req.body;

  try {
    const scores = await analyzeText(content);
    const toxicity = scores.TOXICITY.summaryScore.value;

    if (toxicity > 0.7) {
      return res.status(400).json({ error: 'Your message was flagged as toxic.' });
    }

    // In-memory store or DB logic could go here
    res.json({ message: 'Note accepted!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error analyzing note.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(\`Backend running on port \${PORT}\`));
