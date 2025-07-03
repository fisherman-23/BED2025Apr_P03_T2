const facilitiesModel = require("../models/facilitiesModel.js");

async function getFacilities(req, res) {
    try {
        const facilities = await facilitiesModel.getFacilities();
        res.status(200).json(facilities);
    } catch (error){
        console.error("Error in getFacilities:", error);
        res.status(500).json({ error: "Error fetching facilities" });
    }
}

async function getFacilitiesByType(req, res) {
    const facilityType = req.params.type;
    try {
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
    getFacilities,
    getFacilitiesByType
};