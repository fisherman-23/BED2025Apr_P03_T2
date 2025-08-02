/**
 * OneMap API Service for Singapore location services
 * Provides location search and routing functionality
 */
class OneMapService {
    constructor() {
        this.baseURL = 'https://www.onemap.gov.sg/api';
        this.routingURL = 'https://www.onemap.gov.sg/api/public/routingsvc';
        this.token = process.env.ONEMAP_API_TOKEN;
    }

    /**
     * Search for location coordinates using OneMap API
     * @param {string} address - Address to search for
     * @returns {Promise<Object>} Location data with coordinates
     */
    async searchLocation(address) {
        try {
            const searchQuery = encodeURIComponent(address);
            const url = `${this.baseURL}/common/elastic/search?searchVal=${searchQuery}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;
            
            console.log('🗺️ OneMap search URL:', url);
            
            const response = await fetch(url);
            const data = await response.json();
            
            console.log('🗺️ OneMap search response:', data);
            
            if (data.found > 0 && data.results && data.results.length > 0) {
                const result = data.results[0];
                return {
                    success: true,
                    location: {
                        latitude: parseFloat(result.LATITUDE),
                        longitude: parseFloat(result.LONGITUDE),
                        address: result.ADDRESS,
                        postal: result.POSTAL || '',
                        building: result.BUILDING || '',
                        road: result.ROAD_NAME || ''
                    }
                };
            } else {
                return { 
                    success: false, 
                    error: 'Location not found in Singapore',
                    details: data 
                };
            }
        } catch (error) {
            console.error('OneMap search error:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to search location'
            };
        }
    }

    /**
     * Get directions between two points using OneMap routing API
     * @param {Object} start - Start coordinates {latitude, longitude}
     * @param {Object} end - End coordinates {latitude, longitude}
     * @param {string} routeType - Route type: 'drive', 'walk', 'pt' (public transport)
     * @returns {Promise<Object>} Route information
     */
    async getDirections(start, end, routeType = 'drive') {
        try {
            // Validate Singapore coordinates first
            if (!this.isValidSingaporeCoordinates(start.latitude, start.longitude)) {
                console.warn('⚠️ Start coordinates outside Singapore bounds:', start);
                // Use fallback Singapore location (Marina Bay)
                start = { latitude: 1.2838, longitude: 103.8606 };
            }
            
            if (!this.isValidSingaporeCoordinates(end.latitude, end.longitude)) {
                return {
                    success: false,
                    error: 'Destination coordinates are outside Singapore bounds'
                };
            }
            
            // Format coordinates for OneMap (rounded to 6 decimal places)
            const startCoords = `${start.latitude.toFixed(6)},${start.longitude.toFixed(6)}`;
            const endCoords = `${end.latitude.toFixed(6)},${end.longitude.toFixed(6)}`;
            
            // Try different route types if one fails
            const routeTypes = [routeType, 'walk', 'drive'];
            
            for (const currentRouteType of routeTypes) {
                const url = `${this.routingURL}/route?start=${startCoords}&end=${endCoords}&routeType=${currentRouteType}`;
                
                console.log(`🗺️ OneMap routing URL (${currentRouteType}):`, url);
                
                const response = await fetch(url);
                const data = await response.json();
                
                console.log(`🗺️ OneMap routing response (${currentRouteType}):`, data);
                
                if (data.status_message === 'Found route between points') {
                    return {
                        success: true,
                        route: {
                            distance: `${(data.route_summary.total_distance / 1000).toFixed(2)} km`,
                            duration: this.formatDuration(data.route_summary.total_time),
                            steps: this.parseRouteInstructions(data.route_instructions || []),
                            routeType: currentRouteType,
                            geometry: data.route_geometry || null,
                            summary: {
                                totalDistance: data.route_summary.total_distance,
                                totalTime: data.route_summary.total_time
                            }
                        }
                    };
                } else if (currentRouteType === routeType) {
                    // Log the error for the requested route type
                    console.warn(`❌ ${currentRouteType} routing failed:`, data.status_message);
                }
            }
            
            // If all route types fail, provide a fallback response
            const distance = this.calculateDistance(start.latitude, start.longitude, end.latitude, end.longitude);
            const estimatedTime = Math.max(Math.round(distance * 3), 5); // Rough estimate: 3 minutes per km
            
            return {
                success: true,
                route: {
                    distance: `${distance.toFixed(2)} km`,
                    duration: `${estimatedTime}m`,
                    steps: [
                        'Head towards your destination',
                        'Follow main roads and traffic signals',
                        'You have arrived at your destination'
                    ],
                    routeType: 'estimated',
                    fallback: true,
                    summary: {
                        totalDistance: distance * 1000,
                        totalTime: estimatedTime * 60
                    }
                }
            };
            
        } catch (error) {
            console.error('OneMap routing error:', error);
            
            // Fallback calculation
            const distance = this.calculateDistance(start.latitude, start.longitude, end.latitude, end.longitude);
            const estimatedTime = Math.max(Math.round(distance * 3), 5);
            
            return {
                success: true,
                route: {
                    distance: `${distance.toFixed(2)} km`,
                    duration: `${estimatedTime}m`,
                    steps: ['Route calculation unavailable - showing estimated distance'],
                    routeType: 'fallback',
                    fallback: true
                }
            };
        }
    }

    /**
     * Get walking directions (convenience method)
     * @param {Object} start - Start coordinates
     * @param {Object} end - End coordinates
     * @returns {Promise<Object>} Walking route information
     */
    async getWalkingDirections(start, end) {
        return this.getDirections(start, end, 'walk');
    }

    /**
     * Get public transport directions (convenience method)
     * @param {Object} start - Start coordinates
     * @param {Object} end - End coordinates
     * @returns {Promise<Object>} Public transport route information
     */
    async getPublicTransportDirections(start, end) {
        return this.getDirections(start, end, 'pt');
    }

    /**
     * Parse route instructions into readable format
     * @param {Array} instructions - Raw route instructions from OneMap
     * @returns {Array} Formatted instructions
     */
    parseRouteInstructions(instructions) {
        return instructions.map((instruction, index) => {
            const text = instruction[0] || `Step ${index + 1}`;
            const distance = instruction[1] ? `${instruction[1]}m` : '';
            return distance ? `${text} (${distance})` : text;
        });
    }

    /**
     * Format duration from seconds to readable format
     * @param {number} seconds - Duration in seconds
     * @returns {string} Formatted duration
     */
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    /**
     * Validate Singapore coordinates
     * @param {number} latitude - Latitude
     * @param {number} longitude - Longitude
     * @returns {boolean} True if coordinates are within Singapore bounds
     */
    isValidSingaporeCoordinates(latitude, longitude) {
        // Singapore approximate bounds
        const minLat = 1.16;
        const maxLat = 1.48;
        const minLng = 103.6;
        const maxLng = 104.1;
        
        return latitude >= minLat && latitude <= maxLat && 
               longitude >= minLng && longitude <= maxLng;
    }

    /**
     * Get nearby points of interest
     * @param {number} latitude - Latitude
     * @param {number} longitude - Longitude
     * @param {string} theme - Theme filter (e.g., 'hdb', 'healthcare', 'education')
     * @returns {Promise<Object>} Nearby POIs
     */
    async getNearbyPOI(latitude, longitude, theme = 'healthcare') {
        try {
            const url = `${this.baseURL}/public/themesvc/${theme}?returnGeom=Y`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.SrchResults && data.SrchResults.length > 0) {
                // Filter by proximity (within ~2km)
                const nearby = data.SrchResults.filter(poi => {
                    if (poi.LatLng) {
                        const coords = poi.LatLng.split(',');
                        const poiLat = parseFloat(coords[0]);
                        const poiLng = parseFloat(coords[1]);
                        
                        const distance = this.calculateDistance(latitude, longitude, poiLat, poiLng);
                        return distance <= 2; // Within 2km
                    }
                    return false;
                });
                
                return {
                    success: true,
                    pois: nearby.map(poi => ({
                        name: poi.NAME,
                        description: poi.DESCRIPTION,
                        coordinates: poi.LatLng,
                        address: poi.ADDRESSBLOCKHOUSENUMBER + ' ' + poi.ADDRESSSTREETNAME
                    }))
                };
            }
            
            return { success: true, pois: [] };
            
        } catch (error) {
            console.error('OneMap POI error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     * @param {number} lat1 - First latitude
     * @param {number} lon1 - First longitude  
     * @param {number} lat2 - Second latitude
     * @param {number} lon2 - Second longitude
     * @returns {number} Distance in kilometers
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of Earth in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
}

module.exports = new OneMapService();