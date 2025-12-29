module.exports = (req, res) => {
  res.status(200).json({
    ok: true,
    message: "Mahjong Scan backend is live"
  });
};
