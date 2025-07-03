const sql = require('mssql');
const dbConfig = require('../dbConfig');

async function getExercises(){
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const result = await connection.request().query('SELECT * FROM exercises');
        return result.recordset;
    } catch (error) {
        console.error('Error fetching exercises:', error);
        throw error;
    } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

async function getSteps(exerciseId) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = 'SELECT s.stepId, s.step_number, s.instruction FROM exercise_steps s INNER JOIN exercises e ON e.exerciseId = s.exerciseId WHERE e.exerciseId = @exerciseId ORDER BY s.step_number';
        const request = connection.request();
        request.input("exerciseId", exerciseId);
        const result = await request.query(query);
        return result.recordset;
    } catch (error) {
        console.error('Error fetching steps:', error);
        throw error;
    } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

module.exports = {
    getExercises,
    getSteps
};