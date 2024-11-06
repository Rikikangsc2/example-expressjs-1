const { ytdown } = require("nayan-media-downloader");
const axios = require("axios");

module.exports = async (req, res) => {
  try {
    // Ambil URL video dari request body atau query parameter
    const videoUrl = req.query.url;
    const type = req.query.type;

    if (!videoUrl) {
      return res.status(400).json({ error: "URL video tidak diberikan" });
    }

    // Unduh video dari YouTube
    const downloadUrl = await ytdown(videoUrl);

    switch (type) {
      case "mp3":{
        res.header("Content-Type", "audio/mpeg");
        const response = await axios.get(downloadUrl.data.audio, { responseType: "arraybuffer" });
        res.send(Buffer.from(response.data, "binary"));
        break;
      }
        case "mp4": {
          res.header("Content-Type", "video/mp4");
          const response = await axios.get(downloadUrl.data.video, { responseType: "arraybuffer" });
          res.send(Buffer.from(response.data, "binary"));
        }break;
      }
  
    
    // Mengirim URL video yang sudah diunduh sebagai respons
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
