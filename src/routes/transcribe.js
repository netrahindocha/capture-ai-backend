const express = require("express");
const { generateSummary } = require("../utils/utils");
const router = express.Router();

router.post("/summary", async (req, res) => {
  const { document, format, length, extractiveness } = req.body;

  if (!document) {
    return res.status(400).json({ error: "Document text is required" });
  }

  try {
    const summary = await generateSummary(document, {
      format,
      length,
      extractiveness,
    });
    res.json({ summary });
    console.log("Generated Summary:", summary);
  } catch (error) {
    console.error("Error generating summary:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to generate summary" });
  }
});

module.exports = router;
