const axios = require('axios');
const cheerio = require('cheerio'); // Add cheerio for HTML parsing

module.exports = async (req, res) => {
  const url = req.query.url;

  try {
    // Fetch the HTML content from the specified URL
    const response = await axios.get(url, { responseType: 'text' });
    const contentType = response.headers['content-type'];

    // Check if the content type is either HTML or JSON
    if (contentType.includes('text/html') || contentType.includes('application/json')) {
      const data = response.data;

      // Use Cheerio to load and filter the HTML
      const $ = cheerio.load(data);

      // Remove unwanted elements like <script>, <style>, etc.
      $('script, style, header, footer, nav').remove();

      // Extract and consolidate the text content
      const textContent = $('body').text().replace(/\s+/g, ' ').trim();

      // Send the cleaned text to the generative model API
      const result = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyCtBDTdbx37uvBqiImuFdZFfAf5RD5igVY`, {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: textContent
              }
            ]
          }
        ],
        systemInstruction: {
          role: "user",
          parts: [
            {
              text: "Anda adalah pembuat JSON tugas anda adalah membuat JSON dari teks untuk mengambil isinya\n\nJSON yang anda buat harus seperti ini:\n{\n\"title\":,\n\"ringkasan\":\n}\n\nCatatan: langsung kirim format JSON tanpa tambahan teks apapun sebelum dan sesudah membuat JSON"
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

      // Parse and return the AI-generated JSON response
      res.json(JSON.parse(result.data.candidates[0].content.parts[0].text));
    } else {
      res.status(400).send('Invalid content type for processing');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing request');
  }
};