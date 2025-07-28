async function getWeather(lat, lon){
    const apiKey = process.env.WEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
    try{
        const response = await fetch(url);
        const data = await response.json();
        const weatherMain = data.weather[0].main.toLowerCase();
        let description = data.weather[0].description;
        const temp = data.main.temp;
        const feelsLike = data.main.feels_like;
        const location = data.name;
        let message = "";
        if (weatherMain.includes("rain") || weatherMain.includes("thunderstorm")) {
          message = "It is rainy outside. Refrain from going out and try some indoor exercises!";
          description = `${description} 🌧️🌧️`
        } 
        else if (weatherMain.includes("cloud")) {
          message = "It is a bit cloudy. Enjoy this exercise outdoors or from the comfort of your home!";
          description = `${description} ☁️☁️`
        } 
        else if (weatherMain.includes("clear")) {
          message = "Clear skies! Enjoy this exercise outdoors or from the comfort of your home!";
          description = `${description} 🌤️🌤️`
        } 
        else {
          message = "Keep an eye on the weather and stay active safely!";
        }
        const formatedData = {
            weatherMain,
            description,
            temp,
            feelsLike,
            location,
            message,
        }
        return formatedData
    } catch(error){
        console.error("Error in fetching weather API",error)
        throw error;
    }
}

module.exports={
    getWeather
};