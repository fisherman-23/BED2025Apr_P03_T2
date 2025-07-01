jest.mock("../models/userModel");

const userModel = require("../models/userModel");
const {
  loginUser,
  logoutUser,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

describe("User Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
    };

    res = {
      status: jest.fn(() => res),
      json: jest.fn(() => res),
      cookie: jest.fn(() => res),
      clearCookie: jest.fn(() => res),
      send: jest.fn(() => res),
    };

    jest.clearAllMocks();
  });

  describe("loginUser", () => {
    it("should return user and set cookie if login successful", async () => {
      const mockUser = { ID: 1, Email: "test@example.com" };
      userModel.loginUser.mockResolvedValue({
        user: mockUser,
        token: "abc123",
      });

      req.body = { searchTerm: "test@example.com", Password: "pw" };

      await loginUser(req, res);

      expect(userModel.loginUser).toHaveBeenCalledWith(
        "test@example.com",
        "pw"
      );
      expect(res.cookie).toHaveBeenCalledWith(
        "token",
        "abc123",
        expect.objectContaining({ httpOnly: true })
      );
      expect(res.json).toHaveBeenCalledWith({ user: mockUser });
    });

    it("should return 401 if login fails", async () => {
      userModel.loginUser.mockResolvedValue({ error: "Invalid password" });
      req.body = { searchTerm: "x", Password: "y" };

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid password" });
    });

    it("should return 500 on error", async () => {
      userModel.loginUser.mockRejectedValue(new Error("DB Error"));

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Error logging in user" });
    });
  });

  describe("logoutUser", () => {
    it("should clear cookie and return 200", () => {
      logoutUser(req, res);
      expect(res.clearCookie).toHaveBeenCalledWith("token");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Logged out successfully",
      });
    });
  });

  describe("getUserById", () => {
    it("should return user if found", async () => {
      const mockUser = { ID: 1, Email: "a" };
      userModel.getUserById.mockResolvedValue(mockUser);
      req.params.ID = "1";

      await getUserById(req, res);

      expect(userModel.getUserById).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it("should return 404 if user not found", async () => {
      userModel.getUserById.mockResolvedValue(null);
      req.params.ID = "123";

      await getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });

    it("should return 500 on error", async () => {
      userModel.getUserById.mockRejectedValue(new Error("err"));
      req.params.ID = "1";

      await getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Error retrieving user" });
    });
  });

  describe("createUser", () => {
    it("should create and return new user", async () => {
      const newUser = { ID: 1, Email: "a" };
      userModel.createUser.mockResolvedValue(newUser);
      req.body = { Email: "a" };

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newUser);
    });

    it("should return 400 if user creation error", async () => {
      userModel.createUser.mockResolvedValue({ error: "duplicate" });
      req.body = { Email: "dup" };

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "duplicate" });
    });

    it("should return 500 on error", async () => {
      userModel.createUser.mockRejectedValue(new Error("err"));

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Error creating user" });
    });
  });

  describe("updateUser", () => {
    it("should return updated user if success", async () => {
      const updated = { ID: 1, Email: "new" };
      userModel.updateUser.mockResolvedValue(updated);
      req.params.ID = "1";
      req.body = { Email: "new" };

      await updateUser(req, res);

      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it("should return 404 if update fails", async () => {
      userModel.updateUser.mockResolvedValue(null);
      req.params.ID = "1";

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "User not found or password incorrect",
      });
    });

    it("should return 500 on error", async () => {
      userModel.updateUser.mockRejectedValue(new Error("err"));
      req.params.ID = "1";

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Error updating user" });
    });
  });

  describe("deleteUser", () => {
    it("should return 204 if deleted", async () => {
      userModel.deleteUser.mockResolvedValue({ ID: 1 });
      req.params.ID = "1";

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("should return 404 if not found", async () => {
      userModel.deleteUser.mockResolvedValue(null);
      req.params.ID = "999";

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });

    it("should return 500 on error", async () => {
      userModel.deleteUser.mockRejectedValue(new Error("err"));
      req.params.ID = "1";

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Error deleting user" });
    });
  });
});
