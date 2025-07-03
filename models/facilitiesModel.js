const sql = require("mssql");
const dbConfig = require("../dbConfig");

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
    getFacilities,
    getFacilitiesByType
};