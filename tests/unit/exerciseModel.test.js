// Unit tests for exerciseModel
const exercise = require("../../models/exerciseModel.js");
const sql = require("mssql");
jest.mock("mssql");

// Test getting exercise preferences
describe("exercise.getExercisePreferences", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should get all exercise preferences", async () => {
    const mockPref = [
      {
        categoryId: 1,
      },
      {
        categoryId: 2,
      },
    ];
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: mockPref }),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);
    const pref = await exercise.getExercisePreferences(1);
    expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
    expect(mockRequest.input).toHaveBeenCalledWith("userId", 1);
    expect(mockConnection.close).toHaveBeenCalledTimes(1);
    expect(pref).toHaveLength(2);
  });

  it("should handle errors when retreieving preferences", async () => {
    const mockError = new Error("Fetching preferences failed");

    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockRejectedValue(mockError),
    };

    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };

    sql.connect.mockResolvedValue(mockConnection);

    await expect(exercise.getExercisePreferences(1)).rejects.toThrow(
      "Fetching preferences failed"
    );
    expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
    expect(mockConnection.close).toHaveBeenCalledTimes(1);
  });
});

// Test updating exercise preferences
describe("exercise.updateExercisePreferences", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update preferences by deleting and inserting new ones", async () => {
    const userId = 1;
    const categoryIds = [1, 2, 3];

    const mockDeleteRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue(),
    };

    const mockInsertRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue(),
    };
    const mockConnection = {
      request: jest
        .fn()
        .mockReturnValueOnce(mockDeleteRequest)
        .mockReturnValue(mockInsertRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };

    sql.connect.mockResolvedValue(mockConnection);

    const result = await exercise.updateExercisePreferences(
      categoryIds,
      userId
    );

    expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
    expect(mockDeleteRequest.input).toHaveBeenCalledWith("userId", userId);
    expect(mockConnection.request).toHaveBeenCalledTimes(
      categoryIds.length + 1
    );
    expect(mockInsertRequest.query).toHaveBeenCalledTimes(categoryIds.length);
    expect(mockConnection.close).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it("should handle errors when updating preferences", async () => {
    const mockError = new Error("Error updating preferences");
    const mockDeleteRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockRejectedValue(mockError),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockDeleteRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);
    await expect(exercise.updateExercisePreferences([1, 2], 1)).rejects.toThrow(
      "Error updating preferences"
    );
    expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
    expect(mockConnection.close).toHaveBeenCalledTimes(1);
  });
});

// Test deleting Exercises preferences
describe("exercise.deleteExercisePreferences", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should delete exercise preferences", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue(),
    };

    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };

    sql.connect.mockResolvedValue(mockConnection);

    const result = await exercise.deleteExercisePreference(1);

    expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
    expect(mockConnection.request).toHaveBeenCalled();
    expect(mockRequest.input).toHaveBeenCalledWith("userId", 1);
    expect(mockRequest.query).toHaveBeenCalledTimes(1);
    expect(mockConnection.close).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it("should handle errors deleting preferences", async () => {
    const mockError = new Error("Error deleting preferences");
    const mockDeleteRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockRejectedValue(mockError),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockDeleteRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);
    await expect(exercise.deleteExercisePreference(1)).rejects.toThrow(
      "Error deleting preferences"
    );
    expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
    expect(mockConnection.close).toHaveBeenCalledTimes(1);
  });
});

// Test getting exercises
describe("exercise.getExercises", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should return filtered exercises when there is user preferences", async () => {
    const mockPrefs = [{ categoryId: 1 }, { categoryId: 2 }];
    const mockExercises = [
      {
        exerciseId: 1,
        title: "Seated Knee Lifts",
        description:
          "A simple seated movement that strengthens thighs and supports circulation. Ideal for those with limited mobility.",
        image_url: "/exercise/images/seated_knee_lifts.png",
        categoryId: 1,
        benefits:
          "This exercise helps stimulate blood flow in your legs and strengthens your thigh muscles. You may feel improved lower-body control and reduced stiffness.",
      },
      {
        exerciseId: 5,
        title: "Guided Nature Walk",
        description:
          "A leisurely outdoor walk through parks or gardens that promotes mobility, cardiovascular health, and mental wellness.",
        image_url: "/exercise/images/guided_nature_walk.png",
        categoryId: 2,
        benefits:
          "You’ll feel refreshed and energized, with better circulation and cardiovascular endurance. The outdoor setting also supports mental relaxation.",
      },
    ];

    exercise.getExercisePreferences = jest.fn().mockResolvedValue(mockPrefs);
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: mockExercises }),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);
    const result = await exercise.getExercises(1);
    expect(exercise.getExercisePreferences).toHaveBeenCalledTimes(1);
    expect(sql.connect).toHaveBeenCalled();
    expect(mockRequest.query).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockExercises);
    expect(mockConnection.close).toHaveBeenCalledTimes(1);
  });

  it("should return all exercises if no preferences found", async () => {
    exercise.getExercisePreferences = jest.fn().mockResolvedValue([]);
    const mockExercises = [
      {
        exerciseId: 1,
        title: "Seated Knee Lifts",
        description:
          "A simple seated movement that strengthens thighs and supports circulation. Ideal for those with limited mobility.",
        image_url: "/exercise/images/seated_knee_lifts.png",
        categoryId: 1,
        benefits:
          "This exercise helps stimulate blood flow in your legs and strengthens your thigh muscles. You may feel improved lower-body control and reduced stiffness.",
      },
    ];
    const mockRequest = {
      query: jest.fn().mockResolvedValue({ recordset: mockExercises }),
    };

    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);
    const result = await exercise.getExercises(1);
    expect(mockRequest.query).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockExercises);
  });

  it("should handle errors when fail to get user pref", async () => {
    const mockError = new Error("Failed to get user prefrences");
    exercise.getExercisePreferences = jest.fn().mockRejectedValue(mockError);
    await expect(exercise.getExercises(1)).rejects.toThrow(
      "Failed to get user prefrences"
    );
  });

  it("should handle errors when fail to get exercises", async () => {
    const mockError = new Error("Failed to get exercises");
    exercise.getExercisePreferences = jest
      .fn()
      .mockResolvedValue([{ categoryId: 1 }]);
    const mockDeleteRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockRejectedValue(mockError),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockDeleteRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };
    sql.connect.mockResolvedValue(mockConnection);
    await expect(exercise.getExercises(1)).rejects.toThrow(
      "Failed to get exercises"
    );
    expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
    expect(mockConnection.close).toHaveBeenCalledTimes(1);
  });
});

// Test getting exercise steps
describe("exercise.getSteps", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return steps for a given exercise ID", async () => {
    const mockSteps = [
      { stepId: 1, step_number: 1, instruction: "Sit upright" },
      { stepId: 2, step_number: 2, instruction: "Lift your knee" },
    ];

    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: mockSteps }),
    };

    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(),
    };

    sql.connect.mockResolvedValue(mockConnection);

    const result = await exercise.getSteps(1);

    expect(sql.connect).toHaveBeenCalled();
    expect(mockRequest.input).toHaveBeenCalledWith("exerciseId", 1);
    expect(mockRequest.query).toHaveBeenCalled();
    expect(result).toEqual(mockSteps);
    expect(mockConnection.close).toHaveBeenCalled();
  });

  it("should handle error if the query fails", async () => {
    const mockError = new Error("Failed to get steps");

    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockRejectedValue(mockError),
    };

    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(),
    };

    sql.connect.mockResolvedValue(mockConnection);

    await expect(exercise.getSteps(1)).rejects.toThrow("Failed to get steps");

    expect(sql.connect).toHaveBeenCalled();
    expect(mockRequest.input).toHaveBeenCalledWith("exerciseId", 1);
    expect(mockConnection.close).toHaveBeenCalled();
  });
});

// Test creating user preferences
describe("exercise.personalisation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should insert preferences for each category ID", async () => {
    const categoryIds = [1, 2, 3];
    const mockInsertRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({}),
    };

    const mockConnection = {
      request: jest.fn().mockReturnValue(mockInsertRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };

    sql.connect.mockResolvedValue(mockConnection);

    const result = await exercise.personalisation(categoryIds, 1);

    expect(sql.connect).toHaveBeenCalled();
    expect(mockConnection.request).toHaveBeenCalledTimes(categoryIds.length);
    expect(mockInsertRequest.input).toHaveBeenCalledWith("userId", 1);
    expect(mockInsertRequest.query).toHaveBeenCalledTimes(categoryIds.length);
    expect(mockConnection.close).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it("should handle error when creating personalisation", async () => {
    const mockError = new Error("Saving preferences failed");
    const categoryIds = [1];

    const mockFailingRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockRejectedValue(mockError),
    };

    const mockConnection = {
      request: jest.fn().mockReturnValue(mockFailingRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };

    sql.connect.mockResolvedValue(mockConnection);

    await expect(exercise.personalisation(categoryIds, 1)).rejects.toThrow(
      "Saving preferences failed"
    );
    expect(mockConnection.close).toHaveBeenCalled();
  });
});

// Test getting user statistics
describe("exercise.getUserStats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return user stats with number of completed exercises and goals", async () => {
    const mockResult = {
      recordset: [
        {
          userID: 1,
          exercise_completed: 5,
          goal_completed: 3,
        },
      ],
    };

    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue(mockResult),
    };

    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };

    sql.connect.mockResolvedValue(mockConnection);

    const result = await exercise.getUserStats(1);

    expect(sql.connect).toHaveBeenCalled();
    expect(mockConnection.request).toHaveBeenCalled();
    expect(mockRequest.input).toHaveBeenCalledWith("userId", 1);
    expect(mockRequest.query).toHaveBeenCalled();
    expect(result).toEqual(mockResult.recordset[0]);
    expect(mockConnection.close).toHaveBeenCalled();
  });

  it("should handle error when cannot get user statistic", async () => {
    const mockError = new Error("Failed to get user statistics");

    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockRejectedValue(mockError),
    };

    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };

    sql.connect.mockResolvedValue(mockConnection);

    await expect(exercise.getUserStats(1)).rejects.toThrow(
      "Failed to get user statistics"
    );
    expect(mockConnection.close).toHaveBeenCalled();
  });
});

// Test logging user completed exercise
describe("exercise.logExerciseCompletion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should log exercise completion successfully", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue(),
    };

    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };

    sql.connect.mockResolvedValue(mockConnection);

    const result = await exercise.logExerciseCompletion(1, 5);

    expect(sql.connect).toHaveBeenCalled();
    expect(mockConnection.request).toHaveBeenCalled();
    expect(mockRequest.input).toHaveBeenCalledWith("userID", 1);
    expect(mockRequest.input).toHaveBeenCalledWith("exerciseID", 5);
    expect(mockRequest.query).toHaveBeenCalled();
    expect(result).toBe(true);
    expect(mockConnection.close).toHaveBeenCalled();
  });

  it("should throw an error if the query fails", async () => {
    const mockError = new Error("Failed to log completed exercise");
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockRejectedValue(mockError),
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined),
    };

    sql.connect.mockResolvedValue(mockConnection);

    await expect(exercise.logExerciseCompletion(1, 2)).rejects.toThrow(
      "Failed to log completed exercise"
    );
    expect(mockConnection.close).toHaveBeenCalled();
  });
});
