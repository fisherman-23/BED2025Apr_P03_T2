const goal = require("../../models/goalModel.js");
const sql = require("mssql");
jest.mock("mssql");

// Test goal model creating goal
describe("goal.createGoal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a new goal", async () => {
    const mockGoal = {
      goalId: 1,
      userId: 1,
      name: "Run",
      description: "Morning jog",
    };
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: [mockGoal] }),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const result = await goal.createGoal(1, "Run", "Morning jog");

    expect(sql.connect).toHaveBeenCalled();
    expect(mockRequest.input).toHaveBeenCalledWith("userId", 1);
    expect(mockRequest.input).toHaveBeenCalledWith("name", "Run");
    expect(mockRequest.input).toHaveBeenCalledWith(
      "description",
      "Morning jog"
    );
    expect(mockConnection.close).toHaveBeenCalled();
    expect(result).toEqual(mockGoal);
  });

  it("should handle error when creation fails", async () => {
    const mockError = new Error("Failed to create goal");
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockRejectedValue(mockError),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);

    await expect(goal.createGoal(1, "Run", "Morning jog")).rejects.toThrow(
      "Failed to create goal"
    );
    expect(mockConnection.close).toHaveBeenCalled();
  });
});

// Test goal model getting goals
describe("goal.getGoals", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return all goals for user", async () => {
    const mockGoals = [{ goalId: 1 }, { goalId: 2 }];
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: mockGoals }),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn(),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const result = await goal.getGoals(1);
    expect(result).toEqual(mockGoals);
    expect(mockRequest.input).toHaveBeenCalledWith("userId", 1);
    expect(mockConnection.close).toHaveBeenCalled();
  });

  it("should handle error when failed to get goal", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockRejectedValue(new Error("Failed to fetch goals")),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn(),
    };
    sql.connect.mockResolvedValue(mockConnection);

    await expect(goal.getGoals(1)).rejects.toThrow("Failed to fetch goals");
    expect(mockConnection.close).toHaveBeenCalled();
  });
});

// Test goal model getting incompleted goals
describe("goal.getIncompletedGoals", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch incompleted goals", async () => {
    const mockGoals = [{ goalId: 1 }];
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: mockGoals }),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn(),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const result = await goal.getIncompletedGoals(1);
    expect(result).toEqual(mockGoals);
    expect(mockRequest.input).toHaveBeenCalledWith("userId", 1);
    expect(mockConnection.close).toHaveBeenCalled();
  });

  it("should handle errro fetching incompleted goals", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest
        .fn()
        .mockRejectedValue(new Error("Failed to fetch incompleted goals")),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn(),
    };
    sql.connect.mockResolvedValue(mockConnection);

    await expect(goal.getIncompletedGoals(1)).rejects.toThrow(
      "Failed to fetch incompleted goals"
    );
    expect(mockConnection.close).toHaveBeenCalled();
  });
});

// Test goal model deleting goals
describe("goal.deleteGoal", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should delete a goal", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({}),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn(),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const result = await goal.deleteGoal(1);
    expect(result).toEqual({ message: "Goal deleted successfully" });
    expect(mockRequest.input).toHaveBeenCalledWith("goalId", 1);
    expect(mockConnection.close).toHaveBeenCalled();
  });

  it("should handle error when failed to delete", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockRejectedValue(new Error("Failed to delete goal")),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn(),
    };
    sql.connect.mockResolvedValue(mockConnection);

    await expect(goal.deleteGoal(1)).rejects.toThrow("Failed to delete goal");
    expect(mockConnection.close).toHaveBeenCalled();
  });
});

// Test goal models updating goals
describe("goal.updateGoal", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should update and return goal", async () => {
    const updatedGoal = { goalId: 1, last_completed_at: "2025-07-29 08:40:00" };
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: [updatedGoal] }),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn(),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const result = await goal.updateGoal(1, 1);
    expect(result).toEqual(updatedGoal);
    expect(mockRequest.input).toHaveBeenCalledWith("goalId", 1);
    expect(mockRequest.input).toHaveBeenCalledWith("userId", 1);
    expect(mockConnection.close).toHaveBeenCalled();
  });

  it("should return null if no matching record", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: [] }),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn(),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const result = await goal.updateGoal(1, 1);
    expect(result).toBeNull();
    expect(mockConnection.close).toHaveBeenCalled();
  });
  it("should handle error when failed to update goal", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockRejectedValue(new Error("Failed to update goal")),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn(),
    };
    sql.connect.mockResolvedValue(mockConnection);

    await expect(goal.deleteGoal(1)).rejects.toThrow("Failed to update goal");
    expect(mockConnection.close).toHaveBeenCalled();
  });
});

// Test goal model reseting goals completion status
describe("goal.resetGoal", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should reset all completed goals for user", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue(),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn(),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const result = await goal.resetGoal(1);
    expect(result).toEqual({ message: "All goals reset successfully" });
    expect(mockRequest.input).toHaveBeenCalledWith("userId", 1);
    expect(mockConnection.close).toHaveBeenCalled();
  });

  it("should handle error when failed to reset goal", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockRejectedValue(new Error("Failed to reset goals")),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn(),
    };
    sql.connect.mockResolvedValue(mockConnection);

    await expect(goal.resetGoal(1)).rejects.toThrow("Failed to reset goals");
    expect(mockConnection.close).toHaveBeenCalled();
  });
});

// Test goal model logging completed goal
describe("goal.logGoalCompletion", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should log goal completion", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue(),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn(),
    };
    sql.connect.mockResolvedValue(mockConnection);

    const result = await goal.logGoalCompletion(1, 2);
    expect(result).toBe(true);
    expect(mockRequest.input).toHaveBeenCalledWith("userID", 1);
    expect(mockRequest.input).toHaveBeenCalledWith("goalID", 2);
    expect(mockConnection.close).toHaveBeenCalled();
  });

  it("should handle error when logging fails", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockRejectedValue(new Error("Failed to log completion")),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn(),
    };
    sql.connect.mockResolvedValue(mockConnection);

    await expect(goal.logGoalCompletion(1, 2)).rejects.toThrow(
      "Failed to log completion"
    );
    expect(mockConnection.close).toHaveBeenCalled();
  });
});
