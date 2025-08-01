const sql = require("mssql");
const dbConfig = require("../dbConfig");
const jwt = require("jsonwebtoken");
const axios = require('axios');
/**
 * Handles location access for a given latitude and longitude.
 *
 * @function handleLocationAccess
 * @param {number} latitude - The latitude of the location.
 * @param {number} longitude - The longitude of the location.
 * @returns {Object} - The address information for the location.
 * @throws Will throw if the geocoding request fails.
 */
async function handleLocationAccess(latitude, longitude) {
    try {
        console.log("Handling location access for coordinates:", latitude, longitude);
        const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
            params: {
                latlng: `${latitude},${longitude}`,
                key: process.env.GOOGLE_MAPS_API_KEY
            }
        });
        console.log("Geocoding response:", response.data);
        if (response.data.status === "OK") {
            return {
                status: "OK",
                address: response.data.results[0].formatted_address,
            };
        } else {
            console.error("Geocoding failed:", response.data.status);
            return {
                status: "ERROR",
                message: "Unable to retrieve address for the provided coordinates."
            };
        }
    } catch (error) {
        console.error("Error in handleLocationAccess:", error);
        throw new Error("Failed to access location data.");
    }
}
/**
 * Retrieves nearby facilities based on the user's location.
 *
 * @function getNearbyFacilities
 * @param {number} latitude - The latitude of the user's location.
 * @param {number} longitude - The longitude of the user's location.
 * @param {number} radius - The search radius in meters (default is 2000).
 * @returns {Array} - An array of nearby facilities.
 * @throws Will throw if the database query fails.
 */
async function getNearbyFacilities(latitude, longitude, radius = 2000) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            SELECT * FROM Facilities
            WHERE
                latitude BETWEEN @minLat AND @maxLat AND
                longitude BETWEEN @minLng AND @maxLng
        `;
        const request = connection.request();
        request.input("minLat", sql.Float, latitude - radius / 111320);
        request.input("maxLat", sql.Float, latitude + radius / 111320);
        request.input("minLng", sql.Float, longitude - radius / (111320 * Math.cos(latitude * Math.PI / 180)));
        request.input("maxLng", sql.Float, longitude + radius / (111320 * Math.cos(latitude * Math.PI / 180)));
        const result = await request.query(query);
        return result.recordset;
    } catch (error) {
        console.error("Error fetching nearby facilities:", error);
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error("Error closing database connection:", err);
            }
        }
    }
}
/**
 * Retrieves all facilities from the database.
 *
 * @function getFacilities
 * @returns {Array} - An array of all facilities.
 * @throws Will throw if the database query fails.
 */
async function getFacilities() {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const result = await connection.request()
        .query("SELECT * FROM Facilities");
        return result.recordset;
    } catch (error) {
        console.error("Error fetching facilities:", error);
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error("Error closing database connection:", err);
            }
        }
    }
}
/**
 * Retrieves a facility by its ID.
 *
 * @function getFacilityById
 * @param {number} facilityId - The ID of the facility to retrieve.
 * @returns {Object} - The facility object.
 * @throws Will throw if the database query fails.
 */
async function getFacilityById(facilityId) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `SELECT * FROM Facilities WHERE FacilityId = @facilityId`;
        const request = connection.request();
        request.input("facilityId", sql.Int, facilityId);
        const result = await request.query(query);
        if (result.recordset.length === 0) {
            throw new Error("Facility not found");
        }
        return result.recordset[0];
    } catch (error) {
        console.error("Error fetching facility by ID:", error);
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error("Error closing database connection:", err);
            }
        }
    }
}
/**
 * Retrieves facilities by their type.
 *
 * @function getFacilitiesByType
 * @param {string} facilityType - The type of facilities to retrieve.
 * @returns {Array} - An array of facilities matching the specified type.
 * @throws Will throw if the database query fails.
 */
async function getFacilitiesByType(facilityType) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `SELECT * FROM Facilities WHERE facilityType = @facilityType`;
        const request = connection.request();
        request.input("facilityType", sql.VarChar, facilityType);
        const result = await request.query(query);
        return result.recordset;
    } catch (error) {
        console.error("Error fetching facilities by type:", error);
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error("Error closing database connection:", err);
            }
        }
    }
}
/**
 * Saves a new facility to the database.
 *
 * @function saveFacility
 * @param {Object} facilityData - The data for the facility to save.
 * @returns {Object} - The saved facility object.
 * @throws Will throw if the database query fails.
 */
async function saveFacility(facilityData) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        
        // Check if facility already exists by google_place_id to avoid duplicates
        const checkQuery = `SELECT FacilityId FROM Facilities WHERE google_place_id = @google_place_id`;
        const checkRequest = connection.request();
        checkRequest.input("google_place_id", sql.VarChar, facilityData.google_place_id);
        const existingResult = await checkRequest.query(checkQuery);
        
        if (existingResult.recordset.length > 0) {
            console.log(`Facility ${facilityData.name} already exists, skipping...`);
            return existingResult.recordset[0];
        }
        
        // Insert new facility
        const insertQuery = `
            INSERT INTO Facilities (
                name, address, latitude, longitude, facilityType, 
                phoneNo, hours, image_url, static_map_url, google_place_id
            ) 
            OUTPUT INSERTED.FacilityId
            VALUES (
                @name, @address, @latitude, @longitude, @facilityType,
                @phoneNo, @hours, @image_url, @static_map_url, @google_place_id
            )
        `;
        
        const insertRequest = connection.request();
        insertRequest.input("name", sql.VarChar, facilityData.name);
        insertRequest.input("address", sql.VarChar, facilityData.address);
        insertRequest.input("latitude", sql.Float, facilityData.latitude);
        insertRequest.input("longitude", sql.Float, facilityData.longitude);
        insertRequest.input("facilityType", sql.VarChar, facilityData.facilityType);
        insertRequest.input("phoneNo", sql.VarChar, facilityData.phoneNo);
        insertRequest.input("hours", sql.VarChar, facilityData.hours);
        insertRequest.input("image_url", sql.VarChar, facilityData.image_url);
        insertRequest.input("static_map_url", sql.VarChar, facilityData.static_map_url);
        insertRequest.input("google_place_id", sql.VarChar, facilityData.google_place_id);
        
        const result = await insertRequest.query(insertQuery);
        return result.recordset[0];
        
    } catch (error) {
        console.error("Error saving facility:", error);
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error("Error closing database connection:", err);
            }
        }
    }
}

/**
 * Checks if any facilities exist in the database.
 *
 * @function checkFacilitiesExist
 * @returns {boolean} - True if facilities exist, false otherwise.
 * @throws Will throw if the database query fails.
 */
async function checkFacilitiesExist() {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const result = await connection.request()
            .query("SELECT COUNT(*) as count FROM Facilities");
        return result.recordset[0].count > 0;
    } catch (error) {
        console.error("Error checking if facilities exist:", error);
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error("Error closing database connection:", err);
            }
        }
    }
}

module.exports = {
    handleLocationAccess,
    getNearbyFacilities,
    getFacilities,
    getFacilityById,
    getFacilitiesByType,
    saveFacility,
    checkFacilitiesExist,
};