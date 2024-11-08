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
  maxOutputTokens: 200,
  responseMimeType: "text/plain",
};

const dbPath = 'db/data.json';

const initializeDb = () => {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({}), 'utf8');
  }
};

const loadHistory = (user) => {
  try {
    initializeDb();
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    return data[user] || [];
  } catch (error) {
    console.error('Error loading history:', error);
    return [];
  }
};

const saveHistory = (user, history) => {
  try {
    initializeDb();
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    if (history.length > 30) history.shift();
    data[user] = history;
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving history:', error);
  }
};

module.exports = async (req, res) => {
  const { text, systemPrompt, user } = req.query;
  let history = loadHistory(user);

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt || "Kamu adalah Alicia AI yang ramah, dan akrab!.",
    });

    const chatSession = model.startChat({
      generationConfig,
      history: [...history, { role: "user", parts: [{ text }] }],
    });

    const result = await chatSession.sendMessage(text);
    const responseText = result.response.text();

    history.push({ role: "user", parts: [{ text }] }, { role: "model", parts: [{ text: responseText }] });
    saveHistory(user, history);

    res.json({ result: responseText });
  } catch (error) {
    console.error('Error during chat session:', error);
    history.splice(-5, 5);
    saveHistory(user, history);
    res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
};
