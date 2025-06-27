const userModel = require("../models/userModel");

async function loginUser(req, res) {
  const { searchTerm, Password } = req.body;

  try {
    const result = await userModel.loginUser(searchTerm, Password);
    if (!result) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const { user, token } = result;
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60, // expires in 1h
    });
    res.json({ user });
  } catch (error) {
    console.error("Controller error in loginUser:", error);
    res.status(500).json({ error: "Error logging in user" });
  }
}

function logoutUser(req, res) {
  try {
    res.clearCookie("token");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Controller error in logoutUser:", error);
    res.status(500).json({ error: "Error logging out user" });
  }
}

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

async function createUser(req, res) {
  try {
    const newUser = await userModel.createUser(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Controller error in createUser:", error);
    res.status(500).json({ error: "Error creating user" });
  }
}

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
};
