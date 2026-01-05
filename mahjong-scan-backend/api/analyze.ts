import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: any, res: any) {
  // Basic CORS (helps mobile apps)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Use POST" });
  }

  try {
    const { imageBase64 } = req.body || {};

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({
        ok: false,
        error: "Missing imageBase64 in request body",
      });
    }

    // Remove data URL prefix if the app sends it like "data:image/jpeg;base64,...."
    const cleanedBase64 = imageBase64.includes("base64,")
      ? imageBase64.split("base64,")[1]
      : imageBase64;

    const prompt = `
You are an American Mahjong assistant using the NMJL card.
From the photo of the player's tiles, suggest the BEST 3 possible hands to aim for.
Return ONLY valid JSON in this exact shape:

{
  "suggestions": [
    {
      "handName": "string",
      "section": "string (e.g., 2468 / 2025 / Winds-Dragons / etc.)",
      "why": "short explanation",
      "needed": ["tile", "tile", "tile"],
      "confidence": 0.0
    }
  ]
}

Rules:
- Exactly 3 suggestions.
- "confidence" is 0 to 1.
- Keep "why" short.
- If the tiles are unclear, still make best guesses and lower confidence.
`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt.trim() },
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${cleanedBase64}`,
            },
          ],
        },
      ],
    });

    const text = response.output_text?.trim() || "";

    // Try to parse JSON from the model
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      // If the model ever returns non-JSON, return it for debugging
      return res.status(200).json({ ok: true, raw: text });
    }

    return res.status(200).json({ ok: true, ...parsed });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "Unknown error",
    });
  }
}
