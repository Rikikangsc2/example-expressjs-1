const axios = require('axios');
const cheerio = require('cheerio');
const API_KEY = Math.random() < 0.5 ? "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" : "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";

module.exports = async (req, res) => {
  const url = req.query.url;

  try {
    const response = await axios.get(url, { responseType: 'text' });
    const contentType = response.headers['content-type'];

    if (contentType.includes('text/html') || contentType.includes('application/json')) {
      const data = response.data;
      const $ = cheerio.load(data);
      $('script, style, header, footer, nav').remove();
      const textContent = $('body').text().replace(/\s+/g, ' ').trim();

      const result = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        messages: [
          {
            role: "system",
            content: `Anda adalah pembuat JSON tugas anda adalah membuat JSON dari teks untuk mengambil isinya\n\nJSON yang anda buat harus seperti:

{
 "judul", //judul
 "konten", //konten penuh
 "ringkasan" //ringkas konten
}

Catatan: 
- langsung kirim format JSON tanpa tambahan teks apapun sebelum dan sesudah membuat JSON
- format JSON harus valid dan harus di encode
- jangan kirim text selain JSON`
          },
          {
            role: "user",
            content: textContent
          }
        ],
        model: "llama3-8b-8192",
        temperature: 0,
        max_tokens: 1024,
        top_p: 1,
        stream: false,
        stop: null
      }, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}` // Assuming you store the key in an environment variable
        }
      });
     const jsonObject = JSON.parse(result.data.choices[0].message.content.match(/{.*}/s)[0]); 
      res.json(jsonObject); 
    } else {
      res.status(400).send('Invalid content type for processing');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing request');
  }
};
