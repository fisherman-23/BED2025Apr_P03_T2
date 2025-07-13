const sql = require('mssql');
const dbConfig = require('../dbConfig');

// Create a new goal
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
    request.input('userId', userId);
    request.input('name', name);
    request.input('description', description);
    const result = await request.query(query);
    return result.recordset[0];
  } catch (error) {
    console.error('Error creating goal:', error);
    throw error;
  } finally {
    if (connection) {
        try {
            await connection.close();
        } catch (err) {
            console.error("Error closing connection:", err);
        }
    }
}};

// Get all goals for a user
async function getGoals(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      SELECT * FROM goals WHERE userId = @userId
    `;
    const request = connection.request();
    request.input('userId', userId);
    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error('Error fetching goals:', error);
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

// Get incompleted goals
async function getIncompletedGoals(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      SELECT * FROM goals WHERE userId = @userId AND last_completed_at IS NULL
    `;
    const request = connection.request();
    request.input('userId', userId);
    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error('Error fetching incompleted goals:', error);
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

// Delete a goal
async function deleteGoal(goalId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      DELETE FROM goals WHERE goalId = @goalId
    `;
    const request = connection.request();
    request.input('goalId', goalId);
    await request.query(query);
    return { message: 'Goal deleted successfully' };
  } catch (error) {
    console.error('Error deleting goal:', error);
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

// Update goals
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
    request.input('goalId', goalId);
    request.input('userId', userId);
 
    const result = await request.query(query);
 
    if (result.recordset.length === 0) {
      return null;
    }
 
    return result.recordset[0];
  } catch (error) {
    console.error('Error updating goal progress:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}

// Reset all goals
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
    request.input('userId', userId);
    await request.query(query);
    return { message: 'All goals reset successfully' };
  }catch (error) {
    console.error('Error resetting goals:', error);
    throw error;
  }finally{
    if (connection) {
    try {
      await connection.close();
    } catch (err) {
      console.error("Error closing connection:", err);
    }
  }
}}

 
module.exports = {
  createGoal,
  getGoals,
  deleteGoal,
  updateGoal,
  getIncompletedGoals,
  resetGoal
};