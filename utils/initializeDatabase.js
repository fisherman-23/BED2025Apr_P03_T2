const { checkFacilitiesExist } = require('../models/facilitiesModel');
const { populateAllFacilities } = require('./populateFacilities');

/**
 * Initializes the database by checking if facilities exist and populating if needed.
 * This function should be called during application startup.
 *
 * @function initializeDatabase
 * @returns {Promise<void>}
 */
async function initializeDatabase() {
    try {
        console.log("Checking database initialization...");
        
        const facilitiesExist = await checkFacilitiesExist();
        
        if (!facilitiesExist) {
            console.log("No facilities found in database. Starting auto-population...");
            await populateAllFacilities();
            console.log("Facilities auto-population completed successfully.");
        } else {
            console.log("Facilities already exist in database. Skipping auto-population.");
        }
    } catch (error) {
        console.error("Error during database initialization:", error);
        // Don't throw the error to prevent app startup failure
        console.log("Continuing without auto-population. Facilities can be populated manually if needed.");
    }
}

module.exports = {
    initializeDatabase
};
