const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const PERSPECTIVE_API_KEY = process.env.PERSPECTIVE_API_KEY;

app.post("/analyze", async (req, res) => {
  try {
    const { note } = req.body;

    const response = await axios.post(
      `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${PERSPECTIVE_API_KEY}`,
      {
        comment: { text: note },
        requestedAttributes: { TOXICITY: {} }
      }
    );

    const toxicityScore = response.data.attributeScores.TOXICITY.summaryScore.value;
    res.json({ toxicity: toxicityScore });
  } catch (error) {
    console.error("Error analyzing note:", error);
    res.status(500).json({ error: "Failed to analyze note" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
