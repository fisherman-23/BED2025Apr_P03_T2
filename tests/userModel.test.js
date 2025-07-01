jest.mock("mssql");
jest.mock("../utils/hash.js");
jest.mock("jsonwebtoken");

const sql = require("mssql");
const { hash, compare } = require("../utils/hash.js");
const jwt = require("jsonwebtoken");

const {
  loginUser,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require("../models/userModel");

describe("User Model", () => {
  let mockConnection;
  let mockRequest;

  beforeEach(() => {
    mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn(),
    };

    mockConnection = {
      request: jest.fn(() => mockRequest),
      close: jest.fn(),
    };

    sql.connect.mockResolvedValue(mockConnection);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("loginUser", () => {
    it("should return token and user if credentials are valid", async () => {
      const fakeUser = {
        ID: 1,
        Email: "test@example.com",
        Password: "hashedpw",
      };

      mockRequest.query.mockResolvedValue({ recordset: [fakeUser] });
      compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("mockToken");

      const result = await loginUser("test@example.com", "password");

      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("token", "mockToken");
      expect(result.user.Password).toBeUndefined();
    });

    it("should return error for invalid email/phone", async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await loginUser("noone@example.com", "pw");
      expect(result).toEqual({ error: "Invalid Email or Phone number" });
    });

    it("should return error for wrong password", async () => {
      const fakeUser = { ID: 1, Email: "a", Password: "hashedpw" };
      mockRequest.query.mockResolvedValue({ recordset: [fakeUser] });
      compare.mockResolvedValue(false);

      const result = await loginUser("test@example.com", "wrongpw");
      expect(result).toEqual({ error: "Invalid password" });
    });
  });

  describe("getUserById", () => {
    it("should return user if found", async () => {
      mockRequest.query.mockResolvedValue({
        recordset: [{ ID: 1, Email: "test@example.com" }],
      });

      const result = await getUserById(1);
      expect(result.Email).toBe("test@example.com");
    });

    it("should return null if not found", async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await getUserById(99);
      expect(result).toBeNull();
    });
  });

  describe("createUser", () => {
    it("should create user if email and phone are unique", async () => {
      // Check: no existing users
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [] }) // checkQuery
        .mockResolvedValueOnce({ recordset: [{ ID: 123 }] }) // insert query
        .mockResolvedValueOnce({ recordset: [{ ID: 123, Email: "a" }] }); // getUserById

      hash.mockResolvedValue("hashedpw");

      const userData = {
        Email: "a",
        Password: "pw",
        Name: "Test",
        PhoneNumber: "123",
        DateOfBirth: "2000-01-01",
      };

      const result = await createUser(userData);
      expect(result.ID).toBe(123);
    });

    it("should return error if email/phone already used", async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ ID: 1 }] }); // checkQuery

      const result = await createUser({
        Email: "a",
        PhoneNumber: "123",
      });

      expect(result).toEqual({
        error: "Email or Phone number already in use",
      });
    });
  });

  describe("updateUser", () => {
    it("should update user without password change", async () => {
      mockRequest.query
        .mockResolvedValueOnce({ rowsAffected: [1] }) // update
        .mockResolvedValueOnce({ recordset: [{ ID: 1, Email: "updated" }] }); // getUserById

      const result = await updateUser(1, {
        Email: "updated",
        Name: "Name",
        PhoneNumber: "123",
      });

      expect(result.Email).toBe("updated");
    });

    it("should update user with password change if match", async () => {
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ Password: "oldHash" }] }) // get current password
        .mockResolvedValueOnce({ rowsAffected: [1] }) // update
        .mockResolvedValueOnce({ recordset: [{ ID: 1, Email: "updated" }] }); // getUserById

      compare.mockResolvedValue(true);
      hash.mockResolvedValue("newHash");

      const result = await updateUser(1, {
        Email: "updated",
        Name: "Name",
        PhoneNumber: "123",
        Password: "oldPW",
        NewPassword: "newPW",
      });

      expect(result.Email).toBe("updated");
    });

    it("should return null if password mismatch", async () => {
      mockRequest.query.mockResolvedValueOnce({
        recordset: [{ Password: "oldHash" }],
      });
      compare.mockResolvedValue(false);

      const result = await updateUser(1, {
        Email: "e",
        Name: "n",
        PhoneNumber: "p",
        Password: "wrong",
        NewPassword: "new",
      });

      expect(result).toBeNull();
    });
  });

  describe("deleteUser", () => {
    it("should soft delete user", async () => {
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ ID: 1, Email: "e" }] }) // getUserById
        .mockResolvedValueOnce({ rowsAffected: [1] }); // update

      const result = await deleteUser(1);
      expect(result.Email).toBe("e");
    });

    it("should return null if user not found", async () => {
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [] }) // getUserById
        .mockResolvedValueOnce({ rowsAffected: [0] }); // update

      const result = await deleteUser(999);
      expect(result).toBeNull();
    });
  });
});
