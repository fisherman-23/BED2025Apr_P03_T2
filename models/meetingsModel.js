const axios = require("axios");

const DAILY_API_KEY = process.env.DAILY_API_KEY;
if (!DAILY_API_KEY) {
  throw new Error("Missing DAILY_API_KEY in environment");
}

async function createRoom(name) {
  const endpoint = "https://api.daily.co/v1/rooms";
  const headers = {
    Authorization: `Bearer ${DAILY_API_KEY}`,
    "Content-Type": "application/json",
  };
  const payload = name ? { name } : {};

  const response = await axios.post(endpoint, payload, { headers });
  return {
    name: response.data.name,
    url: response.data.url,
  };
}

module.exports = {
  createRoom,
};
