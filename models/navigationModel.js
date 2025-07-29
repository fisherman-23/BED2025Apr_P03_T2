const axios = require('axios');
/**
 * Retrieves directions from Google Maps API.
 *
 * @function getDirections
 * @param {string} origin - The starting point for directions.
 * @param {string} destination - The endpoint for directions.
 * @param {string} travelMode - The mode of travel ('DRIVING', 'TRANSIT', 'WALKING').
 * @returns {Array} - An array of route objects.
 * @throws Will throw if the API request fails.
 */
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
/**
 * Geocodes an address to coordinates.
 *
 * @function geocodeAddress
 * @param {string} address - The address to geocode.
 * @returns {Object} - The geocoded location data.
 * @throws Will throw if the API request fails.
 */
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
/**
 * Formats latitude and longitude coordinates for Google Maps API.
 * 
 * @param {*} latitude - The latitude coordinate.
 * @param {*} longitude - The longitude coordinate.
 * @returns {string} - The formatted coordinates string.
 */
function formatCoordinates(latitude, longitude) {
    return `${latitude},${longitude}`;
}

module.exports = {
    getDirections,
    geocodeAddress,
    formatCoordinates,
}
