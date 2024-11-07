const axios = require('axios');
const userAgent = require('fake-useragent'); // Import fake-useragent
let chatHistory = [];

// Array of API keys
const apiKeys = [
  'AIzaSyCtBDTdbx37uvBqiImuFdZFfAf5RD5igVY',
  'AIzaSyCqpoEhY-CeE52yUGfThxebOT8R9iTbwFs',
  'AIzaSyAS6CLgV1nFuSksdMBwo4gQfro1fHUFBHU'
];

// Function to select a random API key
const getRandomApiKey = () => {
  const randomIndex = Math.floor(Math.random() * apiKeys.length);
  return apiKeys[randomIndex];
};

const handleChat = async (req, res) => {
  const userId = req.query.user;
  const prompt = req.query.text || '';
  const systemMessage = req.query.systemPrompt || 'You are a helpful assistant';
  const aiMessage = req.query.aiMessage || '';

  const sendRequest = async (sliceLength) => {
    try {
      const messages = [
        ...chatHistory.slice(-sliceLength).map(message => ({
          role: message.role,
          parts: [{ text: message.content }]
        })),
        { role: "user", parts: [{ text: prompt }] }
      ];

      const payload = {
        contents: messages,
        systemInstruction: {
          role: "user",
          parts: [{ text: systemMessage }]
        },
        generationConfig: {
          temperature: 1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500,
          responseMimeType: "text/plain"
        }
      };

      // Get a random API key and generate a fake user agent
      const apiKey = getRandomApiKey();
      const fakeUserAgent = userAgent(); // Generate a fake user agent

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        payload,
        { 
          headers: { 
            'Content-Type': 'application/json',
            'User-Agent': fakeUserAgent // Set fake user agent
          }
        }
      );

      // Extract the model's response text from the 'candidates' array
      const assistantMessage = response.data.candidates[0].content.parts[0].text.trim();

      // Store the chat history
      chatHistory.push({ role: "user", content: prompt }, { role: "assistant", content: assistantMessage });

      // Limit history to 50 messages
      if (chatHistory.length > 50) chatHistory = chatHistory.slice(-50);

      // Save user-specific history if userId exists
      if (userId) {
        await axios.post(`https://copper-ambiguous-velvet.glitch.me/write/${userId}`, {
          json: { [userId]: chatHistory }
        });
      }

      // Return the result
      res.json({ result: assistantMessage, history: userId ? `https://copper-ambiguous-velvet.glitch.me/read/${userId}` : null });
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  try {
    if (userId) {
      try {
        const readResponse = await axios.get(`https://copper-ambiguous-velvet.glitch.me/read/${userId}`);
        chatHistory = readResponse.data[userId] || [];
      } catch (error) {
        await axios.post(`https://copper-ambiguous-velvet.glitch.me/write/${userId}`, { json: { [userId]: [] } });
        chatHistory = [];
      }
    } else {
      chatHistory = [];
    }

    let success = await sendRequest(50);
    if (!success) success = await sendRequest(45);
    if (!success) success = await sendRequest(40);
    if (!success) success = await sendRequest(35);
    if (!success) success = await sendRequest(30);
    if (!success) success = await sendRequest(25);
    if (!success) success = await sendRequest(20);
    if (!success) success = await sendRequest(15);
    if (!success) success = await sendRequest(10);
    if (!success) success = await sendRequest(5);
    if (!success) {
      chatHistory = [];
      success = await sendRequest(0);
    }
    if (!success) throw new Error('All retries failed');
  } catch (error) {
    if (userId) {
      await axios.post(`https://copper-ambiguous-velvet.glitch.me/write/${userId}`, { json: { [userId]: [] } });
    }
    console.error('Error request:', error);
    res.status(200).json({ result: 'Hello new user👋🏻' });
  }
};

module.exports = { handleChat };