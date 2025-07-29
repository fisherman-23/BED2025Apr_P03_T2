const meetingsModel = require("../../models/meetingsModel");
const axios = require("axios");
const sql = require("mssql");

jest.mock("axios");
jest.mock("mssql"); // Mock the mssql library

describe("meetingsModel.createRoom", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call Daily API without name and return name/url", async () => {
    const mockData = { data: { name: "room1", url: "https://r" } };
    axios.post.mockResolvedValue(mockData);

    const result = await meetingsModel.createRoom();
    expect(axios.post).toHaveBeenCalledWith(
      "https://api.daily.co/v1/rooms",
      expect.objectContaining({ properties: expect.any(Object) }),
      expect.objectContaining({ headers: expect.any(Object) })
    );
    expect(result).toEqual({ name: "room1", url: "https://r" });
  });

  it("should include name in payload when provided", async () => {
    const mockData = { data: { name: "myroom", url: "u" } };
    axios.post.mockResolvedValue(mockData);

    const result = await meetingsModel.createRoom("myroom");
    const payload = axios.post.mock.calls[0][1];
    expect(payload.name).toBe("myroom");
    expect(result).toEqual({ name: "myroom", url: "u" });
  });
});

describe("meetingsModel.createMeetingToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return token from API", async () => {
    axios.post.mockResolvedValue({ data: { token: "abc" } });
    const token = await meetingsModel.createMeetingToken("room");
    expect(axios.post).toHaveBeenCalledWith(
      "https://api.daily.co/v1/meeting-tokens",
      expect.objectContaining({ properties: expect.any(Object) }),
      expect.objectContaining({ headers: expect.any(Object) })
    );
    expect(token).toBe("abc");
  });
});

describe("meetingsModel.saveMeeting", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should insert into DB and return new ID", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: [{ ID: 77 }] })
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const id = await meetingsModel.saveMeeting("rname", "rurl", 5);
    expect(mockRequest.input).toHaveBeenCalledWith("RoomName", sql.VarChar(100), "rname");
    expect(mockRequest.input).toHaveBeenCalledWith("RoomURL", sql.VarChar(500), "rurl");
    expect(mockRequest.input).toHaveBeenCalledWith("HostID", sql.Int, 5);
    expect(id).toBe(77);
    expect(mockConnection.close).toHaveBeenCalledTimes(1);
  });
});

describe("meetingsModel.getMeetingById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return meeting data when found", async () => {
    const mockRecord = { ID:1, RoomName:"n", RoomURL:"u", HostID:3 };
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: [mockRecord] })
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const data = await meetingsModel.getMeetingById(1);
    expect(mockRequest.input).toHaveBeenCalledWith("ID", sql.Int, 1);
    expect(data).toEqual(mockRecord);
  });

  it("should return null if not found", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: [] })
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const data = await meetingsModel.getMeetingById(2);
    expect(data).toBeNull();
  });
});

describe("meetingsModel.getMeetingByName", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return URL when found", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: [{ RoomURL: "u" }] })
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const url = await meetingsModel.getMeetingByName("r");
    expect(mockRequest.input).toHaveBeenCalledWith("RoomName", sql.VarChar(100), "r");
    expect(url).toBe("u");
    expect(mockConnection.close).toHaveBeenCalledTimes(1);
  });

  it("should return null if not found", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: [] })
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const url = await meetingsModel.getMeetingByName("x");
    expect(url).toBeNull();
  });
});
