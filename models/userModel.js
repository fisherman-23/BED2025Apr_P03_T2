const sql = require("mssql");
const dbConfig = require("../dbConfig");
const { hash, compare } = require("../utils/hash.js");

async function searchUser(searchTerm) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    const query = `
    SELECT *
    FROM Users
    WHERE phoneNumber LIKE '%' + @searchTerm + '%'
        OR email LIKE '%' + @searchTerm + '%'  
    `;

    const request = connection.request();
    request.input("searchTerm", sql.Char, searchTerm);
    const result = await request.query(query);
    return result.recordset[0];
  } catch (error) {
    console.error("Database error in searchUser:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection after searchUser:", err);
      }
    }
  }
}

async function getUserById(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "SELECT id, email, name, aboutMe, phoneNumber, dateOfBirth, profilePicture, createdAt, updatedAt, isActive FROM Users WHERE id = @id";
    const request = connection.request();
    request.input("id", id);
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return null;
    }

    return result.recordset[0];
  } catch (e) {
    console.error("Database error:", e)
    throw e;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error("Error closing connection:", e);
      }
    }
  }
}
    

async function createUser(userData) {
  let connection;
  try {
    connection = await sql.connect(dbConfig)
  const query = `
    INSERT INTO Users 
      (email, password, name, aboutMe, phoneNumber, dateOfBirth, profilePicture, isActive)
    VALUES 
      (@email, @password, @name, @aboutMe, @phoneNumber, @dateOfBirth, @profilePicture, @isActive);
    SELECT SCOPE_IDENTITY() AS id;
  `;

  const request = connection.request();
  const passwordHash = await hash(userData.password);
  request.input("email", userData.email);
  request.input("password", passwordHash);
  request.input("name", userData.name);
  request.input("aboutMe", null);
  request.input("phoneNumber", userData.phoneNumber);
  request.input("dateOfBirth", userData.dateOfBirth); //format: YYYY-MM-DD
  request.input("profilePicture", userData.profilePicture || null);
  request.input("isActive", 1);

    const result = await request.query(query);
    const newUserId = result.recordset[0].id;
    return await getUserById(newUserId);
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error("Error closing connection", e);
      } 
    }
  }
}


async function updateUser(id, userData) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();

    let sqlQuery = ``;
    if (userData.password && userData.newPassword) {
      sqlQuery = `
        UPDATE Users
        SET
          email = @email,
          password = @password,
          name = @name,
          aboutMe = @aboutMe,
          phoneNumber = @phoneNumber,
          updatedAt = GETDATE()
        WHERE id = @id
      `;

      const passwordQuery = `SELECT password FROM Users WHERE id = @id`
      const passwordRequest = connection.request();
      passwordRequest.input("id", id);
      const passwordResult = await passwordRequest.query(passwordQuery);
      if (!passwordResult.recordset[0]) {
        console.log("User not found for update");
        return null;
      }
      const currentPassword = passwordResult.recordset[0].password;
      if (!await compare(userData.password, currentPassword)) {
        console.log("Password does not match current password");
        return null;
      }

      request.input("password", await hash(userData.newPassword));
    } else {
      sqlQuery = `
        UPDATE Users
        SET
          email = @email,
          name = @name,
          aboutMe = @aboutMe,
          phoneNumber = @phoneNumber,
          updatedAt = GETDATE()
        WHERE id = @id
      `;
    }

    request.input("id", id);
    request.input("email", userData.email);
    request.input("name", userData.name);
    request.input("aboutMe", userData.aboutMe ?? null);
    request.input("phoneNumber", userData.phoneNumber);

    const result = await request.query(sqlQuery);

    if (result.rowsAffected[0] === 0) {
      return null;
    }

    return await getUserById(id);
  } catch (error) {
    console.error("Database error in updateUser:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error("Error closing connection after updateUser:", e);
      }
    }
  }
}



async function deleteUser(id) {
  const userToDelete = await getUserById(id);
  let connection;
  try {
    connection = await sql.connect(dbConfig)

    const sqlQuery = `UPDATE Users SET isActive = 0 WHERE id = @id`
    const request = connection.request()
    request.input("id", id)
    const result = await request.query(sqlQuery)

    if (result.rowsAffected[0] === 0) {
      return null
    }
    return userToDelete;
  } catch (error) {
        console.error("Database error:", error)
        throw error
    } finally {
        if (connection) {
            try {
                await connection.close()
            } catch (err) {
                console.error("Error closing connection:", err)
            }
        }
    }
}




module.exports = {
  searchUser,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
}
