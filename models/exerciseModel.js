const sql = require("mssql");
const dbConfig = require("../dbConfig");

/**
 * Retreieves the user exercise preferences
 * @param {string} userId - ID of the user account
 * @returns {Promise<number[]>} The category IDs of the user preferences
 */
async function getExercisePreferences(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const prefQuery =
      "SELECT categoryId FROM exercise_preferences WHERE userId = @userId";
    const request = connection.request();
    request.input("userId", userId);
    const prefResult = await request.query(prefQuery);
    return prefResult.recordset;
  } catch (error) {
    console.error("Error fetching preferences:", error);
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

/**
 * Updates the user's exercise preferences.
 * @param {number[]} categoryIds - An array of exercise category IDs.
 * @param {string} userId - The ID of the user account.
 * @returns {Promise<boolean>} True if update was successful.
 */
async function updateExercisePreferences(categoryIds, userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const delQuery = "DELETE FROM exercise_preferences WHERE userId = @userId";
    const deleteRequest = connection.request();
    await deleteRequest.input("userId", userId).query(delQuery);
    for (const categoryId of categoryIds) {
      const query =
        "INSERT INTO exercise_preferences (userId, categoryId) VALUES (@userId, @categoryId)";
      const request = connection.request();
      request.input("userId", userId);
      request.input("categoryId", categoryId);
      await request.query(query);
    }
    return true;
  } catch (error) {
    console.error("Error updating user preferences:", error);
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

/**
 * Deletes all the user's exercise preferences.
 * @param {string} userId - The ID of the user account.
 * @returns {Promise<boolean>} True if deletion was successful.
 */
async function deleteExercisePreference(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "DELETE FROM exercise_preferences WHERE userId = @userId";
    const request = connection.request();
    request.input("userId", userId);
    await request.query(query);
    return true;
  } catch (error) {
    console.error("Error deleting user preferences:", error);
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

/**
 * Gets exercises based on user preferences or returns all if none are set.
 * @param {string} userId - The ID of the user account.
 * @returns {Promise<Object[]>} An array of exercise data.
 */
async function getExercises(userId) {
  let connection;
  try {
    const userPreferences = await this.getExercisePreferences(userId);
    connection = await sql.connect(dbConfig);
    if (userPreferences.length > 0) {
      const categoryIds = userPreferences
        .map((row) => row.categoryId)
        .join(",");
      const result = await connection
        .request()
        .query(`SELECT * FROM exercises WHERE categoryId IN (${categoryIds})`);
      return result.recordset;
    } else {
      console.log("No preferences found for user, returning all exercises");
      const result = await connection
        .request()
        .query("SELECT * FROM exercises");
      return result.recordset;
    }
  } catch (error) {
    console.error("Error fetching exercises:", error);
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

/**
 * Gets step-by-step instructions for a specific exercise.
 * @param {number} exerciseId - The ID of the exercise.
 * @returns {Promise<Object[]>} An array of step objects with step number and instruction.
 */
async function getSteps(exerciseId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query =
      "SELECT s.stepId, s.step_number, s.instruction FROM exercise_steps s INNER JOIN exercises e ON e.exerciseId = s.exerciseId WHERE e.exerciseId = @exerciseId ORDER BY s.step_number";
    const request = connection.request();
    request.input("exerciseId", exerciseId);
    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error("Error fetching steps:", error);
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

/**
 * Create new exercise preferences for a user.
 * @param {number[]} categoryIds - The category IDs of the user preferred exercise category.
 * @param {string} userId - The ID of the user account.
 * @returns {Promise<boolean>} True if insertion was successful.
 */
async function personalisation(categoryIds, userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query =
      "INSERT INTO exercise_preferences (userId, categoryId) VALUES (@userId, @categoryId)";
    for (const categoryId of categoryIds) {
      const request = connection.request();
      request.input("userId", userId);
      request.input("categoryId", categoryId);
      await request.query(query);
    }
    return true;
  } catch (error) {
    console.error("Error saving user perferences", error);
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

/**
 * Gets completion statistics (exercises/goals) for a specific user.
 * @param {string} userId - The ID of the user account.
 * @returns {Promise<Object>} An object containing userID, exercise_completed, and goal_completed counts.
 */
async function getUserStats(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
    SELECT u.ID AS userID, ISNULL(e.exercise_completed, 0) AS exercise_completed, ISNULL(g.goal_completed, 0) AS goal_completed FROM Users u
    LEFT JOIN (
      SELECT userID, COUNT(*) AS exercise_completed
      FROM exerciseLogs
      GROUP BY userID
    ) e ON u.ID = e.userID
    LEFT JOIN (
      SELECT userID, COUNT(*) AS goal_completed
      FROM goalLogs
      GROUP BY userID
    ) g ON u.ID = g.userID
    WHERE u.ID = @userId;`;
    const request = connection.request();
    request.input("userId", userId);
    result = await request.query(query);
    return result.recordset[0];
  } catch (error) {
    console.error("Error getting user statistics", error);
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

/**
 * Logs a completed exercise for a specific user.
 * @param {number} userID - The ID of the user account.
 * @param {number} exerciseID - The ID of the completed exercise.
 * @returns {Promise<boolean>} True if logging was successful.
 */
async function logExerciseCompletion(userID, exerciseID) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      INSERT INTO exerciseLogs (userID, exerciseID, completedAt)
      VALUES (@userID, @exerciseID, CURRENT_TIMESTAMP);
    `;
    const request = connection.request();
    request.input("userID", userID);
    request.input("exerciseID", exerciseID);
    await request.query(query);
    return true;
  } catch (error) {
    console.error("Error logging exercise completion:", error);
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
  deleteExercisePreference,
  getUserStats,
  logExerciseCompletion,
};
