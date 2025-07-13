const facilitiesModel = require("../models/facilitiesModel.js");

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
};