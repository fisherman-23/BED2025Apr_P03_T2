const axios = require('axios');

// Get Google Maps configuration for frontend
async function getGoogleMapsConfig(req, res) {
    try {
    // Only return the API key for authenticated users
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

// Get directions between two points
async function getFacilityDirections(req, res) {
    try {
        const { facilityId } = req.params;
        const { origin, travelMode = 'TRANSIT' } = req.body;

        if (!origin) {
        return res.status(400).json({ error: 'Origin location is required' });
        }

        // First get the facility details to get destination coordinates
        const facilityResponse = await axios.get(
        `${req.protocol}://${req.get('host')}/facilities/id/${facilityId}`,
        {
            headers: {
            'Cookie': req.headers.cookie
            }
        }
        );

        const facility = facilityResponse.data;
        
        if (!facility || !facility.latitude || !facility.longitude) {
        return res.status(404).json({ error: 'Facility not found or coordinates missing' });
        }

        const destination = `${facility.latitude},${facility.longitude}`;

        // Call Google Directions API
        const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json`;
        const params = {
        origin,
        destination,
        mode: travelMode.toLowerCase(),
        alternatives: true,
        key: process.env.GOOGLE_MAPS_API_KEY
        };

        const response = await axios.get(directionsUrl, { params });

        if (response.data.status !== 'OK') {
        return res.status(400).json({ 
            error: 'Unable to get directions', 
            details: response.data.error_message 
        });
        }

        res.json({
        routes: response.data.routes,
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
        res.status(500).json({ error: 'Unable to get directions' });
    }
}

// Geocode an address to get coordinates
async function geocodeAddress(req, res) {
    try {
        const { address } = req.body;

        if (!address) {
        return res.status(400).json({ error: 'Address is required' });
        }

        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json`;
        const params = {
        address,
        key: process.env.GOOGLE_MAPS_API_KEY
        };

        const response = await axios.get(geocodeUrl, { params });

        if (response.data.status !== 'OK') {
        return res.status(400).json({ 
            error: 'Unable to geocode address', 
            details: response.data.error_message 
        });
        }

        const result = response.data.results[0];
        res.json({
        formatted_address: result.formatted_address,
        geometry: result.geometry,
        place_id: result.place_id
        });
    } catch (error) {
        console.error('Error geocoding address:', error);
        res.status(500).json({ error: 'Unable to geocode address' });
    }
}

module.exports = {
    getGoogleMapsConfig,
    getFacilityDirections,
    geocodeAddress,
};