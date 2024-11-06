const { ytmp3, ytmp4 } = require('ruhend-scraper')

module.exports = async (req, res) => {
  try {
    const videoUrl = req.query.url;
    const type = req.query.type;
    type === "mp3" ? ytdown = ytmp3 : ytdown = ytmp4;
    if (!videoUrl) {
      return res.status(400).json({ error: "URL video tidak diberikan" });
    }
    const downloadUrl = await ytdown(videoUrl);
    switch (type) { 
      case "mp3":
        res.redirect(downloadUrl.audio);
        break;
      case "mp4":
        res.redirect(downloadUrl.video);
        break;
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};