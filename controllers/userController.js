const { user } = require("../dbConfig");
const userModel = require("../models/userModel");
/**
 * Logs in a user using a search term (username/email/etc.) and password.
 * Sets auth and refresh cookies on success.
 *
 * @param {import("express").Request} req - Express request object. Requires `searchTerm` and `Password` in body.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with user data or error.
 */
async function loginUser(req, res) {
  const { searchTerm, Password } = req.body;

  try {
    const result = await userModel.loginUser(searchTerm, Password);
    if (result.error) {
      return res.status(401).json({ error: result.error });
    }
    const { user, token, refreshToken } = result;
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60, // expires in 1h
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // expires in 7 days
    });
    res.json({ user });
  } catch (error) {
    console.error("Controller error in loginUser:", error);
    res.status(500).json({ error: "Error logging in user" });
  }
}
/**
 * Logs out the user by clearing authentication cookies.
 *
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with logout confirmation.
 */
function logoutUser(req, res) {
  try {
    res.clearCookie("token");
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Controller error in logoutUser:", error);
    res.status(500).json({ error: "Error logging out user" });
  }
}
/**
 * Retrieves user data by numeric ID.
 *
 * @param {import("express").Request} req - Express request object. Requires `ID` param.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with user data or 404 if not found.
 */
async function getUserById(req, res) {
  try {
    const id = parseInt(req.params.ID, 10);
    const user = await userModel.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Controller error in getUserById:", error);
    res.status(500).json({ error: "Error retrieving user" });
  }
}
/**
 * Validates whether a string is a valid UUID (v1–v5).
 *
 * @param {string} uuid - The UUID string to validate.
 * @returns {boolean} True if valid UUID, false otherwise.
 */
function isValidUUID(uuid) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    uuid
  );
}
/**
 * Retrieves user data by UUID.
 *
 * @param {import("express").Request} req - Express request object. Requires `uuid` param.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with user data or validation/error messages.
 */
async function getUserByUUID(req, res) {
  try {
    const uuid = req.params.uuid;

    if (!isValidUUID(uuid)) {
      return res.status(400).json({ error: "Invalid UUID format" });
    }

    const user = await userModel.getUserByUUID(uuid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Controller error in getUserByUUID:", error);
    res.status(500).json({ error: "Error retrieving user by UUID" });
  }
}
/**
 * Creates a new user from request body data.
 *
 * @param {import("express").Request} req - Express request object. Requires user fields in body.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with created user data or validation errors.
 */
async function createUser(req, res) {
  try {
    const newUser = await userModel.createUser(req.body);
    if (newUser.error) {
      return res.status(400).json({ error: newUser.error });
    }
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Controller error in createUser:", error);
    res.status(500).json({ error: "Error creating user" });
  }
}
/**
 * Updates an existing user by ID with new data.
 *
 * @param {import("express").Request} req - Express request object. Requires `ID` param and body with updated fields.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with updated user or error if not found.
 */
async function updateUser(req, res) {
  try {
    const id = parseInt(req.params.ID, 10);
    const updatedUser = await userModel.updateUser(id, req.body);
    if (!updatedUser) {
      return res
        .status(404)
        .json({ error: "User not found or password incorrect" });
    }
    res.json(updatedUser);
  } catch (error) {
    console.error("Controller error in updateUser:", error);
    res.status(500).json({ error: "Error updating user" });
  }
}
/**
 * Deletes a user by ID.
 *
 * @param {import("express").Request} req - Express request object. Requires `ID` param.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with 204 on success, or 404/error.
 */
async function deleteUser(req, res) {
  try {
    const id = parseInt(req.params.ID, 10);
    const deletedUser = await userModel.deleteUser(id);
    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Controller error in deleteUser:", error);
    res.status(500).json({ error: "Error deleting user" });
  }
}

module.exports = {
  loginUser,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  logoutUser,
  getUserByUUID,
};
