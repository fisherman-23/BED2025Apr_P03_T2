const { getWeather } = require("../../models/weatherModel");

// Test external weather api
describe("getWeather", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.clearAllMocks();
  });

  it("should return correct message and description for rainy weather", async () => {
    const mockData = {
      weather: [{ main: "Rain", description: "light rain" }],
      main: { temp: 24, feels_like: 25 },
      name: "Singapore",
    };

    fetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockData),
    });

    const result = await getWeather(1.3521, 103.8198);

    expect(result).toEqual({
      weatherMain: "rain",
      description: "light rain 🌧️🌧️",
      temp: 24,
      feelsLike: 25,
      location: "Singapore",
      message:
        "It is rainy outside. Refrain from going out and try some indoor exercises!",
    });
  });

  it("should return correct message and description for cloudy weather", async () => {
    const mockData = {
      weather: [{ main: "Clouds", description: "overcast clouds" }],
      main: { temp: 27, feels_like: 28 },
      name: "Singapore",
    };

    fetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockData),
    });

    const result = await getWeather(1.3521, 103.8198);

    expect(result).toEqual({
      weatherMain: "clouds",
      description: "overcast clouds ☁️☁️",
      temp: 27,
      feelsLike: 28,
      location: "Singapore",
      message:
        "It is a bit cloudy. Enjoy this exercise outdoors or from the comfort of your home!",
    });
  });

  it("should return correct message and description for clear weather", async () => {
    const mockData = {
      weather: [{ main: "Clear", description: "clear sky" }],
      main: { temp: 30, feels_like: 32 },
      name: "Singapore",
    };

    fetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockData),
    });

    const result = await getWeather(1.3521, 103.8198);

    expect(result).toEqual({
      weatherMain: "clear",
      description: "clear sky 🌤️🌤️",
      temp: 30,
      feelsLike: 32,
      location: "Singapore",
      message:
        "Clear skies! Enjoy this exercise outdoors or from the comfort of your home!",
    });
  });

  it("should return generic message for unknown weather", async () => {
    const mockData = {
      weather: [{ main: "Smoke", description: "hazy" }],
      main: { temp: 29, feels_like: 30 },
      name: "Singapore",
    };

    fetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockData),
    });

    const result = await getWeather(1.3521, 103.8198);

    expect(result).toEqual({
      weatherMain: "smoke",
      description: "hazy",
      temp: 29,
      feelsLike: 30,
      location: "Singapore",
      message: "Keep an eye on the weather and stay active safely!",
    });
  });

  it("should handle error if API fails", async () => {
    fetch.mockRejectedValue(new Error("OpenWeatherMap API fetch failed"));

    await expect(getWeather(1.3521, 103.8198)).rejects.toThrow(
      "OpenWeatherMap API fetch failed"
    );
  });
});
