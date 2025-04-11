import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  type MockedFunction,
} from "vitest";
import prisma from "@/lib/prisma";
import { signUp } from "@/app/(auth)/signup/actions";
import { signUpSchema, SignUpValues } from "@/lib/validation";
import { generateIdFromEntropySize } from "lucia";
import bcrypt from "bcryptjs";
import { generateAndSendVerification } from "@/app/(auth)/sendVerification";
import { isRedirectError } from "next/dist/client/components/redirect";

// --- Mock Definitions ---
// Define explicit types for mocks
type MockPrismaFindFirst = MockedFunction<typeof prisma.user.findFirst>;
type MockSignUpSchemaParse = MockedFunction<typeof signUpSchema.parse>;
type MockGenerateId = MockedFunction<typeof generateIdFromEntropySize>;
type MockBcryptHash = MockedFunction<typeof bcrypt.hash>;
type MockSendVerification = MockedFunction<typeof generateAndSendVerification>;
type MockIsRedirectError = MockedFunction<typeof isRedirectError>;

// --- Mock Implementations ---
vi.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    user: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/validation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/validation")>();
  return {
    ...actual, // Keep actual Zod object and other exports
    signUpSchema: {
      ...actual.signUpSchema,
      parse: vi.fn(), // Mock only the parse method
    },
  };
});

vi.mock("lucia", () => ({
  generateIdFromEntropySize: vi.fn(),
}));

// Correct bcryptjs mock with a factory exporting the mocked function
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(), // Mock the hash function specifically
  },
}));

vi.mock("@/app/(auth)/sendVerification", () => ({
  generateAndSendVerification: vi.fn(),
}));

vi.mock("next/dist/client/components/redirect", () => ({
  isRedirectError: vi.fn(),
}));

// Unskip the describe block
describe("[Core][Action] Signup Action", () => {
  // Use defined types for mock instances
  let mockPrismaFindFirst: MockPrismaFindFirst;
  let mockSignUpSchemaParse: MockSignUpSchemaParse;
  let mockGenerateId: MockGenerateId;
  let mockBcryptHash: MockBcryptHash;
  let mockSendVerification: MockSendVerification;
  let mockIsRedirectError: MockIsRedirectError;

  const mockCredentials: SignUpValues = {
    // Use SignUpValues type
    username: "testuser",
    email: "testuser@example.com",
    password: "password123",
  };
  // Renamed to avoid conflict and use type
  const mockCredentialsExistingEmail: SignUpValues = {
    username: "testuser2",
    email: "testuser@example.com",
    password: "password123",
  };
  const mockUserId = "user-id";
  const mockPasswordHash = "hashedpassword";

  beforeEach(() => {
    // Reset mocks and assign typed mocks
    vi.clearAllMocks();
    mockPrismaFindFirst = vi.mocked(prisma.user.findFirst);
    mockSignUpSchemaParse = vi.mocked(signUpSchema.parse);
    mockGenerateId = vi.mocked(generateIdFromEntropySize);
    // Access the mocked hash function correctly
    mockBcryptHash = vi.mocked(bcrypt.hash) as MockBcryptHash;
    mockSendVerification = vi.mocked(generateAndSendVerification);
    mockIsRedirectError = vi.mocked(isRedirectError);

    // Default mocks for successful path (can be overridden in specific tests)
    mockSignUpSchemaParse.mockReturnValue(mockCredentials); // Default valid parse
    mockPrismaFindFirst.mockResolvedValue(null); // Default: user/email not found
    mockGenerateId.mockReturnValue(mockUserId); // Default user ID
    mockBcryptHash.mockResolvedValue(mockPasswordHash); // Default hash
    mockSendVerification.mockResolvedValue({ success: true }); // Default success
    mockIsRedirectError.mockReturnValue(false); // Default not a redirect error
  });

  it("should validate the input credentials", async () => {
    // Arrange: Mock parse to return specific value for this test
    mockSignUpSchemaParse.mockReturnValue(mockCredentials);

    // Act
    await signUp(mockCredentials);

    // Assert
    expect(mockSignUpSchemaParse).toHaveBeenCalledWith(mockCredentials);
  });

  it("should return an error if the username is already taken", async () => {
    // Arrange
    mockSignUpSchemaParse.mockReturnValue(mockCredentials);
    // First findFirst call (for username) should return an existing user
    mockPrismaFindFirst.mockResolvedValueOnce({
      id: "existing-user-id",
    } as any);

    // Act
    const result = await signUp(mockCredentials);

    // Assert
    expect(mockPrismaFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          username: { equals: mockCredentials.username, mode: "insensitive" },
        },
      }),
    );
    expect(result).toEqual({ error: "Username already taken" });
  });

  it("should return an error if the email is already registered", async () => {
    // Arrange
    mockSignUpSchemaParse.mockReturnValue(mockCredentialsExistingEmail);
    // First findFirst (username) returns null, second (email) returns existing user
    mockPrismaFindFirst
      .mockResolvedValueOnce(null) // Username check passes
      .mockResolvedValueOnce({ id: "existing-user-id" } as any); // Email check finds user

    // Act
    const result = await signUp(mockCredentialsExistingEmail);

    // Assert
    expect(mockPrismaFindFirst).toHaveBeenCalledTimes(2);
    expect(mockPrismaFindFirst).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: {
          username: {
            equals: mockCredentialsExistingEmail.username,
            mode: "insensitive",
          },
        },
      }),
    );
    expect(mockPrismaFindFirst).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: {
          email: {
            equals: mockCredentialsExistingEmail.email,
            mode: "insensitive",
          },
        },
      }),
    );
    expect(result).toEqual({ error: "Email already registered" });
  });

  it("should hash the password and generate a user ID", async () => {
    // Arrange (Defaults are mostly fine)
    mockSignUpSchemaParse.mockReturnValue(mockCredentials);
    mockGenerateId.mockReturnValue(mockUserId);
    mockBcryptHash.mockResolvedValue(mockPasswordHash);

    // Act
    await signUp(mockCredentials);

    // Assert
    expect(mockGenerateId).toHaveBeenCalledWith(10);
    expect(mockBcryptHash).toHaveBeenCalledWith(mockCredentials.password, 10); // Check hash args
  });

  it("should generate and send a verification email with correct args", async () => {
    // Arrange (Defaults are mostly fine)
    mockSignUpSchemaParse.mockReturnValue(mockCredentials);
    mockGenerateId.mockReturnValue(mockUserId);
    mockBcryptHash.mockResolvedValue(mockPasswordHash);

    // Act
    await signUp(mockCredentials);

    // Assert
    // Expect generateAndSendVerification to be called with the correct arguments
    expect(mockSendVerification).toHaveBeenCalledWith(
      mockUserId,
      mockCredentials.username,
      mockCredentials.email,
      mockPasswordHash, // Ensure the *hashed* password is passed
    );
  });

  it("should return success on successful signup", async () => {
    // Arrange (Defaults handle the success case)
    mockSignUpSchemaParse.mockReturnValue(mockCredentials);
    mockPrismaFindFirst.mockResolvedValue(null);
    mockGenerateId.mockReturnValue(mockUserId);
    mockBcryptHash.mockResolvedValue(mockPasswordHash);
    mockSendVerification.mockResolvedValue({ success: true });

    // Act
    const result = await signUp(mockCredentials);

    // Assert
    expect(result).toEqual({ success: true });
  });

  it("should handle unexpected errors during validation", async () => {
    // Arrange
    const validationError = new Error("Invalid data");
    mockSignUpSchemaParse.mockImplementation(() => {
      throw validationError;
    });
    mockIsRedirectError.mockReturnValue(false); // Ensure it's not treated as redirect

    // Act
    const result = await signUp(mockCredentials);

    // Assert
    expect(result).toEqual({
      error: "Something went wrong. Please try again.",
    });
    expect(mockIsRedirectError).toHaveBeenCalledWith(validationError);
  });

  it("should handle unexpected errors during database check", async () => {
    // Arrange
    const dbError = new Error("DB connection failed");
    mockSignUpSchemaParse.mockReturnValue(mockCredentials);
    mockPrismaFindFirst.mockRejectedValue(dbError);
    mockIsRedirectError.mockReturnValue(false);

    // Act
    const result = await signUp(mockCredentials);

    // Assert
    expect(result).toEqual({
      error: "Something went wrong. Please try again.",
    });
    expect(mockIsRedirectError).toHaveBeenCalledWith(dbError);
  });

  it("should rethrow redirect errors", async () => {
    // Arrange
    const redirectError = new Error("Redirect error");
    mockSignUpSchemaParse.mockImplementation(() => {
      throw redirectError;
    });
    mockIsRedirectError.mockReturnValue(true);

    // Act & Assert
    await expect(signUp(mockCredentials)).rejects.toThrow(redirectError);
    expect(mockIsRedirectError).toHaveBeenCalledWith(redirectError);
  });
});
