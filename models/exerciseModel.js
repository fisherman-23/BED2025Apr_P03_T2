const sql = require('mssql');
const dbConfig = require('../dbConfig');


async function getExercisePreferences(userId) {
    let connection;
    try {
            connection = await sql.connect(dbConfig);
            const prefQuery = 'SELECT categoryId FROM exercise_preferences WHERE userId = @userId';
            const request = connection.request();
            request.input("userId", userId);
            const prefResult = await request.query(prefQuery);
            return prefResult.recordset;
    } catch (error) {
        console.error('Error fetching preferences:', error);
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

async function updateExercisePreferences(categoryIds, userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const delQuery = 'DELETE FROM exercise_preferences WHERE userId = @userId';
    const deleteRequest = connection.request();
    await deleteRequest.input("userId", userId).query(delQuery);
    for (const categoryId of categoryIds) {
      const query = 'INSERT INTO exercise_preferences (userId, categoryId) VALUES (@userId, @categoryId)';
      const request = connection.request();
      request.input("userId", userId);
      request.input("categoryId", categoryId);
      await request.query(query);
    }
    return true;
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

async function deleteExercisePreference(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = 'DELETE FROM exercise_preferences WHERE userId = @userId';
    const request = connection.request();
    request.input("userId", userId);
    await request.query(query);
    return true;
  } catch (error) {
    console.error('Error deleting user preferences:', error);
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

async function getExercises(userId){
    let connection;
    try {
        const userPreferences = await getExercisePreferences(userId);
        connection = await sql.connect(dbConfig);
        if(userPreferences.length > 0) {
            const categoryIds = userPreferences.map(row => row.categoryId).join(',');
            const result = await connection.request().query(`SELECT * FROM exercises WHERE categoryId IN (${categoryIds})`);
            return result.recordset;
        }else{
            console.log("No preferences found for user, returning all exercises");
            const result = await connection.request().query('SELECT * FROM exercises');
            return result.recordset;
        }
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

async function personalisation(categoryIds, userId) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = 'INSERT INTO exercise_preferences (userId, categoryId) VALUES (@userId, @categoryId)';
        for (const categoryId of categoryIds) {
          const request = connection.request();
          request.input("userId", userId);
          request.input("categoryId", categoryId);
          await request.query(query);
        }
        return true;
    } catch (error) {
        console.error('Error saving user perferences', error);
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
    getSteps,
    personalisation,
    getExercisePreferences,
    updateExercisePreferences,
    deleteExercisePreference
};