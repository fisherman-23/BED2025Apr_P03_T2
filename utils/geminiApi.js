const axios = require("axios");

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  const { data } = await axios.post(`${endpoint}?key=${apiKey}`, body);
  return data;
}

module.exports = {
  callGemini,
};
