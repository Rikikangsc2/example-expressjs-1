const express = require('express');
const app = express();
const tesseract = require("node-tesseract-ocr")

const config = {
  lang: "ind",
  oem: 1,
  psm: 3,
}

app.get('/ocr', async (req, res) =>{
  if (req.query.url) return res.status(400).json({ error: "url is required" })
  const img = 

tesseract
  .recognize(img, config)
  .then((text) => {
    res.status(200).json({
      text: text
    })
  })
  .catch((error) => {
    res.status(500).json({
      error: error
    })
  })
});

app.get('/', (req, res) => {
  res.send('Hallo World!');
});

app.listen(8000, () => {
  console.log('Server listening on port 8000');
});