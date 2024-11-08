const fs = require('fs');
const axios = require('axios');

const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const API_KEY = "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";
const dbPath = 'db/data.json';
const modelPath = 'db/model.json';
const MODEL_NAME = "llama3-8b-8192";

// Configuration for API request
const generationConfig = {
  temperature: 1,
  max_tokens: 500,
  top_p: 1,
  stream: false,
  stop: null,
};

// Initialize databases if they don't exist
const initializeDb = () => {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({}), 'utf8');
  }
  if (!fs.existsSync(modelPath)) {
    fs.writeFileSync(modelPath, JSON.stringify({}), 'utf8');
  }
};

// Load chat history for a user
const loadHistory = (user) => {
  try {
    initializeDb();
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    return data[user]?.history || [];
  } catch (error) {
    console.error('Error loading history:', error);
    return [];
  }
};

// Save chat history for a user
const saveHistory = (user, history) => {
  try {
    initializeDb();
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    data[user] = { history };
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving history:', error);
  }
};

// Load model configuration
const loadModelConfig = (user) => {
  try {
    initializeDb();
    const data = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
    return data[user] || { lastTokenCount: 0, systemPrompt: "" };
  } catch (error) {
    console.error('Error loading model config:', error);
    return { lastTokenCount: 0, systemPrompt: "" };
  }
};

// Save model configuration
const saveModelConfig = (user, config) => {
  try {
    initializeDb();
    const data = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
    data[user] = config;
    fs.writeFileSync(modelPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving model config:', error);
  }
};

// Function to manage token count and history trimming
const manageTokenCount = (history) => {
  let totalTokens = history.reduce((acc, msg) => acc + msg.content.length, 0);
  while (totalTokens > 7192 && history.length > 1) {
    history.shift(); // Remove the oldest message until total tokens are under 7192
    totalTokens = history.reduce((acc, msg) => acc + msg.content.length, 0);
  }
  return history;
};

module.exports = async (req, res) => {
  const { text, user } = req.query;
  let history = loadHistory(user);
  const modelConfig = loadModelConfig(user);

  // Set system prompt if "setPrompt:" command is issued
  if (text.startsWith("setPrompt:")) {
    const newPrompt = text.replace("setPrompt:", "").trim();
    modelConfig.systemPrompt = newPrompt;
    modelConfig.lastTokenCount = 0;
    saveModelConfig(user, modelConfig);
    history = [];
    saveHistory(user, history);
    return res.json({ result: "System prompt has been set and chat history reset." });
  }

  // Reset history if "reset" command is issued
  if (text === "reset") {
    history = [];
    saveHistory(user, history);
    return res.json({ result: "Chat history has been reset." });
  }

  // Update history with new user message
  history.push({ role: "user", content: text });

  // Trim history to keep within token limit
  history = manageTokenCount(history);

  try {
    const messages = modelConfig.systemPrompt
      ? [{ role: "system", content: modelConfig.systemPrompt }, ...history]
      : history;

    const response = await axios.post(API_URL, {
      model: MODEL_NAME,
      messages,
      ...generationConfig,
    }, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      }
    });

    const responseText = response.data.choices[0].message.content;

    // Update history with AI response and save it
    history.push({ role: "assistant", content: responseText });
    saveHistory(user, history);

    // Update last token count in model config and save
    modelConfig.lastTokenCount = history.reduce((acc, msg) => acc + msg.content.length, 0);
    saveModelConfig(user, modelConfig);

    res.json({ result: responseText });
  } catch (error) {
    console.error('Error during chat session:', error);
    res.status(500).json({
      error: 'An error occurred while processing the request. If this issue persists, please consider resetting the chat history.'
    });
  }
};