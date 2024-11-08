const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKeys = [
  'AIzaSyCtBDTdbx37uvBqiImuFdZFfAf5RD5igVY',
  'AIzaSyCqpoEhY-CeE52yUGfThxebOT8R9iTbwFs',
  'AIzaSyAS6CLgV1nFuSksdMBwo4gQfro1fHUFBHU'
];

// Get a random API key
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

const dbPath = 'db/data.json';

// Ensure db/data.json exists and is initialized as an empty object if not
const initializeDb = () => {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({}), 'utf8');
  }
};

// Load chat history for a specific user
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

// Save chat history for a specific user
const saveHistory = (user, history) => {
  try {
    initializeDb();
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    if (history.length > 30) history.shift();  // Limit history to 30 entries
    data[user] = history;
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving history:', error);
  }
};

// Main function to handle requests
module.exports = async (req, res) => {
  const { text, systemPrompt, user } = req.query;
  let history = loadHistory(user);

  try {
    // Create a new chat session with the provided systemPrompt for systemInstruction
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

    // Update history with user and model messages
    history.push({ role: "user", parts: [{ text }] }, { role: "model", parts: [{ text: responseText }] });
    saveHistory(user, history);

    res.json({ result: responseText });
  } catch (error) {
    console.error('Error during chat session:', error);
    res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
};