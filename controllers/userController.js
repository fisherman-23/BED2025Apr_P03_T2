const userModel = require("../models/userModel");

async function searchUser(req, res) {
  const { searchTerm } = req.query;

  try {
    const user = await userModel.searchUser(searchTerm);
    if (!user) {
      return res.status(404).json({ error: "No user found matching search term" });
    }
    res.json(user);
  } catch (error) {
    console.error("Controller error in searchUser:", error);
    res.status(500).json({ error: "Error searching users" });
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
      return res.status(404).json({ error: "User not found or password incorrect" });
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
  searchUser,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
