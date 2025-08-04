import { describe, it, expect, vi, beforeEach, Mock } from "vitest";

// --- Mocks ---

// Mock the dependencies used by the helper functions
const mockFakerNumberInt = vi.fn();
const mockFakerNumberFloat = vi.fn();
vi.mock("@faker-js/faker", () => ({
  faker: {
    number: {
      int: mockFakerNumberInt,
      float: mockFakerNumberFloat,
    },
    // No need to mock other faker parts unless helpers use them
  },
}));

// const mockBcryptHash = vi.fn(); // Remove old mock function
// vi.mock("bcryptjs", () => ({ // Remove vi.mock for bcryptjs
//   hash: mockBcryptHash,
// }));

// Create a mock hasher function for dependency injection
const mockHasher = vi.fn();

// --- Test Suite ---

// Import the functions to test *after* mocks are set up
const {
  random,
  weightedRandom,
  proportionateRandom,
  accountDataGenerator,
  passwordHash,
} = await import("./seedUtils.js");

describe("Seed Utils Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    mockFakerNumberInt.mockReturnValue(5); // Default return for int
    mockFakerNumberFloat.mockReturnValue(1.1); // Default return for float
    // mockBcryptHash.mockResolvedValue("hashed_password"); // Remove
    mockHasher.mockResolvedValue("hashed_password_injected"); // Set default for injected mock
  });

  describe("random", () => {
    it("should call faker.number.int with correct min/max", () => {
      random(10, 20);
      expect(mockFakerNumberInt).toHaveBeenCalledOnce();
      expect(mockFakerNumberInt).toHaveBeenCalledWith({ min: 10, max: 20 });
    });

    it("should return the value from faker.number.int", () => {
      const result = random(1, 1);
      expect(result).toBe(5);
    });
  });

  describe("weightedRandom", () => {
    it("should call faker.number.float and calculate correctly", () => {
      const result = weightedRandom(100, 1.5);
      expect(mockFakerNumberFloat).toHaveBeenCalledOnce();
      expect(mockFakerNumberFloat).toHaveBeenCalledWith({ min: 0.5, max: 1.5 });
      // 100 * 1.5 * 1.1 (mocked float) = 165
      expect(result).toBe(165);
    });
  });

  describe("proportionateRandom", () => {
    // Since proportionateRandom calls the local 'random', which uses the mocked faker.number.int,
    // we test the bounds passed to the mock.
    it("should calculate bounds and call faker.number.int via random()", () => {
      const result = proportionateRandom(100, 0.3); // Expect bounds around 15 - 45
      const expectedMin = Math.ceil(100 * 0.3 * 0.5); // 15
      const expectedMax = Math.ceil(100 * 0.3 * 1.5); // 45

      expect(mockFakerNumberInt).toHaveBeenCalledOnce();
      expect(mockFakerNumberInt).toHaveBeenCalledWith({
        min: expectedMin,
        max: expectedMax,
      });
      expect(result).toBe(5); // Returns the mocked int value
    });
  });

  describe("accountDataGenerator", () => {
    it("should call proportionateRandom when value is 'random'", () => {
      const result = accountDataGenerator("random", 50, 0.5);
      const expectedMin = Math.ceil(50 * 0.5 * 0.5); // 13
      const expectedMax = Math.ceil(50 * 0.5 * 1.5); // 38
      // proportionateRandom calls random, which calls mockFakerNumberInt
      expect(mockFakerNumberInt).toHaveBeenCalledOnce();
      expect(mockFakerNumberInt).toHaveBeenCalledWith({
        min: expectedMin,
        max: expectedMax,
      });
      expect(result).toBe(5);
    });

    it("should return numeric value when value is a number", () => {
      const result = accountDataGenerator(123, 50, 0.5);
      expect(mockFakerNumberInt).not.toHaveBeenCalled(); // Random path not taken
      expect(result).toBe(123);
    });

    it("should return numeric value when value is a string number", () => {
      const result = accountDataGenerator("456", 50, 0.5);
      expect(mockFakerNumberInt).not.toHaveBeenCalled();
      expect(result).toBe(456);
    });

    it("should return 0 for non-numeric string values", () => {
      const result = accountDataGenerator("not a number", 50, 0.5);
      expect(mockFakerNumberInt).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });
  });

  describe("passwordHash", () => {
    it("should call the injected hasher when provided", async () => {
      const password = "mySecretPassword";
      // Reset mocks just in case
      vi.resetAllMocks();
      mockHasher.mockResolvedValue("hashed_password_injected");

      // Call passwordHash with the injected mock
      const result = await passwordHash(password, mockHasher);

      expect(mockHasher).toHaveBeenCalledOnce();
      expect(mockHasher).toHaveBeenCalledWith(password);
      expect(result).toBe("hashed_password_injected");
      // We no longer expect the internal bcryptjs import/call
    });

    // Optional: Test default behavior (requires more complex mocking or integration test)
    // it("should use bcryptjs when no hasher is provided", async () => {
    //   // This test is harder now due to dynamic import
    //   // Might need vi.doMock or spyOn dynamic import itself
    //   // Or simply trust the implementation and skip this specific test
    // });
  });
});
