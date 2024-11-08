const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKeys = [
  'AIzaSyCtBDTdbx37uvBqiImuFdZFfAf5RD5igVY',
  'AIzaSyCqpoEhY-CeE52yUGfThxebOT8R9iTbwFs',
  'AIzaSyAS6CLgV1nFuSksdMBwo4gQfro1fHUFBHU'
];

const getRandomApiKey = () => {
  const randomIndex = Math.floor(Math.random() * apiKeys.length);
  return apiKeys[randomIndex];
};
const apiKey = getRandomApiKey();
const genAI = new GoogleGenerativeAI(apiKey);

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

// Function to save user-specific chat history
const saveHistory = (user, history) => {
  if (history.length > 30) history.shift();
  fs.writeFileSync(`data_${user}.json`, JSON.stringify(history, null, 2));
};

// Function to load user-specific chat history
const loadHistory = (user) => {
  const filePath = `data_${user}.json`;
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify([]));
  return JSON.parse(fs.readFileSync(filePath));
};

module.exports = async (req, res) => {
  const { text, systemPrompt, user } = req.query;
  let history = loadHistory(user);

  // Create a new chat session with the provided systemPrompt for systemInstruction
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: systemPrompt || "Default system instruction",
  });

  const chatSession = model.startChat({
    generationConfig,
    history: [...history, { role: "user", parts: [{ text }] }],
  });

  const result = await chatSession.sendMessage(text);
  const responseText = result.response.text();

  // Update history with user and model messages
  history.push({ role: "user", parts: [{ text }] }, { role: "model", parts: [{ text: responseText }] });
  saveHistory(user, history);

  res.json({ result: responseText });
};
