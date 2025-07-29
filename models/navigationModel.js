const axios = require('axios');

// Get directions from Google Maps API
async function getDirections(origin, destination, travelMode = 'TRANSIT') {
    try {
        const directionsUrl = 'https://maps.googleapis.com/maps/api/directions/json';
        const params = {
            origin,
            destination,
            mode: travelMode.toLowerCase(),
            alternatives: true,
            key: process.env.GOOGLE_MAPS_API_KEY
        };

        const response = await axios.get(directionsUrl, { params });

        if (response.data.status !== 'OK') {
            throw new Error(response.data.error_message || 'Unable to get directions');
        }

        return response.data.routes;
    } catch (error) {
        console.error('Error in getDirections:', error);
        throw error;
    }
}

// Geocode an address to coordinates
async function geocodeAddress(address) {
    try {
        const geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
        const params = {
            address,
            key: process.env.GOOGLE_MAPS_API_KEY
        };

        const response = await axios.get(geocodeUrl, { params });

        if (response.data.status !== 'OK') {
            throw new Error(response.data.error_message || 'Unable to geocode address');
        }

        const result = response.data.results[0];
        return {
            formatted_address: result.formatted_address,
            geometry: result.geometry,
            place_id: result.place_id
        };
    } catch (error) {
        console.error('Error in geocodeAddress:', error);
        throw error;
    }
}

// Format coordinates for Google Maps API
function formatCoordinates(latitude, longitude) {
    return `${latitude},${longitude}`;
}

module.exports = {
    getDirections,
    geocodeAddress,
    formatCoordinates,
}
