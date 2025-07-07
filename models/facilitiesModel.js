const sql = require("mssql");
const dbConfig = require("../dbConfig");
const jwt = require("jsonwebtoken");
const axios = require('axios');

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
        throw error;
    }
}

async function getNearbyFacilities(latitude, longitude, radius = 50000) {
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

module.exports = {
    handleLocationAccess,
    getNearbyFacilities,
    getFacilities,
    getFacilitiesByType,
};