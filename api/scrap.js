const axios = require('axios');

module.exports = async (req, res) => {
  const url = req.query.url;

  try {
    const response = await axios.get(url, { responseType: 'text' });
    const contentType = response.headers['content-type'];

    if (contentType.includes('text/html') || contentType.includes('application/json')) {
      const data = response.data;

      const result = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyCtBDTdbx37uvBqiImuFdZFfAf5RD5igVY`, {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: data
              }
            ]
          }
        ],
        systemInstruction: {
          role: "user",
          parts: [
            {
              text: "Anda adalah pembuat JSON tugas anda adalah membuat JSON dari html untuk mengambil isinya\n\nJSON yang anda buat harus seperti ini:\n{\n\"title\":,\n\"ringkasan\":\n}\n\nCatatan: langsung kirim format JSON tanpa tambahan teks apapun sebelum dan sesudah membuat JSON"
            }
          ]
        },
        generationConfig: {
          temperature: 1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
          responseMimeType: "text/plain"
        }
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      res.json(JSON.parse(result.data.candidates[0].content.parts[0].text))
    } else {
      res.status(400).send('Invalid content type for processing');
    }
  } catch (error) {
    res.status(500).send('Error processing request');
  }
};