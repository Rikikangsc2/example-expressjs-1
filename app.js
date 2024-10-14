const express = require('express');
const app = express();
const port = 8000;
//++++
const { ttdl } = require('btch-downloader')

app.get('/ttdl', async (req, res) => {
  try {
    const url = req.query.url;
    const data = await ttdl(url);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error downloading video');
  }
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});