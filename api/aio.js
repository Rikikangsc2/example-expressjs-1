 const { alldown } = require("nayan-media-downloader");

 module.exports = (req, res) => {
   const url = req.query.url;

   if (!url) {
     return res.status(400).json({ error: "URL parameter is required" });
   }

   alldown(url)
     .then((data) => {
       res.json(data);
     })
     .catch((error) => {
       console.error("Error downloading media:", error);
       res.status(500).json({ error: "Failed to download media" });
     });
 };
