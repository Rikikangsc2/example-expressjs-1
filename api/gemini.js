const fs = require('fs');
const axios = require('axios');

const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const API_KEY = Math.random() < 0.5 ? "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" : "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";
const dbPath = 'db/data.json';
const modelPath = 'db/model.json';
const MODEL_NAME = "gemma2-9b-it";

const generationConfig = {
  temperature: 1,
  max_tokens: 200,
  top_p: 1,
  stream: false,
  stop: null,
};

const initializeDb = () => {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({}), 'utf8');
  }
  if (!fs.existsSync(modelPath)) {
    fs.writeFileSync(modelPath, JSON.stringify({}), 'utf8');
  }
};

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

const manageTokenCount = (history) => {
  let totalTokens = history.reduce((acc, msg) => acc + msg.content.length, 0);
  while (totalTokens > 3000 && history.length > 1) {
    history.shift();
    totalTokens = history.reduce((acc, msg) => acc + msg.content.length, 0);
  }
  return history;
};

module.exports = async (req, res) => {
  const { text, user, url } = req.query;
  let gambar = null;

  if (url) {
    try {
      const response = await axios.get('https://purapi.koyeb.app/imgtext', { params: { url: url, text: text+". Deskripsikan gambarnya secara detail." } });
      gambar = response.data.trim();
    } catch (error) {
      gambar = null;
    }
  }

  let history = loadHistory(user);
  const modelConfig = loadModelConfig(user);

  if (text.startsWith("setPrompt:")) {
    const newPrompt = text.replace("setPrompt:", "").trim();
    modelConfig.systemPrompt = newPrompt;
    modelConfig.lastTokenCount = 0;
    saveModelConfig(user, modelConfig);
    history = [];
    saveHistory(user, history);
    return res.json({ result: "System prompt has been set and chat history reset." });
  }

  if (text === "reset") {
    history = [];
    saveHistory(user, history);
    return res.json({ result: "Chat history has been reset." });
  }

  const userMessage = gambar 
    ? `${text}\n\n[!img: ${gambar}](Jelaskan deskripsi gambar ke pengguna, dan jangan di lebih lebihkan atau bahkan di kurangi. Jadi berikan apa adanya saja!.\n\nNote: Jika deskripsi belum jelas dan tidak bisa untuk memenuhi permintaan pengguna silahkan beri respon \"Aku masih belajar, silahkan kirim ulang gambar dan printahkan aku lebih jelas lagi!\")`
    : text;

  history.push({ role: "user", content: userMessage });

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
    history.push({ role: "assistant", content: responseText });
    saveHistory(user, history);

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