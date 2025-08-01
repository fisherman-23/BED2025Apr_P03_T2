const weatherModel = require("../models/weatherModel");

/**
 * fetch current weather data for given latitude and longitude.
 *
 *
 * @param {Object} req - Express request object containing `lat` and `lon` in the body.
 * @param {Object} res - Express response object to send the weather data or error.
 */
async function getWeather(req, res) {
  const { lat, lon } = req.body;
  try {
    const weather = await weatherModel.getWeather(lat, lon);
    res.json(weather);
  } catch {
    res.status(500).json({ error: "Failed to fetch weather" });
  }
}
module.exports = {
  getWeather,
};
