const weatherModel = require("../models/weatherModel")

async function getWeather(req, res){
    const { lat, lon } = req.body;
    try{
        const weather = await weatherModel.getWeather(lat, lon);
        res.json(weather);
    }catch{
        res.status(500).json({ error: 'Failed to fetch weather' });
    }
}
module.exports ={
    getWeather
}