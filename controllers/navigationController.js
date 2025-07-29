const NavigationModel = require('../models/navigationModel');
/**
 * Retrieves Google Maps configuration for frontend.
 *
 * @async
 * @function getGoogleMapsConfig
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 OK with Google Maps config or 500 on error.
 */
async function getGoogleMapsConfig(req, res) {
    try {
        const config = {
            apiKey: process.env.GOOGLE_MAPS_API_KEY,
            libraries: ['places'],
            loading: 'async'
        };
        
        res.json(config);
    } catch (error) {
        console.error('Error getting Google Maps config:', error);
        res.status(500).json({ error: 'Unable to get map configuration' });
    }
}
/**
 * Retrieves directions to a facility.
 *
 * @async
 * @function getFacilityDirections
 * @param {Object} req - Express request object, requires `req.params.id` and `req.body.origin`.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 OK with directions or 500 on error.
 */
async function getFacilityDirections(req, res) {
    try {
        const { facilityId } = req.params;
        const { origin, travelMode = 'TRANSIT' } = req.body;

        if (!origin) {
            return res.status(400).json({ error: 'Origin location is required' });
        }

        const facility = await NavigationModel.getFacilityDetails(facilityId, req);
        
        const destination = NavigationModel.formatCoordinates(facility.latitude, facility.longitude);

        const routes = await NavigationModel.getDirections(origin, destination, travelMode);

        res.json({
            routes,
            facility: {
                name: facility.name,
                address: facility.address,
                coordinates: {
                    lat: facility.latitude,
                    lng: facility.longitude
                }
            }
        });
    } catch (error) {
        console.error('Error getting facility directions:', error);
        
        if (error.message.includes('Facility not found')) {
            return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('Unable to get directions')) {
            return res.status(400).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'Unable to get directions' });
    }
}
/**
 * Geocodes an address to get coordinates.
 *
 * @async
 * @function geocodeAddress
 * @param {Object} req - Express request object, requires `req.body.address`.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 OK with geocoded address or 500 on error.
 */
async function geocodeAddress(req, res) {
    try {
        const { address } = req.body;

        if (!address) {
            return res.status(400).json({ error: 'Address is required' });
        }

        const result = await NavigationModel.geocodeAddress(address);
        
        res.json(result);
    } catch (error) {
        console.error('Error geocoding address:', error);
        
        if (error.message.includes('Unable to geocode')) {
            return res.status(400).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'Unable to geocode address' });
    }
}

module.exports = {
    getGoogleMapsConfig,
    getFacilityDirections,
    geocodeAddress,
};