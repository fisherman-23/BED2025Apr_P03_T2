const sql = require("mssql");
const dbConfig = require("../dbConfig");
const { hash, compare } = require("../utils/hash.js");
const jwt = require("jsonwebtoken");

async function loginUser(searchTerm, password) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    const query = `
    SELECT *
    FROM Users
    WHERE (PhoneNumber = @SearchTerm OR Email = @SearchTerm) AND IsActive = 1`;

    const request = connection.request();
    request.input("SearchTerm", searchTerm);
    const result = await request.query(query);
    const user = result.recordset[0];

    if (!user) {
      return null;
    }

    if  (!await compare(password, user.Password)) {
      return null;
    }

    delete user.Password;
        const token = jwt.sign(
      { id: user.ID, email: user.Email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    return { user, token };

  } catch (error) {
    console.error("Database error in loginUser:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection after loginUser:", err);
      }
    }
  }
}

async function getUserById(ID) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "SELECT ID, Email, Name, AboutMe, PhoneNumber, DateOfBirth, ProfilePicture, CreatedAt, UpdatedAt, IsActive FROM Users WHERE ID = @ID AND IsActive = 1";
    const request = connection.request();
    request.input("ID", ID);
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
      (Email, Password, Name, AboutMe, PhoneNumber, DateOfBirth, ProfilePicture, IsActive)
    VALUES 
      (@Email, @Password, @Name, @AboutMe, @PhoneNumber, @DateOfBirth, @ProfilePicture, @IsActive);
    SELECT SCOPE_IDENTITY() AS ID;
  `;

  const request = connection.request();
  const passwordHash = await hash(userData.Password);
  request.input("Email", userData.Email);
  request.input("Password", passwordHash);
  request.input("Name", userData.Name);
  request.input("AboutMe", null);
  request.input("PhoneNumber", userData.PhoneNumber);
  request.input("DateOfBirth", userData.DateOfBirth); //format: YYYY-MM-DD
  request.input("ProfilePicture", userData.ProfilePicture || null);
  request.input("IsActive", 1);

    const result = await request.query(query);
    const newUserId = result.recordset[0].ID;
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


async function updateUser(ID, userData) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();

    let sqlQuery = ``;
    if (userData.Password && userData.NewPassword) {
      sqlQuery = `
        UPDATE Users
        SET
          Email = @Email,
          Password = @Password,
          Name = @Name,
          AboutMe = @AboutMe,
          PhoneNumber = @PhoneNumber,
          ProfilePicture = @ProfilePicture,
          UpdatedAt = GETDATE()
        WHERE ID = @ID
      `;

      const passwordQuery = `SELECT Password FROM Users WHERE ID = @ID`
      const passwordRequest = connection.request();
      passwordRequest.input("ID", ID);
      const passwordResult = await passwordRequest.query(passwordQuery);
      if (!passwordResult.recordset[0]) {
        console.log("User not found for update");
        return null;
      }
      const currentPassword = passwordResult.recordset[0].Password;
      if (!await compare(userData.Password, currentPassword)) {
        console.log("Password does not match current password");
        return null;
      }

      request.input("Password", await hash(userData.NewPassword));
    } else {
      sqlQuery = `
        UPDATE Users
        SET
          Email = @Email,
          Name = @Name,
          AboutMe = @AboutMe,
          PhoneNumber = @PhoneNumber,
          ProfilePicture = @ProfilePicture,
          UpdatedAt = GETDATE()
        WHERE ID = @ID
      `;
    }

    request.input("ID", ID);
    request.input("Email", userData.Email);
    request.input("Name", userData.Name);
    request.input("AboutMe", userData.AboutMe ?? null);
    request.input("PhoneNumber", userData.PhoneNumber);
    request.input("ProfilePicture", userData.ProfilePicture || null);

    const result = await request.query(sqlQuery);

    if (result.rowsAffected[0] === 0) {
      return null;
    }

    return await getUserById(ID);
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



async function deleteUser(ID) {
  const userToDelete = await getUserById(ID);
  let connection;
  try {
    connection = await sql.connect(dbConfig)

    const sqlQuery = `UPDATE Users SET IsActive = 0 WHERE ID = @ID`
    const request = connection.request()
    request.input("ID", ID)
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
  loginUser,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
}
