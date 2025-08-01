const sql = require("mssql");
const dbConfig = require("../dbConfig");

/**
 * Creates a new exercise goal for a user.
 * @param {string} userId - ID of the user account.
 * @param {string} name - Name of the goal.
 * @param {string} description - Description of the goal.
 * @returns {Promise<Object>} The created goal record.
 */
async function createGoal(userId, name, description) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      INSERT INTO goals (userId, name, description)
      OUTPUT INSERTED.*
      VALUES (@userId, @name, @description);
    `;
    const request = connection.request();
    request.input("userId", userId);
    request.input("name", name);
    request.input("description", description);
    const result = await request.query(query);
    return result.recordset[0];
  } catch (error) {
    console.error("Error creating goal:", error);
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
 * Gets all exercise goals for a user.
 * @param {string} userId - ID of the user account.
 * @returns {Promise<Object[]>} An array of goal records.
 */
async function getGoals(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      SELECT * FROM goals WHERE userId = @userId
    `;
    const request = connection.request();
    request.input("userId", userId);
    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error("Error fetching goals:", error);
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
 * Gets all exercise goals that have not been completed yet by the user.
 * @param {string} userId - ID of the user account.
 * @returns {Promise<Object[]>} An array of incomplete goal records.
 */
async function getIncompletedGoals(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      SELECT * FROM goals WHERE userId = @userId AND last_completed_at IS NULL
    `;
    const request = connection.request();
    request.input("userId", userId);
    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error("Error fetching incompleted goals:", error);
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
 * Deletes an exercise goal by its ID.
 * @param {number} goalId - ID of the goal to delete.
 * @returns {Promise<Object>} Message indicating deletion success.
 */
async function deleteGoal(goalId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      DELETE FROM goals WHERE goalId = @goalId
    `;
    const request = connection.request();
    request.input("goalId", goalId);
    await request.query(query);
    return { message: "Goal deleted successfully" };
  } catch (error) {
    console.error("Error deleting goal:", error);
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
 * Marks a exercise goal as completed by updating the last_completed_at timestamp.
 * @param {number} goalId - ID of the goal to update.
 * @param {string} userId - ID of the user account.
 * @returns {Promise<Object|null>} The updated goal record or null if not found.
 */
async function updateGoal(goalId, userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      UPDATE goals
      SET last_completed_at = CURRENT_TIMESTAMP
      OUTPUT INSERTED.*
      WHERE goalId = @goalId AND userId = @userId;
    `;
    const request = connection.request();
    request.input("goalId", goalId);
    request.input("userId", userId);

    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return null;
    }

    return result.recordset[0];
  } catch (error) {
    console.error("Error updating goal progress:", error);
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
 * Resets all exercise goals that were previously completed before today.
 * @param {string} userId - ID of the user account.
 * @returns {Promise<Object>} Message indicating reset success.
 */
async function resetGoal(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      UPDATE goals
      SET last_completed_at = NULL
      OUTPUT INSERTED.*
      WHERE 
        last_completed_at IS NOT NULL AND
        CAST(last_completed_at AS DATE) < CAST(GETDATE() AS DATE)
        AND userId = @userId;
    `;
    // DATEADD(day, -1, CAST(last_completed_at AS DATE))
    const request = connection.request();
    request.input("userId", userId);
    await request.query(query);
    return { message: "All goals reset successfully" };
  } catch (error) {
    console.error("Error resetting goals:", error);
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
 * Logs a exercise goal completion event for the user.
 * @param {number} userID - ID of the user account.
 * @param {number} goalID - ID of the goal completed.
 * @returns {Promise<boolean>} True if logging was successful.
 */
async function logGoalCompletion(userID, goalID) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      INSERT INTO goalLogs (userID, goalID, completedAt)
      VALUES (@userID, @goalID, CURRENT_TIMESTAMP);
    `;
    const request = connection.request();
    request.input("userID", userID);
    request.input("goalID", goalID);
    await request.query(query);
    return true;
  } catch (error) {
    console.error("Error logging goal completion:", error);
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
  createGoal,
  getGoals,
  deleteGoal,
  updateGoal,
  getIncompletedGoals,
  resetGoal,
  logGoalCompletion,
};
