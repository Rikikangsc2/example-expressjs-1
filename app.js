const express = require('express');
const path = require('path');
const fs = require('fs');
const scrap = require('@bochilteam/scraper');
const axios = require('axios');
const app = express();
const FormData = require('form-data');
const base = "https://nue-api.vercel.app";
const gis = require('g-i-s');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const { RsnChat } = require("rsnchat");
const Groq = require('groq-sdk');
const request = require('request');
const ytdl = require('ytdl-core');
const { youtube, ttdl } = require('btch-downloader');


const key = ['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']
const randomKey = key[Math.floor(Math.random() * key.length)];
const groq = new Groq({ apiKey: randomKey });
const rsnchat = new RsnChat("rsnai_SQPKHQEtlKlh8s9cjovGIiOp");

const userId = 'nueapi'; 
const ikyDBBaseUrl = 'https://nue-db.vercel.app';

const listapikey = ["8f62a0ea-cd83-4003-b809-6803bf9dd619","09c4a774-bf77-474a-b09b-45d63005160b","7e8ee357-c24c-450e-993b-ecc7458a6607","91eb053f-ae98-4baa-a2b0-1585f6199979","17a57da9-df4a-48c2-8d49-5bfc390174d2","6dc6600b-893a-4550-a980-a12c5f015288","4a465c34-f761-4de3-a9f8-b791ac7c5f43","cccdaf86-5e20-4b02-90cf-0e2dfa2ae19f"]

const apikey = () => {
  const randomIndex = Math.floor(Math.random() * listapikey.length);
  return listapikey[randomIndex];
};

async function readData() {
  try {
    const response = await axios.get(`${ikyDBBaseUrl}/read/${userId}`);
    return response.data || {today: 0,
        yesterday: 0,
        total: 0,
        lastDate: new Date().getDate()};
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return {
        today: 0,
        yesterday: 0,
        total: 0,
        lastDate: new Date().getDate()
      };
    }
    throw error;
  }
}

async function writeData(userId, data) {
  try {
    await axios.post(`${ikyDBBaseUrl}/write/${userId}`, {json:data});
  } catch (error) {
    throw error;
  }
}

//*
app.set('json spaces', 2);
app.get('/docs',function (req, res){
    res.redirect(base+'/docs')
})
app.get('/',async (req,res) =>{
    const response = await axios.get(base);
    res.send(response.data);
});
app.get('/count', async (req, res) => {
  try {
    let data = await readData();
    const currentDate = new Date().getDate();

    if (currentDate !== data.lastDate) {
      data.yesterday = data.today;
      data.today = 0;
      data.lastDate = currentDate;
    }

    data.today += 1;
    data.total += 1;

    await writeData(userId ,data);
    res.json(data);
  } catch (error) {
      console.error('Error reading data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/read', async (req, res) => {
  try {
    const data = await readData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/hasil.jpeg', express.static(path.join(__dirname, 'hasil.jpeg')));

app.get('/sdlist',async(req,res)=>{await sdList(res)})
app.get('/sdxllist',async(req,res)=>{await sdxlList(res)})


const { Youtube } = require('@neoxr/youtube-scraper');
const yt = new Youtube({ fileAsUrl: false });

app.get('/yt-mp3', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  try {
    const audio = await youtube(url);
    res.redirect(audio.mp3)
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/yt-mp4', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    const video = await youtube(url);
    res.redirect(video.mp4)
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use(async (req, res, next) => {
  const { key } = req.query;
  if (!key) {
    return res.status(400).json({ error: 'Key is required' });
  }
if (key === 'purpur') return next();
  try {
    const response = await axios.get('https://nue-api.vercel.app/key');
    const validKeys = response.data;

    const isValidKey = validKeys.some(validKey => validKey === key);

    if (isValidKey) {
      return next();
    } else {
      return res.status(401).json({ error: 'Silahkan gunakan endpoint utama karna key akan berubah ubah' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Ada kesalahan pada server kami' });
  }
});
//Router
app.get('/ttdl', async (req, res) =>{
  try {
    const hasil = await ttdl(req.query.url);
  res.status(200).json({endpoint:`${base}/api/tt-dl?url=`,...hasil});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get('/bard', async (req, res) => {
  const versionAI = '1.0.5';
  const versionSistem = '1.0.0.5';
  const { text } = req.query;

  // Cek apakah parameter q dan user ada
  if (!text) {
    return res.status(400).send('Masukkan parameter q dan user');
  }

  try {
    // Try block pertama untuk menangkap error dari permintaan sistem
    let sistemResponse;
    try {
      sistemResponse = await axios.get(`https://nue-api.vercel.app/sistem?text=${text}&user=${versionSistem}`);
    } catch (error) {
      console.error('Error mengambil data dari sistem:', error.message);
      return res.status(500).send('Gagal mengambil respon dari sistem. Coba lagi nanti '+error.message);
    }

    const { google_search, query_search } = sistemResponse.data;

    // Fungsi untuk mengambil hasil Google Search jika google_search true
    let googleResults = '';
    if (google_search) {
      try {
        const { data } = await axios.get(`https://nue-api.vercel.app/api/google?&query=${query_search}`);
        googleResults = JSON.stringify(data, null, 2);
      } catch (error) {
        console.error('Error Google Search:', error.message);
        googleResults = 'Tidak dapat mengambil hasil dari Google';
      }
    }

    // Membuat prompt berdasarkan nilai google_search
    let prompt;
    if (google_search) {
      prompt = `Berhasil melakukan pencarian google, berikut hasilnya untuk membantu dalam menjawab pertanyaan pengguna: ${googleResults}

Permintaan pengguna: ${text}`;
    } else {
      prompt = text;
    }

    // Try block untuk menangkap error dari API gemini
    let response;
    try {
      response = await axios.get('https://nue-api.koyeb.app/gemini', {
        params: {
          prompt: prompt,
          key: 'purpur'
        }
      });
    } catch (error) {
      console.error('Error dari gemini API:', error.message);
      return res.status(500).send('Gagal memproses jawaban dari AI. Silakan coba lagi nanti '+error.message);
    }

    // Kembalikan hasil ke client
    const result = response.data.message || 'Tidak ada hasil yang tersedia';

    res.status(200).send({
      endpoint: `${base}/api/bard?text=`,
      google: google_search,
      result: result
    });

  } catch (error) {
    // Penanganan umum untuk error tak terduga
    console.error('Error umum:', error.message);
    res.status(500).json({ error: 'Terjadi kesalahan di server. Silakan coba lagi nanti.' });
  }
});

app.get('/nuego', async (req, res) => {
  const versionAI = '1.0.5';
  const versionSistem = '1.0.0.5';
  const { user, q } = req.query;

  // Cek apakah parameter q dan user ada
  if (!q || !user) {
    return res.status(400).send('Masukkan parameter q dan user');
  }

  try {
    // Try block pertama untuk menangkap error dari permintaan sistem
    let sistemResponse;
    try {
      sistemResponse = await axios.get(`https://nue-api.vercel.app/sistem?text=${q}&user=${user}${versionSistem}`);
    } catch (error) {
      console.error('Error mengambil data dari sistem:', error.message);
      return res.status(500).send('Gagal mengambil respon dari sistem. Coba lagi nanti.');
    }

    const { text, google_search, query_search } = sistemResponse.data;

    // Fungsi untuk mengambil hasil Google Search
    const fetchGoogleSearchResults = async () => {
      try {
        const { data } = await axios.get(`https://nue-api.vercel.app/api/google?limit=5&query=${query_search}`);
        return data.map(item => `${item.title}, ${item.snippet}, ${item.link}`).join('\n');
      } catch (error) {
        console.error('Error Google Search:', error.message);
        return 'Tidak dapat mengambil hasil dari Google';
      }
    };

    // Jika google_search true, ambil hasil pencarian Google
    let hs = null;
    if (google_search) {
      try {
        hs = await fetchGoogleSearchResults();
      } catch (error) {
        console.error('Error fetching Google Search results:', error.message);
        hs = 'Tidak dapat mengambil hasil dari Google';
      }
    }

    // Pesan yang akan dikirimkan ke sistem AI
    const aiMessage = `*memproses permintaan*
${hs ? 'Berhasil melakukan pencarian google, berikut hasilnya untuk membantu dalam menjawab pertanyaan pengguna: ' + hs : ''}

Anda harus menulis jawabannya untuk pengguna`;

    // Try block kedua untuk menangkap error dari API lgpt
    let response;
    try {
      response = await axios.get('https://nue-api.vercel.app/api/lgpt', {
        params: {
          text: text,
          systemPrompt: `Anda adalah AI bernama nueGo anda adalah AI lanjutan buatan NueAPI dan memiliki API di nue-api.vercel.app, Anda dapat mencari informasi dan sudah terintegrasi dengan google search`,
          aiMessage: aiMessage,
          user: `${user}${versionAI}`
        }
      });
    } catch (error) {
      console.error('Error dari lgpt API:', error.message);
      return res.status(500).send('Gagal memproses jawaban dari AI. Silakan coba lagi nanti.');
    }

    // Validasi hasil respons AI
    const result = response.data.result ? response.data.result : 'Tidak ada hasil yang tersedia';
    const history = response.data.history ? response.data.history : 'Tidak ada riwayat';

    // Kembalikan hasil ke client
    res.status(200).send({
      endpoint: `${base}/api/nuego?q=${q}&user=${user}`,
      google: google_search,
      result: query_search ? `> ${query_search}\n${result}` : result,
      history: history
    });

  } catch (error) {
    // Penanganan umum untuk error tak terduga
    console.error('Error umum:', error.message);
    res.status(500).json({ error: 'Terjadi kesalahan di server. Silakan coba lagi nanti.' });
  }
});

app.get('/diff', async (req, res) => {
  const preset = req.query.preset;
  const model = req.query.model;
  const prompt = req.query.prompt;
  if (!prompt) {
    return res.status(400).send('Prompt parameter is required');
  }
  if (!model) {
    res.status(400).json({ error: 'Model parameter is required' });
  }

  try {
    const options = {
      method: 'POST',
      url: 'https://api.prodia.com/v1/sd/generate',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'X-Prodia-Key': apikey()
      },
        data: {
    width: 1024,
    height: 1024,
    sampler: 'DPM++ 2M Karras',
    upscale: true,
    seed: -1,
    cfg_scale: 7,
    steps: 20,
    style_preset: preset,
    prompt: prompt,
    model: model}

    };

    const apiResponse = await axios(options);
    const data = apiResponse.data;

    let data2;
    let status = 'pending';

    while (status !== 'succeeded') {
      const options2 = {
        method: 'GET',
        url: `https://api.prodia.com/v1/job/${data.job}`,
        headers: {
          accept: 'application/json',
          'X-Prodia-Key': apikey()
        }
      };

      const response2 = await axios.request(options2);
      data2 = response2.data;
      status = data2.status;

      if (status !== 'succeeded') {
        console.log(`Current status: ${status}. Waiting for 10 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    const json = { endpoint: `${base}/api/diffpreset?model=${model}&preset=${preset}&prompt=${encodeURIComponent(prompt)}`, data: data2 };
    res.status(200).json(json);
  } catch (error) {
    console.error(error);
      res.status(500).json({ error: error.message });
  }
});
app.get('/sdxl', async (req, res) => {
  const model = req.query.model;
  const prompt = req.query.prompt;
  if (!prompt) {
    return res.status(400).send('Prompt parameter is required');
  }
  if (!model) {
    return res.status(500).json({ error: 'Model parameter is required' });
  }

  try {
    const options = {
      method: 'POST',
      url: 'https://api.prodia.com/v1/sdxl/generate',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'X-Prodia-Key': apikey()
      },
      data: {
        width: 1024,
        height: 1024,
        sampler: 'DPM++ 2M Karras',
        upscale: true,
        seed: -1,
        cfg_scale: 7,
        steps: 20,
        model: model,
        prompt: prompt
      }
    };

    const apiResponse = await axios(options);
    const data = apiResponse.data;

    let data2;
    let status = 'pending';

    while (status !== 'succeeded') {
      const options2 = {
        method: 'GET',
        url: `https://api.prodia.com/v1/job/${data.job}`,
        headers: {
          accept: 'application/json',
          'X-Prodia-Key': apikey()
        }
      };

      const response2 = await axios.request(options2);
      data2 = response2.data;
      status = data2.status;

      if (status !== 'succeeded') {
        console.log(`Current status: ${status}. Waiting for 10 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    const json = { endpoint: `${base}/api/sdxl?model=${model}&prompt=${encodeURIComponent(prompt)}`, data: data2 };
    res.status(200).json(json);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/text2img', async (req, res) => {
  const model = req.query.model;
  const prompt = req.query.prompt;
  if (!prompt) {
    return res.status(400).send('Prompt parameter is required');
  }
  if (!model) {
    return res.status(500).json({ error: 'Model parameter is required' });
  }

  try {
    const options = {
      method: 'POST',
      url: 'https://api.prodia.com/v1/sd/generate',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'X-Prodia-Key': apikey()
      },
      data: {
        width: 1024,
        height: 1024,
        sampler: 'DPM++ 2M Karras',
        upscale: true,
        seed: -1,
        cfg_scale: 7,
        steps: 20,
        model: model,
        prompt: prompt
      }
    };

    const apiResponse = await axios(options);
    const data = apiResponse.data;

    let data2;
    let status = 'pending';

    while (status !== 'succeeded') {
      const options2 = {
        method: 'GET',
        url: `https://api.prodia.com/v1/job/${data.job}`,
        headers: {
          accept: 'application/json',
          'X-Prodia-Key': apikey()
        }
      };

      const response2 = await axios.request(options2);
      data2 = response2.data;
      status = data2.status;

      if (status !== 'succeeded') {
        console.log(`Current status: ${status}. Waiting for 10 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    const json = { endpoint: `${base}/api/text2img?model=${model}&prompt=${encodeURIComponent(prompt)}`, data: data2 };
    res.status(200).json(json);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/upscale', async (req, res) => {
  const link = req.query.url;
  if (!link) {
    return res.status(400).send('URL parameter is required');
  }

  try {
    const response = await axios.get(link, { responseType: 'arraybuffer' });
    fs.writeFileSync('hasil.jpeg', response.data);
    const imageData = await axios.get(`https://nue-api.koyeb.app/hasil.jpeg`, { responseType: 'arraybuffer' });
    const base64Image = Buffer.from(imageData.data).toString('base64');
    const options = {
      method: 'POST',
      url: 'https://api.prodia.com/v1/upscale',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'X-Prodia-Key': apikey()
      },
      data: {
        resize: 2, 
        model: 'SwinIR 4x',
        imageData: base64Image
      }
    };

    const apiResponse = await axios(options);
    const data = apiResponse.data;

    let data2;
    let status = 'pending';

    while (status !== 'succeeded') {
      const options2 = {
        method: 'GET',
        url: `https://api.prodia.com/v1/job/${data.job}`,
        headers: {
          accept: 'application/json',
          'X-Prodia-Key': apikey()
        }
      };

      const response2 = await axios.request(options2);
      data2 = response2.data;
      status = data2.status;

      if (status !== 'succeeded') {
        console.log(`Current status: ${status}. Waiting for 10 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    const json = { endpoint: `${base}/api/upscale?url=${encodeURIComponent(link)}`, data: data2 };
    res.status(200).json(json);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/image', async (req, res) => {
  const query = req.query.query;

  try {
    const results = await new Promise((resolve, reject) => {
      gis(query, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });

    const urls = results
      .sort((a, b) => (b.width * b.height) - (a.width * a.height))
      .slice(0, 10)
      .map(result => result.url);

    if (urls.length > 0) {
      const json = {
          endpoint:base+"/api/image?query="+encodeURIComponent(query),
          rekomendasi: urls[0], result: urls };
      res.status(200).json(json);
    } else {
      res.status(404).json({ error: 'No images found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({error:error.message});
  }
});

app.get('/gemini', async (req, res) => {
    const query = req.query.prompt;

    if (!query) {
        return res.status(400).json({ status: 400, message: 'prompt parameter "q" is required' });
    }

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyCtBDTdbx37uvBqiImuFdZFfAf5RD5igVY`,
            {
                contents: [{ parts: [{ text: query }] }]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );

        // Extracting the message text from the response JSON
        const message = response.data.candidates[0].content;

        // Respond with AI-generated message
        res.json({ status: 200,
endpoint:base+"/api/gemini?prompt="+encodeURIComponent(req.query.prompt),
message: message.parts[0].text });
    } catch (error) {
        console.error('Error fetching from Google API:', error.message);
        res.status(500).json({ status: 500, message: 'Failed to generate content' });
    }
});;

app.get('/gpt', async (req, res) => {
    const { prompt } = req.query;

    if (!prompt) {
        return res.status(400).send('Model and prompt query parameters are required');
    }

    try {
        const response = await rsnchat.gpt(prompt)
        const json = {endpoint:base+'/api/gpt?prompt='+encodeURIComponent(prompt),status:200, result:response.message}
        res.status(200).json(json);
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: err.message });
    }
});

app.get('/snapsave', async (req, res) => {
  try {
    // Check if URL parameter is present
    if (!req.query.url) {
      return res.status(400).json({
        status: 400,
        message: "Masukkan parameter url"
      });
    }

    // Scrape data from the provided URL
    let hasil = await scrap.snapsave(req.query.url);
      hasil = hasil.results;
    if (!hasil.length) {
      return res.status(404).json({
        status: 404,
        message: "No data found for the provided URL"
      });
    }

    // Get content type from the first result URL
    const response = await axios.head(hasil[0].url);
    let type = 'video';
    if (response.headers['content-type'].includes('image')) {
      type = 'image';
    } else if (response.headers['content-type'].includes('video')) {
      type = 'video';
    }

    // Construct and send the response
    const json = {
      endpoint: `${base}/api/snapsave?url=${encodeURIComponent(req.query.url)}`,
      status: 200,
      type,
      result: hasil
    };

    res.status(200).json(json);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/yt-mp3', async (req, res) => {
    let url = req.query.url;
    if (!ytdl.validateURL(url)) {
        return res.status(400).send('URL tidak valid');
    }
    res.header('Content-Disposition', `attachment; filename="NueApi ${Date.now()}.mp3"`);
    res.setHeader('Content-Type', 'audio/mpeg');
    ytdl(url, { filter : 'audioonly' }).pipe(res);
});

app.get('/yt-mp4', async (req, res) => {
    let url = req.query.url;
    if (!ytdl.validateURL(url)) {
        return res.status(400).send('URL tidak valid');
    }
    res.header('Content-Disposition', `attachment; filename="NueApi ${Date.now()}.mp4"`);
    res.setHeader('Content-Type', 'video/mp4');
    ytdl(url, { filter: 'videoandaudio' }).pipe(res);
});

const sdList = async (res) => {
    const options = {
        method: 'GET',
        url: 'https://api.prodia.com/v1/sd/models',
        headers: {
            accept: 'application/json',
            'X-Prodia-Key': apikey()
        }
    };

    axios
        .request(options)
        .then(function (response) {
            const formattedResponse = response.data.map(item => `<li>${item}</li>`).join('');
            const htmlResponse = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Model List</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css">
  <style>
      body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #121212;
          color: #e0e0e0;
      }
      .container {
          padding: 20px;
          max-width: 800px;
          margin: auto;
      }
      h1, h2 {
          text-align: center;
          margin-bottom: 20px;
      }
      ul {
          list-style-type: none;
          padding: 0;
      }
      li {
          background: #1e1e1e;
          margin: 10px 0;
          padding: 10px;
          border-radius: 5px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: space-between;
          align-items: center;
      }
      button {
          background: #ff6f61;
          border: none;
          padding: 10px;
          border-radius: 5px;
          color: white;
          cursor: pointer;
      }
      button:hover {
          background: #ff3b2e;
      }
      .overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
      }
      .spinner-border {
          width: 3rem;
          height: 3rem;
      }
      #loading {
          display: none;
      }
      @media (max-width: 600px) {
          h1, h2 {
              font-size: 1.5rem;
          }
          button {
              padding: 5px;
          }
      }
  </style>
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>
<body>
  <div id="loading" class="overlay">
      <div>
          <div class="spinner-border" role="status">
              <span class="visually-hidden">⌛</span>
          </div>
          <p>Jangan keluar dari halaman, loading paling lama 30 detik</p>
      </div>
  </div>
  <div class="container">
      <h1>List Model Stable Diffusion</h1>

      <form id="inputForm" class="mt-4">
          <div class="mb-3">
              <label for="model" class="form-label">Model</label>
              <input type="text" class="form-control" id="model" required>
          </div>
          <div class="mb-3">
              <label for="prompt" class="form-label">Prompt</label>
              <input type="text" class="form-control" id="prompt" required>
          </div>
          <div class="mb-3">
              <label for="type" class="form-label">Type</label>
              <select class="form-select" id="type" required>
                  <option value="" disabled selected>Select type</option>
                  <option value="text2img">Stable Diffusion</option>
                  <option value="diffpreset">Preset Diffusion</option>
              </select>
          </div>
          <div class="mb-3" id="presetDiv" style="display:none;">
              <label for="preset" class="form-label">Preset</label>
              <select class="form-select" id="preset">
                  <option value="" disabled selected>Select preset</option>
                  <option value="enhance">Enhance</option>
                  <option value="fantasy-art">Fantasy Art</option>
                  <option value="isometric">Isometric</option>
                  <option value="line-art">Line Art</option>
                  <option value="low-poly">Low Poly</option>
                  <option value="neon-punk">Neon Punk</option>
                  <option value="origami">Origami</option>
                  <option value="photographic">Photographic</option>
                  <option value="pixel-art">Pixel Art</option>
                  <option value="texture">Texture</option>
                  <option value="craft-clay">Craft Clay</option>
                  <option value="3d-model">3D Model</option>
                  <option value="analog-film">Analog Film</option>
                  <option value="anime">Anime</option>
                  <option value="cinematic">Cinematic</option>
                  <option value="comic-book">Comic Book</option>
                  <option value="digital-art">Digital Art</option>
              </select>
          </div>
          <button type="button" id="goButton" class="btn btn-primary" disabled>Go</button>
      </form>
      <ul class="mt-4">
          ${formattedResponse}
      </ul>
      <button id="copyAllButton" class="btn btn-secondary">Copy All</button>
  </div>
  <script>
      function copyToClipboard(text) {
          navigator.clipboard.writeText(text);
          alert('Copied to clipboard');
      }

      function updateLink() {
          const model = $('#model').val().trim();
          const prompt = $('#prompt').val().trim();
          const type = $('#type').val();
          const preset = $('#preset').val();
          if (type === "diffpreset") {
              if (model && prompt && type && preset) {
                  $('#goButton').prop('disabled', false);
                  $('#exDiffusion').attr('href', \`https://nue-api.vercel.app/api/diffpreset?model=\${model}&prompt=\${prompt}&preset=\${preset}\`);
              } else {
                  $('#goButton').prop('disabled', true);
              }
          } else {
              if (model && prompt && type) {
                  $('#goButton').prop('disabled', false);
                  $('#exDiffusion').attr('href', \`https://nue-api.vercel.app/api/\${type}?model=\${model}&prompt=\${prompt}\`);
              } else {
                  $('#goButton').prop('disabled', true);
              }
          }
      }

      $('#model, #prompt, #type, #preset').on('input', updateLink);

      $('#type').on('change', function() {
          if ($(this).val() === 'diffpreset') {
              $('#presetDiv').show();
          } else {
              $('#presetDiv').hide();
          }
          updateLink();
      });

      $('#goButton').on('click', function() {
          const model = $('#model').val().trim();
          const prompt = $('#prompt').val().trim();
          const type = $('#type').val();
          const preset = $('#preset').val();
          let url = '';
          if (type === 'diffpreset') {
              url = \`https://nue-api.vercel.app/api/diffpreset?model=\${model}&prompt=\${prompt}&preset=\${preset}\`;
          } else {
              url = \`https://nue-api.vercel.app/api/\${type}?model=\${model}&prompt=\${prompt}\`;
          }
          if (url) {
              $('#loading').show();
              $('body').css('overflow', 'hidden');
              setTimeout(() => {
                  window.location.href = url;
              }, 1000); // Simulating a delay for loading spinner visibility
          }
      });

      $('#copyAllButton').on('click', function() {
          const items = ${JSON.stringify(response.data)};
          copyToClipboard(JSON.stringify(items));
      });
  </script>
</body>
</html>
`;
            res.send(htmlResponse);
        })
        .catch(function (error) {
            res.send("Error fetching list");
        });
};

const sdxlList = async (res) => {
    const options = {
        method: 'GET',
        url: 'https://api.prodia.com/v1/sdxl/models',
        headers: {
            accept: 'application/json',
            'X-Prodia-Key': apikey()
        }
    };

    axios
        .request(options)
        .then(function (response) {
            const formattedResponse = response.data.map(item => `<li>${item}</li>`).join('');
            const htmlResponse = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Model List</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css">
  <style>
      body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #121212;
          color: #e0e0e0;
      }
      .container {
          padding: 20px;
          max-width: 800px;
          margin: auto;
      }
      h1, h2 {
          text-align: center;
          margin-bottom: 20px;
      }
      ul {
          list-style-type: none;
          padding: 0;
      }
      li {
          background: #1e1e1e;
          margin: 10px 0;
          padding: 10px;
          border-radius: 5px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: space-between;
          align-items: center;
      }
      button {
          background: #ff6f61;
          border: none;
          padding: 10px;
          border-radius: 5px;
          color: white;
          cursor: pointer;
      }
      button:hover {
          background: #ff3b2e;
      }
      .overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
      }
      .spinner-border {
          width: 3rem;
          height: 3rem;
      }
      #loading {
          display: none;
      }
      @media (max-width: 600px) {
          h1, h2 {
              font-size: 1.5rem;
          }
          button {
              padding: 5px;
          }
      }
  </style>
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>
<body>
  <div id="loading" class="overlay">
      <div>
          <div class="spinner-border" role="status">
              <span class="visually-hidden">⌛</span>
          </div>
          <p>Jangan keluar dari halaman, loading paling lama 30 detik</p>
      </div>
  </div>
  <div class="container">
      <h1>List Model Stable Diffusion XL</h1>
      <p class="lead"></p>
      <form id="inputForm" class="mt-4">
          <div class="mb-3">
              <label for="model" class="form-label">Model</label>
              <input type="text" class="form-control" id="model" required>
          </div>
          <div class="mb-3">
              <label for="prompt" class="form-label">Prompt</label>
              <input type="text" class="form-control" id="prompt" required>
          </div>
          <button type="button" id="goButton" class="btn btn-primary" disabled>Go</button>
      </form>
      <ul class="mt-4">
          ${formattedResponse}
      </ul>
      <button id="copyAllButton" class="btn btn-secondary">Copy All</button>
  </div>
  <script>
      function copyToClipboard(text) {
          navigator.clipboard.writeText(text);
          alert('Copied to clipboard');
      }

      function updateLink() {
          const model = $('#model').val().trim();
          const prompt = $('#prompt').val().trim();
          if (model && prompt) {
              $('#goButton').prop('disabled', false);
              $('#exExample').attr('href', \`https://nue-api.vercel.app/api/sdxl?model=\${model}&prompt=\${prompt}\`);
          } else {
              $('#goButton').prop('disabled', true);
          }
      }

      $('#model, #prompt').on('input', updateLink);

      $('#goButton').on('click', function() {
          const model = $('#model').val().trim();
          const prompt = $('#prompt').val().trim();
          if (model && prompt) {
              $('#loading').show();
              $('body').css('overflow', 'hidden');
              setTimeout(() => {
                  window.location.href = \`https://nue-api.vercel.app/api/sdxl?model=\${model}&prompt=\${prompt}\`;
              }, 1000); // Simulating a delay for loading spinner visibility
          }
      });

      $('#copyAllButton').on('click', function() {
          const items = ${JSON.stringify(response.data)};
          copyToClipboard(JSON.stringify(items));
      });
  </script>
</body>
</html>
`;
            res.send(htmlResponse);
        })
        .catch(function (error) {
            res.send("Error fetching list");
        });
};



app.listen(8000, () => {
console.log("Berjalan di port 8000")
});
