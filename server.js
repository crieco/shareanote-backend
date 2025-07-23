const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/analyze', async (req, res) => {
    const { text } = req.body;

    try {
        const response = await axios.post(
            `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${process.env.PERSPECTIVE_API_KEY}`,
            {
                comment: { text },
                requestedAttributes: { TOXICITY: {} }
            }
        );

        const toxicity = response.data.attributeScores.TOXICITY.summaryScore.value;
        res.json({ toxicity });
    } catch (error) {
        console.error('Error analyzing comment:', error.message);
        res.status(500).json({ error: 'Failed to analyze comment' });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});