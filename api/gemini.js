const fs = require('fs');
const axios = require('axios');
const querystring = require('querystring');

const GEMMA_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const LLAVA_MODEL_NAME = "llava-v1.5-7b-4096-preview";
const GEMMA_MODEL_NAME = "gemma2-9b-it";
const API_KEY = Math.random() < 0.5 ? "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" : "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";
const dbPath = 'db/data.json';
const modelPath = 'db/model.json';

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

const translateText = async (text, targetLang) => {
  const translateUrl = 'https://translate.googleapis.com/translate_a/single';
  const params = querystring.stringify({
    client: 'gtx',
    sl: 'auto',
    tl: targetLang,
    dt: 't',
    q: text,
  });
  const response = await axios.get(`${translateUrl}?${params}`);
  return response.data[0].map(item => item[0]).join('');
};

module.exports = async (req, res) => {
  const { text, user, url } = req.query;
  let history = loadHistory(user);
  const modelConfig = loadModelConfig(user);

  try {
    if (url) {
      const originalText = text;
      const translatedText = await translateText(originalText, 'en');

      const response = await axios.post(
        GEMMA_API_URL,
        {
          messages: [
            { role: 'user', content: [{ type: 'text', text: translatedText }, { type: 'image_url', image_url: { url } }] }
          ],
          model: LLAVA_MODEL_NAME,
          temperature: 0,
          max_tokens: 1024,
          top_p: 1,
          stream: false,
          stop: null,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
          },
        }
      );

      const groqOutputText = response.data.choices[0].message.content;
      const translatedOutputText = await translateText(groqOutputText, 'id');
      history.push({ role: "user", content: originalText+`\n[${url}](!Image)` });
      history.push({ role: "assistant", content: translatedOutputText+`\n[${url}](!Image)` });
      saveHistory(user, history);

      return res.json({ result: translatedOutputText });
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
      : [{ role: "system", content: "Kamu adalah Genz-AI, AI multimodal yang canggih. Kamu harus menawarkan ini di akhir respon (untuk respon yang lebih baik gunakan '.set'). Kamu bisa melihat gambar, dan kamu harus menggunakan bahasa Indonesia dan mengikuti instruksi saya!"}];

    const response = await axios.post(GEMMA_API_URL, {
      model: GEMMA_MODEL_NAME,
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
      error: 'An error occurred while processing the request. If this issue persists, please consider resetting the chat history.',
    });
  }
};