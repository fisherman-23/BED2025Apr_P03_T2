const sql = require("mssql");
const dbConfig = require("../dbConfig");
const { hash, compare } = require("../utils/hash.js");
const jwt = require("jsonwebtoken");
/**
 * Logs in a user using their email or phone number and password.
 * @param {string} searchTerm - The user's email or phone number.
 * @param {string} Password - The user's plain text password.
 * @returns {Promise<Object>} An object containing either `{ user, token, refreshToken }` or `{ error }`.
 */
async function loginUser(searchTerm, Password) {
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
      return { error: "Invalid Email or Phone number" };
    }

    if (!(await compare(Password, user.Password))) {
      return { error: "Invalid password" };
    }

    delete user.Password;
    const token = jwt.sign(
      { id: user.ID, email: user.Email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    const refreshToken = jwt.sign(
      { id: user.ID, email: user.Email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );
    return { user, token, refreshToken };
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
/**
 * Retrieves a user by their database ID.
 * @param {number} ID - The user's ID.
 * @returns {Promise<Object|null>} The user object if found, otherwise null.
 */
async function getUserById(ID) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
    SELECT ID, PublicUUID, Email, Name, AboutMe, PhoneNumber, DateOfBirth, 
          ProfilePicture, CreatedAt, UpdatedAt, IsActive 
    FROM Users 
    WHERE ID = @ID AND IsActive = 1
  `;
    const request = connection.request();
    request.input("ID", ID);
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return null;
    }

    return result.recordset[0];
  } catch (e) {
    console.error("Database error:", e);
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
/**
 * Retrieves a user by their public UUID.
 * @param {string} uuid - The user's public UUID.
 * @returns {Promise<Object|null>} The user object if found, otherwise null.
 */
async function getUserByUUID(uuid) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
    SELECT ID, PublicUUID, Email, Name, AboutMe, PhoneNumber, DateOfBirth,
          ProfilePicture, CreatedAt, UpdatedAt, IsActive
    FROM Users
    WHERE PublicUUID = @UUID AND IsActive = 1
  `;
    const request = connection.request();
    request.input("UUID", uuid);
    const result = await request.query(query);
    if (result.recordset.length === 0) {
      return null;
    }
    return result.recordset[0];
  } catch (error) {
    console.error("Database error in getUserByUUID:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error("Error closing connection in getUserByUUID:", e);
      }
    }
  }
}
/**
 * Creates a new user account with the provided data.
 * @param {Object} userData - The user's registration data.
 * @param {string} userData.Email - The user's email.
 * @param {string} userData.Password - The user's password (plain text).
 * @param {string} userData.Name - The user's name.
 * @param {string} userData.PhoneNumber - The user's phone number.
 * @param {string} userData.DateOfBirth - The user's birth date (YYYY-MM-DD).
 * @param {string} [userData.ProfilePicture] - Optional profile picture URL.
 * @returns {Promise<Object>} The newly created user object, or an error object.
 */
async function createUser(userData) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const checkQuery = `
      SELECT ID FROM Users WHERE Email = @Email OR PhoneNumber = @PhoneNumber
    `;
    const checkRequest = connection.request();
    checkRequest.input("Email", userData.Email);
    checkRequest.input("PhoneNumber", userData.PhoneNumber);
    const checkResult = await checkRequest.query(checkQuery);

    if (checkResult.recordset.length > 0) {
      return { error: "Email or Phone number already in use" };
    }
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
    request.input(
      "ProfilePicture",
      userData.ProfilePicture || "/assets/images/defaultPFP.png"
    );
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
/**
 * Updates an existing user's profile information.
 * @param {number} ID - The ID of the user to update.
 * @param {Object} userData - The new user data.
 * @param {string} userData.Email - The new email.
 * @param {string} userData.Name - The new name.
 * @param {string} userData.PhoneNumber - The new phone number.
 * @param {string} [userData.AboutMe] - The user's updated bio/about info.
 * @param {string} [userData.ProfilePicture] - Optional new profile picture URL.
 * @param {string} [userData.Password] - The current password, required if changing password.
 * @param {string} [userData.NewPassword] - The new password to update to.
 * @returns {Promise<Object|null>} The updated user object, or null if the update failed or password was incorrect.
 */
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

      const passwordQuery = `SELECT Password FROM Users WHERE ID = @ID`;
      const passwordRequest = connection.request();
      passwordRequest.input("ID", ID);
      const passwordResult = await passwordRequest.query(passwordQuery);
      if (!passwordResult.recordset[0]) {
        console.log("User not found for update");
        return null;
      }
      const currentPassword = passwordResult.recordset[0].Password;
      if (!(await compare(userData.Password, currentPassword))) {
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
/**
 * Soft deletes (deactivates) a user by setting `IsActive` to 0.
 * @param {number} ID - The ID of the user to deactivate.
 * @returns {Promise<Object|null>} The user object before deletion, or null if not found.
 */
async function deleteUser(ID) {
  const userToDelete = await getUserById(ID);
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    const sqlQuery = `UPDATE Users SET IsActive = 0 WHERE ID = @ID`;
    const request = connection.request();
    request.input("ID", ID);
    const result = await request.query(sqlQuery);

    if (result.rowsAffected[0] === 0) {
      return null;
    }
    return userToDelete;
  } catch (error) {
    console.error("Database error:", error);
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
  loginUser,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserByUUID,
};
