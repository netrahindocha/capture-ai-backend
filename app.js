// Load environment variables from .env file
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const transcribeRoutes = require("./src/routes/transcribe");

const app = express();

app.use(cors());
app.use(express.json()); // Parse JSON requests

// Use the transcription route
app.use("/api", transcribeRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.post("/api/summarize", async (req, res) => {
  try {
    const { transcript } = req.body;
    // Call your summary generation function here
    const summary = await generateSummary(transcript);
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
