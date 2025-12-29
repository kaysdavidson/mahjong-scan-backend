export default function handler(req, res) {
  try {
    res.status(200).json({
      ok: true,
      message: "Mahjong Scan backend is live",
    });
  } catch (err) {
    res.status(500).json({
      error: err.message || "Unknown error",
    });
  }
}

