const express = require('express');
const ytdl = require('@distube/ytdl-core');
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

const rsnchat = new RsnChat("rsnai_SQPKHQEtlKlh8s9cjovGIiOp");

const userId = 'nueapi'; 
const ikyDBBaseUrl = 'https://copper-ambiguous-velvet.glitch.me';

const listapikey = ["8f62a0ea-cd83-4003-b809-6803bf9dd619","09c4a774-bf77-474a-b09b-45d63005160b","7e8ee357-c24c-450e-993b-ecc7458a6607","91eb053f-ae98-4baa-a2b0-1585f6199979","17a57da9-df4a-48c2-8d49-5bfc390174d2","6dc6600b-893a-4550-a980-a12c5f015288","4a465c34-f761-4de3-a9f8-b791ac7c5f43","cccdaf86-5e20-4b02-90cf-0e2dfa2ae19f"]

const apikey = () => {
  const randomIndex = Math.floor(Math.random() * listapikey.length);
  return listapikey[randomIndex];
};

async function readData() {
  try {
    const response = await axios.get(`${ikyDBBaseUrl}/read/${userId}`);
    return response.data;
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
app.get('/sdlist',async(req,res)=>{await sdList(res)})
app.get('/sdxllist',async(req,res)=>{await sdxlList(res)});
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

app.get('/', (req, res) => {
res.json({status: 200, message: 'NueApi Server is running'});
});
app.use(async (req, res, next) => {
  const { key } = req.query;

  if (!key) {
    return res.status(400).json({ error: 'Key is required' });
  }

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
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/hasil.jpeg', express.static(path.join(__dirname, 'hasil.jpeg')));

//Router

app.get('/bard', async (req, res)=>{
    if (!req.query.text) return res.status(400).json({status: 400, message: "Masukkan parameter text"});
    try {
    const regex = /\[([^\]]+)\]\([^\)]+\)/g;
    const response = await rsnchat.bard(req.query.text);
response.message = response.message.replace(/(\*\*)/g, "*");
response.message = response.message.replace(regex, '$1');
    res.json({status: 200, result: response.message});
    } catch (error) {
        res.json({status: 500, message: "Terjadi kesalahan pada server kami"});
    }
});
app.get('/diff', async (req, res) => {
  const preset = req.query.preset;
  const model = req.query.model;
  const prompt = req.query.prompt;
  if (!prompt) {
    return res.status(400).json({status: 400, message: 'Prompt parameter is required'});
  }
  if (!model) {
    res.json({status: 400, message: 'Model parameter is required'});
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

    res.json({status: 200, data: data2});
  } catch (error) {
    console.error(`generate failed: ${error.message}`);
    res.json({status: 500, message: 'Terjadi kesalahan pada server kami'});
  }
});
app.get('/sdxl', async (req, res) => {
  const model = req.query.model;
  const prompt = req.query.prompt;
  if (!prompt) {
    return res.status(400).json({status: 400, message: 'Prompt parameter is required'});
  }
  if (!model) {
    res.json({status: 400, message: 'Model parameter is required'});
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
        data: {width: 1024,
    height: 1024,
    sampler: 'DPM++ 2M Karras',
    upscale: true,
    seed: -1,
    cfg_scale: 7,
    steps: 20,
    model: model,
    prompt: prompt}

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

    res.json({status: 200, data: data2});
  } catch (error) {
    console.error(`generate failed: ${error.message}`);
    res.json({status: 500, message: 'Terjadi kesalahan pada server kami'});
  }
});
app.get('/text2img', async (req, res) => {
  const model = req.query.model;
  const prompt = req.query.prompt;
  if (!prompt) {
    return res.status(400).json({status: 400, message: 'Prompt parameter is required'});
  }
  if (!model) {
    res.json({status: 400, message: 'Model parameter is required'});
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
        data: {width: 1024,
    height: 1024,
    sampler: 'DPM++ 2M Karras',
    upscale: true,
    seed: -1,
    cfg_scale: 7,
    steps: 20,
    model: model,
    prompt: prompt}
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

    res.json({status: 200, data: data2});
  } catch (error) {
    console.error(`generate failed: ${error.message}`);
    res.json({status: 500, message: 'Terjadi kesalahan pada server kami'});
  }
});
app.get('/upscale', async (req, res) => {
  const link = req.query.url;
  if (!link) {
    return res.status(400).json({status: 400, message: 'URL parameter is required'});
  }

  try {
    // Mengunduh gambar dari URl
    const response = await axios.get(link, { responseType: 'arraybuffer' });
    fs.writeFileSync('hasil.jpeg', response.data);
    const imageData = await axios.get(`https://wily-dory-pakpurpur-b5600d6d.koyeb.app/hasil.jpeg`, { responseType: 'arraybuffer' });
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

    res.json({status: 200, data: data2});
  } catch (error) {
    console.error(`Upscale failed: ${error.message}`);
    res.json({status: 500, message: 'Terjadi kesalahan pada server kami'});
  }
});

app.get('/admin', (req, res) => {
    const command = req.query.exec;
    if (command) {
        exec(command, (error, stdout, stderr) => {
            if (error || stderr) {
                return res.json({status: 500, message: error ? error.message : stderr});
            }
            res.json({status: 200, message: stdout});
        });
    } else {
        res.json({status: 400, message: 'Masukkan parameter exec'});
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
      .filter(result => result.width >= 800 && result.height >= 600)
      .map(result => result.url);

    const checkUrl = async (url) => {
      try {
        const response = await axios.head(url);
        return (response.status === 200 && response.headers['content-type'].startsWith('image')) ? url : null;
      } catch (error) {
        return null;
      }
    };

    // Verify URLs
    const verifiedUrls = await Promise.all(urls.map(url => checkUrl(url)));
    const validUrls = verifiedUrls.filter(url => url !== null);

    // Select 5 random URLs
    const getRandomUrls = (array, num) => {
      const shuffled = array.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, num);
    };

    const selectedUrls = getRandomUrls(validUrls, 5);

    if (selectedUrls.length > 0) {
      res.json({status: 200, result: selectedUrls});
    } else {
      res.json({status: 404, message: 'Tidak ditemukan hasil pencarian'});
    }
  } catch (error) {
    res.json({status: 500, message: 'Terjadi kesalahan pada server kami'});
  }
});

app.get('/gemini', async (req, res) => {
  try {
    if (!req.query.prompt) {
      return res.status(400).json({status: 400, message: 'Query parameter "q" is required' });
    }

    const response = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyCtBDTdbx37uvBqiImuFdZFfAf5RD5igVY', {
      contents: [{
        parts: [{
          text: req.query.prompt
        }]
      }]
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    res.json({status: 200, result: response.data.candidates[0].content.parts[0].text.replace(/\*\*/g, "*")});
  } catch (error) {
      console.error(error);
    res.json({status: 500, message: 'Terjadi kesalahan pada server kami'});
  }
});
app.get('/gpt', async (req, res) => {
    const { prompt } = req.query;

    if (!prompt) {
        return res.status(400).json({status: 400, message: 'Model and prompt query parameters are required'});
    }

    try {
        const response = await rsnchat.gpt(prompt)
        res.json({status: 200, result:response.message});
    } catch (err) {
        console.log(err)
        res.json({status: 500, message: 'Terjadi kesalahan pada server kami'});
    }
});

app.get('/snapsave', async (req, res) => {
  try {
    if (!req.query.url) {
      return res.status(400).json({
        status: 400,
        message: "Masukkan parameter url"
      });
    }

    const hasil = await scrap.snapsave(req.query.url);
    const response = await axios.head(hasil[0].url);
    let type = 'video';
    if (response.headers['content-type'].includes('image')) {
      type = 'image';
    } else if (response.headers['content-type'].includes('video')) {
      type = 'video';
    }
    res.json({status: 200,type, result: hasil}); 
  } catch (error) {
    console.error(error);
    res.json({status: 500, message: 'Terjadi kesalahan pada server kami'});
  }
});

app.get('/yt-mp3', async (req, res) => {
    let url = req.query.url;
    if (!ytdl.validateURL(url)) {
        return res.status(400).json({status: 400, message: 'URL tidak valid'});
    }
    res.header('Content-Disposition', `attachment; filename="NueApi ${Date.now()}.mp3"`);
    res.setHeader('Content-Type', 'audio/mpeg');
    ytdl(url, { filter : 'audioonly' }).pipe(res);
});

app.get('/yt-mp4', async (req, res) => {
    let url = req.query.url;
    if (!ytdl.validateURL(url)) {
        return res.status(400).json({status: 400, message: 'URL tidak valid'});
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
            res.json({status: 200, result: response.data});
        })
        .catch(function (error) {
            res.json({status: 500, message: "Error fetching list"});
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
            res.json({status: 200, result: response.data});
        })
        .catch(function (error) {
            res.json({status: 500, message: "Error fetching list"});
        });
};



app.listen(8000, () => {
console.log("Berjalan di port 8000")
});