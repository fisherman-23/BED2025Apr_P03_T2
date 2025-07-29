const weatherController = require("../../controllers/weatherController");
const weatherModel = require("../../models/weatherModel");

jest.mock("../../models/weatherModel");

// Test weather controller getting weather
describe("weatherController.getWeather", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return weather data", async () => {
    const mockWeatherData = {
      weatherMain: "clear",
      description: "clear sky 🌤️🌤️",
      temp: 30,
      feelsLike: 32,
      location: "Singapore",
      message:
        "Clear skies! Enjoy this exercise outdoors or from the comfort of your home!",
    };

    weatherModel.getWeather.mockResolvedValue(mockWeatherData);

    const req = {
      body: {
        lat: 1.3521,
        lon: 103.8198,
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await weatherController.getWeather(req, res);

    expect(weatherModel.getWeather).toHaveBeenCalledWith(1.3521, 103.8198);
    expect(res.json).toHaveBeenCalledWith(mockWeatherData);
  });

  it("should handle errors and return 500", async () => {
    const req = {
      body: {
        lat: 1.3521,
        lon: 103.8198,
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    weatherModel.getWeather.mockRejectedValue(
      new Error("Failed to fetch weather")
    );

    await weatherController.getWeather(req, res);

    expect(weatherModel.getWeather).toHaveBeenCalledWith(1.3521, 103.8198);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Failed to fetch weather" });
  });
});
