const eventsModel = require("../../models/eventsModel.js");
const sql = require("mssql");

jest.mock("mssql"); // Mock the mssql library

describe("eventsModel.getJoinedGroups", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return joined groups for a user", async () => {
    const mockGroups = [{ ID: 1, Name: "G1" }, { ID: 2, Name: "G2" }];
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: mockGroups }),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const result = await eventsModel.getJoinedGroups(42);

    expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
    expect(mockRequest.input).toHaveBeenCalledWith("UserID", 42);
    expect(mockRequest.query).toHaveBeenCalled();
    expect(mockConnection.close).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockGroups);
  });

  it("should throw on database error", async () => {
    const error = new Error("DB failure");
    sql.connect.mockRejectedValue(error);
    await expect(eventsModel.getJoinedGroups(1)).rejects.toThrow("DB failure");
  });
});

describe("eventsModel.getAvailableGroups", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return available public groups", async () => {
    const mockGroups = [{ ID: 3, Name: "Public" }];
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: mockGroups }),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const result = await eventsModel.getAvailableGroups(7);

    expect(mockRequest.input).toHaveBeenCalledWith("UserID", 7);
    expect(result).toEqual(mockGroups);
  });

  it("should throw on database error", async () => {
    const error = new Error("fail");
    sql.connect.mockRejectedValue(error);
    await expect(eventsModel.getAvailableGroups(1)).rejects.toThrow("fail");
  });
});

describe("eventsModel.createGroup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should insert and return new group, then add creator as member", async () => {
    const newGroup = { ID: 5, Name: "NewG" };
    const mockRequest1 = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: [newGroup] }),
    };
    const mockRequest2 = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({}),
    };
    const mockConnection = {
      request: jest
        .fn()
        .mockReturnValueOnce(mockRequest1) // createGroup
        .mockReturnValueOnce(mockRequest2),// add member
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const groupData = { Name: "NewG", Description: "D", GroupPicture: null, IsPrivate: false };
    const result = await eventsModel.createGroup(groupData, 88);

    // first insert inputs
    expect(mockRequest1.input).toHaveBeenCalledWith("Name", expect.anything(), "NewG");
    expect(mockRequest1.input).toHaveBeenCalledWith("CreatedBy", expect.anything(), 88);
    // second insert inputs
    expect(mockRequest2.input).toHaveBeenCalledWith("UserID", 88);
    expect(mockRequest2.input).toHaveBeenCalledWith("GroupID", 5);
    expect(result).toEqual(newGroup);
  });

  it("should throw on database error", async () => {
    sql.connect.mockRejectedValue(new Error("err"));
    await expect(eventsModel.createGroup({}, 1)).rejects.toThrow("err");
  });
});

describe("eventsModel.joinGroup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return true when insertion affected a row", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ rowsAffected: [1] }),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn(),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const ok = await eventsModel.joinGroup(10, 20);
    expect(mockRequest.input).toHaveBeenCalledWith("UserID", 10);
    expect(mockRequest.input).toHaveBeenCalledWith("GroupID", 20);
    expect(ok).toBe(true);
  });

  it("should return false when no rows affected", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ rowsAffected: [0] }),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn(),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const ok = await eventsModel.joinGroup(1, 2);
    expect(ok).toBe(false);
  });

  it("should throw on error", async () => {
    sql.connect.mockRejectedValue(new Error("fail join"));
    await expect(eventsModel.joinGroup(1, 2)).rejects.toThrow("fail join");
  });
});

describe("eventsModel.leaveGroup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return true when deletion affected a row", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ rowsAffected: [1] }),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn(),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const ok = await eventsModel.leaveGroup(3, 4);
    expect(ok).toBe(true);
  });

  it("should return false when no rows affected", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ rowsAffected: [0] }),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn(),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const ok = await eventsModel.leaveGroup(3, 4);
    expect(ok).toBe(false);
  });

  it("should throw on error", async () => {
    sql.connect.mockRejectedValue(new Error("leave fail"));
    await expect(eventsModel.leaveGroup(1, 2)).rejects.toThrow("leave fail");
  });
});

describe("eventsModel.getGroupInviteToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return token when found", async () => {
    const mockToken = "abcd";
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: [{ InviteToken: mockToken }] }),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn(),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const token = await eventsModel.getGroupInviteToken(5, 6);
    expect(token).toBe(mockToken);
  });

  it("should return null when not found", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: [] }),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn(),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const token = await eventsModel.getGroupInviteToken(5, 6);
    expect(token).toBeNull();
  });

  it("should throw on error", async () => {
    sql.connect.mockRejectedValue(new Error("token fail"));
    await expect(eventsModel.getGroupInviteToken(1, 2)).rejects.toThrow("token fail");
  });
});

describe("eventsModel.findGroupByInviteToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return group when found", async () => {
    const mockGroup = { ID: 7, Name: "X" };
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: [mockGroup] }),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn(),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const g = await eventsModel.findGroupByInviteToken("tok");
    expect(g).toEqual(mockGroup);
  });

  it("should return null when not found", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: [] }),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn(),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const g = await eventsModel.findGroupByInviteToken("tok");
    expect(g).toBeNull();
  });

  it("should throw on error", async () => {
    sql.connect.mockRejectedValue(new Error("find fail"));
    await expect(eventsModel.findGroupByInviteToken("t")).rejects.toThrow("find fail");
  });
});

describe("eventsModel.joinGroupByInviteToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fail when token invalid", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: [] }),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn(),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const result = await eventsModel.joinGroupByInviteToken(1, "bad");
    expect(result).toEqual({ success: false, message: "Invalid invite token" });
  });

  it("should fail when already a member", async () => {
    const mockReq1 = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [{ ID: 9, Name: "Y" }] }) };
    const mockReq2 = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [{ count: 1 }] }) };
    const mockConnection = {
      request: jest.fn()
        .mockReturnValueOnce(mockReq1) // groupQuery
        .mockReturnValueOnce(mockReq2), // memberCheck
      close: jest.fn(),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const result = await eventsModel.joinGroupByInviteToken(2, "tok");
    expect(result).toEqual({ success: false, message: "You are already a member of this group" });
  });

  it("should succeed when new member", async () => {
    const mockReq1 = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [{ ID: 9, Name: "Y" }] }) };
    const mockReq2 = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [{ count: 0 }] }) };
    const mockReq3 = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({}) };
    const mockConnection = {
      request: jest.fn()
        .mockReturnValueOnce(mockReq1) // groupQuery
        .mockReturnValueOnce(mockReq2) // memberCheck
        .mockReturnValueOnce(mockReq3), // insertMember
      close: jest.fn(),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const result = await eventsModel.joinGroupByInviteToken(2, "tok");
    expect(result).toEqual({ success: true, message: "Successfully joined the group", groupName: "Y" });
  });

  it("should throw on error", async () => {
    sql.connect.mockRejectedValue(new Error("join by token fail"));
    await expect(eventsModel.joinGroupByInviteToken(1, "t")).rejects.toThrow("join by token fail");
  });
});
