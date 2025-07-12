const sql = require("mssql");
const {
  createMatchProfile,
  hasMatchProfile,
  updateMatchProfile,
  getMatchProfileByUserId,
  getPotentialMatches,
  likeUser,
  skipUser,
} = require("../../models/matchModel");

jest.mock("mssql");

describe("matchModel", () => {
  let mockRequest;
  let mockQuery;
  let mockConnection;

  beforeEach(() => {
    mockQuery = jest.fn();
    mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: mockQuery,
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

  describe("createMatchProfile", () => {
    it("inserts a new profile and returns true on success", async () => {
      mockQuery.mockResolvedValue({ rowsAffected: [1] });

      const result = await createMatchProfile(1, { bio: "test" });
      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalled();
    });

    it("returns false if no rows inserted", async () => {
      mockQuery.mockResolvedValue({ rowsAffected: [0] });

      const result = await createMatchProfile(1, {});
      expect(result).toBe(false);
    });
  });

  describe("hasMatchProfile", () => {
    it("returns true if profile exists", async () => {
      mockQuery.mockResolvedValue({ recordset: [{}] });

      const result = await hasMatchProfile(1);
      expect(result).toBe(true);
    });

    it("returns false if no profile found", async () => {
      mockQuery.mockResolvedValue({ recordset: [] });

      const result = await hasMatchProfile(1);
      expect(result).toBe(false);
    });
  });

  describe("updateMatchProfile", () => {
    it("returns true if update affected rows", async () => {
      mockQuery.mockResolvedValue({ rowsAffected: [1] });

      const result = await updateMatchProfile(1, { bio: "new" });
      expect(result).toBe(true);
    });

    it("returns false if update affected 0 rows", async () => {
      mockQuery.mockResolvedValue({ rowsAffected: [0] });

      const result = await updateMatchProfile(1, {});
      expect(result).toBe(false);
    });
  });

  describe("getMatchProfileByUserId", () => {
    it("returns profile if found", async () => {
      const profile = { UserID: 1, Bio: "hi" };
      mockQuery.mockResolvedValue({ recordset: [profile] });

      const result = await getMatchProfileByUserId(1);
      expect(result).toEqual(profile);
    });

    it("returns null if not found", async () => {
      mockQuery.mockResolvedValue({ recordset: [] });

      const result = await getMatchProfileByUserId(1);
      expect(result).toBeNull();
    });
  });

  describe("getPotentialMatches", () => {
    it("returns a list of matches", async () => {
      const matches = [{ UserID: 2 }, { UserID: 3 }];
      mockQuery.mockResolvedValue({ recordset: matches });

      const result = await getPotentialMatches(1);
      expect(result).toEqual(matches);
    });
  });

  describe("likeUser", () => {
    it("returns matched: true on reciprocal like", async () => {
      mockQuery
        .mockResolvedValueOnce({}) // merge
        .mockResolvedValueOnce({ recordset: [{ Status: "liked" }] }) // reciprocal
        .mockResolvedValueOnce({}) // update to matched
        .mockResolvedValueOnce({}); // insert friendship

      const result = await likeUser(1, 2);
      expect(result).toEqual({ matched: true });
    });

    it("returns matched: false on no reciprocal", async () => {
      mockQuery
        .mockResolvedValueOnce({}) // merge
        .mockResolvedValueOnce({ recordset: [] }); // no reciprocal

      const result = await likeUser(1, 2);
      expect(result).toEqual({ matched: false });
    });
  });

  describe("skipUser", () => {
    it("inserts or updates skip interaction", async () => {
      mockQuery.mockResolvedValue({});
      await skipUser(1, 2);
      expect(mockQuery).toHaveBeenCalled();
    });
  });
});
