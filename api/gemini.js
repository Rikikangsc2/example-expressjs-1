const fs = require('fs');
const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMMA_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GEMMA_MODEL_NAME = "gemma2-9b-it";
const API_KEY = Math.random() < 0.5 ? "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" : "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";
const GEMINI_API_KEY = "AIzaSyCtBDTdbx37uvBqiImuFdZFfAf5RD5igVY";
const dbPath = 'db/data.json';
const modelPath = 'db/model.json';

const generationConfig = {
  temperature: 0.7,
  max_tokens: 500,
  top_p: 1,
  stream: false,
  stop: null,
};

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const initializeDb = () => {
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({}), 'utf8');
  if (!fs.existsSync(modelPath)) fs.writeFileSync(modelPath, JSON.stringify({}), 'utf8');
};

const loadHistory = (user) => {
  try {
    initializeDb();
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    return data[user]?.history || [];
  } catch {
    return [];
  }
};

const saveHistory = (user, history) => {
  try {
    initializeDb();
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    data[user] = { history };
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch {}
};

const loadModelConfig = (user) => {
  try {
    initializeDb();
    const data = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
    return data[user] || { lastTokenCount: 0, systemPrompt: "" };
  } catch {
    return { lastTokenCount: 0, systemPrompt: "" };
  }
};

const saveModelConfig = (user, config) => {
  try {
    initializeDb();
    const data = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
    data[user] = config;
    fs.writeFileSync(modelPath, JSON.stringify(data, null, 2), 'utf8');
  } catch {}
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
  let history = loadHistory(user);
  const modelConfig = loadModelConfig(user);

  try {
    if (url) {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const imageData = Buffer.from(response.data).toString("base64");

      const result = await model.generateContent([
  `${history.map((item) => `*${item.role === 'assistant' ? 'Gemini' : 'User'}*: ${item.content}`).join('\n')}${"User"+text}\nGemini:`,
  { inlineData: { data: imageData, mimeType: "image/png" }}
]);

const groqOutputText = result.response.text();
const cleanedOutputText = groqOutputText.split(/user|gemini/i)[0];

      history.push({ role: "user", content: text });
      history.push({ role: "assistant", content: cleanedOutputText });
      saveHistory(user, history);

      return res.json({ result: cleanedOutputText });
    }

    if (text.startsWith("setPrompt:")) {
      const newPrompt = text.replace("setPrompt:", "").trim();
      modelConfig.systemPrompt = `${newPrompt}`;
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

    const userMessage = text;
    history.push({ role: "user", content: userMessage });
    history = manageTokenCount(history);

    const messages = modelConfig.systemPrompt
      ? [{ role: "system", content: modelConfig.systemPrompt }, ...history]
      : [{ role: "system", content: req.query.prompt || "Kamu adalah Alicia gadis 17 tahun, kamu jangan mengakui kalo kamu AI, dan typing kamu harus kaya manusia dan remaja perempuan pada umumnya. Hindari berprilaku seperti AI!.",}, ...history];

    const responseGemma = await axios.post(GEMMA_API_URL, {
      model: GEMMA_MODEL_NAME,
      messages,
      ...generationConfig,
    }, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      }
    });

    const responseText = responseGemma.data.choices[0].message.content;
    history.push({ role: "assistant", content: responseText });
    saveHistory(user, history);

    modelConfig.lastTokenCount = history.reduce((acc, msg) => acc + msg.content.length, 0);
    saveModelConfig(user, modelConfig);

    res.json({ result: responseText });
  } catch ({message}) {
    res.status(500).json({ error: message });
  }
};