const dotenv = require("dotenv");
const express = require("express");
const sql = require("mssql");
const path = require("path");
const cookieParser = require("cookie-parser");
dotenv.config();

const userController = require("./controllers/userController.js");
const {
  validateUserId,
  validateLoginUser,
  validateCreateUser,
  validateUpdateUser,
  authenticateJWT
} = require("./middlewares/userValidation");

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/users/login", validateLoginUser, userController.loginUser);

app.post("/users", validateCreateUser, userController.createUser);

app.get("/users/:ID", authenticateJWT, validateUserId, userController.getUserById);

app.put("/users/:ID", authenticateJWT, validateUserId, validateUpdateUser, userController.updateUser);

app.delete("/users/:ID", authenticateJWT, validateUserId, userController.deleteUser);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connections closed");
  process.exit(0);
});

