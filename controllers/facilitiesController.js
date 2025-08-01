const facilitiesModel = require("../models/facilitiesModel.js");

/**
 * Manually triggers facility population from Google Places API.
 * Should only be used for development or maintenance purposes.
 *
 * @async
 * @function populateFacilities
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 OK with success message if facilities populated or 500 on error.
 */
async function populateFacilities(req, res) {
    try {
        console.log("Manual facility population triggered...");
        const { populateAllFacilities } = require("../utils/populateFacilities.js");
        await populateAllFacilities();
        
        res.status(200).json({ 
            message: "Facilities populated successfully",
        });
    } catch (error) {
        console.error("Error in manual facility population:", error);
        res.status(500).json({ 
            error: "Error populating facilities",
            details: error.message 
        });
    }
}
/**
 * Handles location access for the user and returns location data.
 *
 * @async
 * @function handleLocationAccess
 * @param {Object} req - Express request object, requires `req.query.lat` and `req.query.lng`.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 OK with location data or 500 on error.
 */
async function handleLocationAccess(req, res) {
    try {
        const { lat, lng } = req.query;
        const locationData = await facilitiesModel.handleLocationAccess(lat, lng);
        res.status(200).json(locationData);
    } catch (error) {
        console.error("Error in handleLocationAccess:", error);
        res.status(500).json({ error: "Error fetching location data" });
    }
}
/**
 * Retrieves nearby facilities based on user's location.
 *
 * @async
 * @function getNearbyFacilities
 * @param {Object} req - Express request object, requires `req.query.lat`, `req.query.lng`, and `req.query.rad`.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 OK with nearby facilities or 500 on error.
 */
async function getNearbyFacilities(req, res) {
    try {
        const  {lat, lng, rad } = req.query;
        const facilities = await facilitiesModel.getNearbyFacilities(lat, lng, rad);
        res.status(200).json(facilities);
    } catch (error) {
        console.error("Error in getNearbyFacilities:", error);
        res.status(500).json({ error: "Error fetching nearby facilities" });
    }
}
/**
 * Retrieves all facilities.
 *
 * @async
 * @function getFacilities
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 OK with facilities or 500 on error.
 */
async function getFacilities(req, res) {
    try {
        const facilities = await facilitiesModel.getFacilities();
        res.status(200).json(facilities);
    } catch (error){
        console.error("Error in getFacilities:", error);
        res.status(500).json({ error: "Error fetching facilities" });
    }
}
/**
 * Retrieves a facility by its ID.
 *
 * @async
 * @function getFacilityById
 * @param {Object} req - Express request object, requires `req.params.id`.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 OK with facility data or 404 if not found, 500 on error.
 */
async function getFacilityById(req, res) {
    try {
        const facility = await facilitiesModel.getFacilityById(req.params.id);
        if (!facility) {
            return res.status(404).json({ error: "Facility not found" });
        }
        res.status(200).json(facility);
    } catch (error) {
        console.error("Error in getFacilityById:", error);
        res.status(500).json({ error: "Error fetching facility by ID" });
    }
}
/**
 * Retrieves facilities by their type.
 *
 * @async
 * @function getFacilitiesByType
 * @param {Object} req - Express request object, requires `req.params.type`.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 OK with facilities or 500 on error.
 */
async function getFacilitiesByType(req, res) {
    try {
        const facilityType = req.params.type;
        const facilities = await facilitiesModel.getFacilitiesByType(facilityType);
        res.status(200).json(facilities);
    } catch (error) {
        console.error("Error in getFacilitiesByType:", error);
        res.status(500).json({ error: "Error fetching facilities by type" });
    }
}

module.exports = {
    handleLocationAccess,
    getNearbyFacilities,
    getFacilities,
    getFacilityById,
    getFacilitiesByType,
    populateFacilities,
};