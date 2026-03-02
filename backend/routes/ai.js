const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

router.post('/categorize', async (req, res) => {
  try {
    const { notes, categoryList } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      console.error("[Backend AI] Error: GROQ_API_KEY is not set in environment");
      return res.status(500).json({ error: "Server configuration error" });
    }

    if (!notes) {
      return res.status(400).json({ error: "Missing notes" });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `You are a financial assistant. Given a transaction note, categorize it using one of the provided category IDs.
            Available categories: [${categoryList}].
            If no existing category fits well, suggest a new short category name (max 2 words).
            Respond ONLY with a valid JSON object in this format:
            {"id": "selected_id_or_null", "name": "suggested_new_name_or_null"}`
          },
          {
            role: "user",
            content: `Transaction note: "${notes}"`
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Backend AI] Groq Error:", errorText);
      return res.status(response.status).json({ error: "AI Service Error" });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    res.json(JSON.parse(content));
  } catch (error) {
    console.error("[Backend AI] Internal Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
