const facilitiesModel = require("../models/facilitiesModel.js");

async function handleLocationAccess(req, res) {
    try {
        const { lat, lng } = req.query;
        const loctionData = await facilitiesModel.handleLocationAccess(lat, lng);
        if (!loctionData) {
            return res.status(404).json({ error: "Location not found" });
        }
        res.status(200).json(loctionData);
    } catch (error) {
        console.error("Error in handleLocationAccess:", error);
        res.status(500).json({ error: "Error fetching location data" });
    }
}

async function getNearbyFacilities(req, res) {
    try {
        const  {lat, lng, rad } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ error: "Latitude and longitude are required" });
        }
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng); // default longitude to Singapore's longitude
        const radius = 50000;

        if (isNaN(latitude) || isNaN(longitude) || isNaN(radius)) {
            return res.status(400).json({ error: "Invalid latitude, longitude or radius" });
        }

        const facilities = await facilitiesModel.getNearbyFacilities(lat, lng, rad);
        res.status(200).json(facilities);
    } catch (error) {
        console.error("Error in getNearbyFacilities:", error);
        res.status(500).json({ error: "Error fetching nearby facilities" });
    }
}

async function getFacilities(req, res) {
    try {
        const facilities = await facilitiesModel.getFacilities();
        res.status(200).json(facilities);
    } catch (error){
        console.error("Error in getFacilities:", error);
        res.status(500).json({ error: "Error fetching facilities" });
    }
}

async function getFacilityById(req, res) {
    try {
        const facilityId = parseInt(req.params.id, 10);
        if (isNaN(facilityId)) {
            return res.status(400).json({ error: "Invalid facility ID" });
        }
        const facility = await facilitiesModel.getFacilityById(facilityId);
        if (!facility) {
            return res.status(404).json({ error: "Facility not found" });
        }
        res.status(200).json(facility);
    } catch (error) {
        console.error("Error in getFacilityById:", error);
        res.status(500).json({ error: "Error fetching facility by ID" });
    }
}

async function getFacilitiesByType(req, res) {
    try {
        const facilityType = req.params.type;
        const facilities = await facilitiesModel.getFacilitiesByType(facilityType);
        if (facilities.length === 0) {
            return res.status(404).json({ error: "No facilities found for this type" });
        }
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
};