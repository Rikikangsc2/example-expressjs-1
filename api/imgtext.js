const axios = require('axios');
const querystring = require('querystring');
const API_KEY = Math.random() < 0.5 ? "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" : "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";

module.exports = async (req, res) => {
  try {
    // Ambil URL gambar dan teks dari query
    const imageUrl = req.query.url;
    const originalText = req.query.text;

    // Pastikan input yang diperlukan ada
    if (!imageUrl || !originalText) {
      return res.status(400).json({ error: 'Parameter url dan text diperlukan' });
    }

    // Menerjemahkan teks ke bahasa Inggris menggunakan Google Translate
    const translateUrl = 'https://translate.googleapis.com/translate_a/single';
    const translateParams = querystring.stringify({
      client: 'gtx',
      sl: 'auto',  // Deteksi bahasa secara otomatis
      tl: 'en',    // Terjemahkan ke bahasa Inggris
      dt: 't',
      q: originalText
    });

    // Request untuk terjemahan
    const translationResponse = await axios.get(`${translateUrl}?${translateParams}`);
    const translatedText = translationResponse.data[0].map(item => item[0]).join('');

    // Panggil API Groq dengan teks dan URL gambar yang sudah diterjemahkan
    const groqResponse = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: translatedText },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        model: 'llava-v1.5-7b-4096-preview',
        temperature: 0,
        max_tokens: 1024,
        top_p: 1,
        stream: false,
        stop: null
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer '+API_KEY
        }
      }
    );

    // Kirim hasil response dari Groq API ke pengguna
    res.json(groqResponse.data.choices[0].message.content);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server', details: error.message });
  }
};