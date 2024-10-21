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
const { spotify, pintarest, removebg } = require("nayan-server");
const chatsimsimi = require('chats-simsimi').default;
const randomUseragent = require('random-useragent');
///----
router.get('/char-search', async (req, res) => {
    const query = req.query.q;
    try {
        const userAgent = randomUseragent.getRandom();
        const { data } = await axios.get(`https://api.jikan.moe/v4/characters?q=${query}`, {
            headers: { 'User-Agent': userAgent }
        });
        const charData = await Promise.all(data.data.map(async char => {
            const translatedAbout = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=id&dt=t&q=${encodeURI(char.about)}`, {
                headers: { 'User-Agent': userAgent }
            }).then(response => response.data[0].map(item => item[0]).join(' '));
            return {
                name: char.name || '',
                image: char.images?.jpg?.image_url || '',
                desc: translatedAbout || ''
            };
        }));
        res.send(charData); // returns a string for each field
    } catch {
        res.status(500).send('Error');
    }
});

router.get('/anime-search', async (req, res) => {
    const query = req.query.q;
    try {
        const userAgent = randomUseragent.getRandom();
        const { data } = await axios.get(`https://api.jikan.moe/v4/anime?q=${query}`, {
            headers: { 'User-Agent': userAgent }
        });
        const animeData = await Promise.all(data.data.map(async anime => {
            return {
                title: anime.title || '',
                thumbnail: anime.images?.jpg?.image_url || '',
                genre: anime.genres.length > 0 ? anime.genres.map(g => g.name).join(', ') : '',
                score: anime.score?.toString() || '', // score as string
                trailer: anime.trailer?.url || '' // YouTube link as string
            };
        }));
        res.send(animeData); // returns strings for each field
    } catch {
        res.status(500).send('Error');
    }
});

router.get('/schedule', async (req, res) => {
    const day = req.query.day.toLowerCase();
    try {
        const userAgent = randomUseragent.getRandom();
        const translatedDay = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURI(day)}`, {
            headers: { 'User-Agent': userAgent }
        }).then(response => response.data[0][0][0]);
        const { data } = await axios.get(`https://api.jikan.moe/v4/schedules?filter=${translatedDay}`, {
            headers: { 'User-Agent': userAgent }
        });
        const list = await Promise.all(data.data.map(async anime => ({
            title: anime.title || '',
            thumbnail: anime.images?.jpg?.image_url || '',
            genre: anime.genres.length > 0 ? anime.genres.map(g => g.name).join(', ') : '',
            score: anime.score?.toString() || '', // score as string
            trailer: anime.trailer?.url || '' // YouTube link as string
        })));
        const template = `Berikut anime yang update setiap hari *${day}:* \n> ${list.length > 0 ? list.map(anime => anime.title).join('\n> ') : 'Tidak ada anime untuk hari ini.'}`;
        res.json({massage:template}); // return template as string
    } catch {
        res.status(500).send('Error');
    }
});
router.get('/simi', async (req, res) => {
  const text = req.query.text;
  const lang = req.query.lang || "id";
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }
  try {
    const response = await chatsimsimi(text, lang, true);
    res.json({ response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing the request' });
  }
});
router.get('/removebg', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  try {
    const data = await removebg(url);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing the request' });
  }
});

router.get('/pintarest', async (req, res) => {
  const search = req.query.q;
  if (!search) {
    return res.status(400).json({ error: 'q is required' });
  }
  try {
    const data = await pintarest(search);
    res.json(data.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing the request' });
  }
});

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
        res.json(data.data);
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