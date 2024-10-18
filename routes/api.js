const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { handleChat } = require('../module/llama');
const {twitter, igdl, ttdl,fbdown} = require('btch-downloader');
const { alldown, ytdown } = require('nayan-media-downloader');
const apiKey = require("../module/prodiaKey");
const keynya = apiKey();
const { spotify } = require("nayan-server");
///----
router.get('/ytdl', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    try {
        const URL = await ytdown(url);
        res.json(URL.data);
    } catch (error) {
        res.status(400).json({ error: 'An error occurred while processing the request' });
    }
});
router.get('/play', async (req, res) => {
    const name = req.query.q;
    if (!name) {
        return res.status(400).json({ error: 'q is required' });
    }
    try {
        const data = await spotify(name);
        const audio = data.data.audio;
       const response= await axios.get(audio, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);
      res.setHeader("Content-Type", "audio/mpeg");
      res.send(buffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
});
router.get('/all-dl', async (req, res) => {
    const url = req.query.url;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const data = await alldown(url);
        res.json(data);
    } catch (error) {
        res.status(400).json({
            message:error.message,
            error: 'An error occurred while processing the request',
            supportedPlatforms: ['facebook', 'tiktok', 'twitter', 'instagram', 'youtube', 'pinterest', 'gdrive', 'capcut', 'likee', 'threads']
        });
    }
});

router.get('/upscale', async (req, res) => {
  const link = req.query.url;
  if (!link) {
    return res.status(400).send('URL parameter is required');
  }

  if (!keynya) {
    return res.status(500).json({ error: 'API key is missing' });
  }

  try {
    // Mendownload gambar dari URL yang diberikan
    const response = await axios.get(link, { responseType: 'arraybuffer' });
    const base64Image = Buffer.from(response.data).toString('base64');

    // Mengirim gambar dalam base64 ke API upscale
    const options = {
      method: 'POST',
      url: 'https://api.prodia.com/v1/upscale',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'X-Prodia-Key': keynya
      },
      data: {
        resize: 2,
        model: 'SwinIR 4x',
        imageData: base64Image
      }
    };

    const apiResponse = await axios(options);
    const data = apiResponse.data;

    // Menggunakan loop polling dengan interval 5 detik
    let data2;
    let status = 'pending';
    const maxRetries = 30;  // Batas maksimal percobaan untuk menghindari loop tak terbatas
    let attempts = 0;

    while (status !== 'succeeded' && attempts < maxRetries) {
      const options2 = {
        method: 'GET',
        url: `https://api.prodia.com/v1/job/${data.job}`,
        headers: {
          accept: 'application/json',
          'X-Prodia-Key': keynya
        }
      };

      const response2 = await axios.request(options2);
      data2 = response2.data;
      status = data2.status;

      if (status !== 'succeeded') {
        console.log(`Status saat ini: ${status}. Menunggu 5 detik...`);
        await new Promise(resolve => setTimeout(resolve, 5000));  // Menunggu 5 detik
      }

      attempts++;
    }

    if (status === 'succeeded') {
      res.status(200).json(data2);
    } else {
      res.status(500).json({ error: 'Job did not complete in time' });
    }

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/twitter', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ error: 'Missing url parameter' });
  try {
    const data = await twitter(url);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.json({ error: 'Failed to download' });
  }
});
router.get('/fbdown', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ error: 'Missing url parameter' });
  try {
    const data = await fbdown(url);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.json({ error: 'Failed to download' });
  }
});
router.get('/ttdl', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ error: 'Missing url parameter' });
  try {
    const data = await ttdl(url);
    data.creator = "PurAPI"
    res.json(data);
  } catch (err) {
    console.error(err);
    res.json({ error: 'Failed to download' });
  }
});
router.get('/igdl', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ error: 'Missing url parameter' });
  try {
    const data = await igdl(url);
    data[0].wm = "PurAPI"
    res.json(data);
  } catch (err) {
    console.error(err);
    res.json({ error: 'Failed to download' });
  }
});
router.get('/llama',async(req,res)=>{
  if (!req.query.user&&!req.query.text&&!req.query.systemPrompt) return res.json({error: "Missing query parameter"});
  handleChat(req,res,null);
})
module.exports = router;