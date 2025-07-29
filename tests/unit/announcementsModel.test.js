const announcementsModel = require("../../models/announcementsModel");
const sql = require("mssql");

jest.mock("mssql"); // Mock the mssql library

describe("announcementsModel.getAnnouncementsByGroup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return announcements for a group", async () => {
    const mockAnns = [{ ID:1, Title:"T", Content:"C" }];
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: mockAnns }),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const result = await announcementsModel.getAnnouncementsByGroup(5);

    expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
    expect(mockRequest.input).toHaveBeenCalledWith("GroupID", sql.Int, 5);
    expect(result).toEqual(mockAnns);
    expect(mockConnection.close).toHaveBeenCalledTimes(1);
  });

  it("should throw on database error", async () => {
    sql.connect.mockRejectedValue(new Error("db error"));
    await expect(announcementsModel.getAnnouncementsByGroup(1)).rejects.toThrow("db error");
  });
});

describe("announcementsModel.createAnnouncement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should insert and return new ID", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: [{ ID: 42 }] }),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const params = { GroupID:1, Title:"A", Content:"B", ImageURL:null, CreatedBy:7 };
    const id = await announcementsModel.createAnnouncement(params);

    expect(mockRequest.input).toHaveBeenCalledWith("GroupID", sql.Int, 1);
    expect(mockRequest.input).toHaveBeenCalledWith("Title", sql.VarChar(100), "A");
    expect(mockRequest.input).toHaveBeenCalledWith("Content", sql.VarChar(2000), "B");
    expect(mockRequest.input).toHaveBeenCalledWith("ImageURL", sql.VarChar(1000), null);
    expect(mockRequest.input).toHaveBeenCalledWith("CreatedBy", sql.Int, 7);
    expect(id).toBe(42);
    expect(mockConnection.close).toHaveBeenCalledTimes(1);
  });

  it("should throw on error", async () => {
    sql.connect.mockRejectedValue(new Error("fail insert"));
    await expect(announcementsModel.createAnnouncement({})).rejects.toThrow("fail insert");
  });
});

describe("announcementsModel.getCommentsForAnnouncement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return comments list", async () => {
    const mockCom = [{ ID:1, Content:"x" }];
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: mockCom }),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const result = await announcementsModel.getCommentsForAnnouncement(9);

    expect(mockRequest.input).toHaveBeenCalledWith("AnnouncementID", sql.Int, 9);
    expect(result).toEqual(mockCom);
  });

  it("should throw on error", async () => {
    sql.connect.mockRejectedValue(new Error("fail comments"));
    await expect(announcementsModel.getCommentsForAnnouncement(1)).rejects.toThrow("fail comments");
  });
});

describe("announcementsModel.postComment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should insert comment when member", async () => {
    const checkReq = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [1] }) };
    const insertReq = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [{ ID: 99 }] }) };
    const mockConnection = {
      request: jest.fn()
        .mockReturnValueOnce(checkReq)
        .mockReturnValueOnce(insertReq),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const id = await announcementsModel.postComment({ AnnouncementID:2, UserID:3, Content:"hey" });

    expect(id).toBe(99);
  });

  it("should throw NOT_MEMBER if not a member", async () => {
    const checkReq = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [] }) };
    const mockConnection = {
      request: jest.fn().mockReturnValue(checkReq),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);

    await expect(announcementsModel.postComment({ AnnouncementID:1, UserID:1, Content:"" }))
      .rejects.toHaveProperty("code", "NOT_MEMBER");
  });
});

describe("announcementsModel.deleteComment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return true when deleted own comment", async () => {
    const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ rowsAffected: [1] }) };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const ok = await announcementsModel.deleteComment(5, 6);
    expect(ok).toBe(true);
  });

  it("should throw FORBIDDEN when no rows affected", async () => {
    const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ rowsAffected: [0] }) };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);

    await expect(announcementsModel.deleteComment(1,2)).rejects.toHaveProperty("code","FORBIDDEN");
  });
});

describe("announcementsModel.getGroupById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return group object or null", async () => {
    const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset:[{CreatedBy:8}] }) };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const g = await announcementsModel.getGroupById(3);
    expect(g).toEqual({ CreatedBy:8 });
  });

  it("should return null if none", async () => {
    const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset:[] }) };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const g = await announcementsModel.getGroupById(3);
    expect(g).toBeNull();
  });
});

describe("announcementsModel.editAnnouncement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw NOT_FOUND when no announcement", async () => {
    const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset:[] }) };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);

    await expect(announcementsModel.editAnnouncement({announcementId:1,title:"",content:"",imageUrl:null,userId:1}))
      .rejects.toHaveProperty("code","NOT_FOUND");
  });

  it("should throw FORBIDDEN when wrong user", async () => {
    const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset:[{CreatedBy:2}] }) };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);

    await expect(announcementsModel.editAnnouncement({announcementId:1,title:"",content:"",imageUrl:null,userId:1}))
      .rejects.toHaveProperty("code","FORBIDDEN");
  });

  it("should succeed for proper owner", async () => {
    const chk = { input: jest.fn().mockReturnThis(), query: jest.fn()
        .mockResolvedValueOnce({ recordset:[{CreatedBy:1}] }) };
    const upd = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({}) };
    const mockConnection = {
      request: jest.fn()
        .mockReturnValueOnce(chk)
        .mockReturnValueOnce(upd),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);

    await expect(announcementsModel.editAnnouncement({announcementId:1,title:"t",content:"c",imageUrl:null,userId:1}))
      .resolves.toBe(true);
  });
});

describe("announcementsModel.deleteAnnouncement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw NOT_FOUND when missing", async () => {
    const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset:[] }) };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);

    await expect(announcementsModel.deleteAnnouncement(1,1)).rejects.toHaveProperty("code","NOT_FOUND");
  });

  it("should throw FORBIDDEN when not creator or owner", async () => {
    const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset:[{CreatedBy:2,AnnouncementCreatedBy:3}] }) };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);

    await expect(announcementsModel.deleteAnnouncement(1,1)).rejects.toHaveProperty("code","FORBIDDEN");
  });

  it("should succeed when authorized", async () => {
    const chk = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset:[{CreatedBy:1,AnnouncementCreatedBy:2}] }) };
    const delC = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({}) };
    const delA = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({}) };
    const mockConnection = {
      request: jest.fn()
        .mockReturnValueOnce(chk)
        .mockReturnValueOnce(delC)
        .mockReturnValueOnce(delA),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);

    await expect(announcementsModel.deleteAnnouncement(1,1)).resolves.toBe(true);
  });
});
