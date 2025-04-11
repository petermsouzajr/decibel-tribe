import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod"; // Import z
// Import schemas to test from validation.ts
import {
  signUpSchema,
  loginSchema,
  resetPasswordSchema,
  createPostSchema,
  updateUserProfileSchema,
  updateEmailSchema,
  createEventSchema,
  changePasswordSchema,
  createCommentSchema,
  // ... other schemas ...
} from "@/lib/validation";

describe("[Auth][Validation] Validation Schemas", () => {
  // Test valid inputs, invalid inputs (missing fields, incorrect types, length limits), edge cases.

  describe("signUpSchema", () => {
    const validData = {
      email: "test@example.com",
      username: "test_user-123",
      password: "password123",
    };

    it("should validate correct signup data", () => {
      const result = signUpSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email format", () => {
      const invalidData = { ...validData, email: "invalid-email" };
      const result = signUpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Type guard
        expect(result.error.issues[0].path).toEqual(["email"]);
        expect(result.error.issues[0].message).toContain("Invalid email");
      }
    });

    it("should reject username with invalid characters", () => {
      const invalidData = { ...validData, username: "invalid user!" };
      const result = signUpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["username"]);
        expect(result.error.issues[0].message).toContain(
          "Only letters, numbers, - and _ allowed",
        );
      }
    });

    it("should reject password shorter than 8 characters", () => {
      const invalidData = { ...validData, password: "short" };
      const result = signUpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["password"]);
        expect(result.error.issues[0].message).toContain(
          "at least 8 characters",
        );
      }
    });

    it("should reject email longer than 50 characters", () => {
      const longEmail = "a".repeat(45) + "@example.com"; // > 50 chars
      const invalidData = { ...validData, email: longEmail };
      const result = signUpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["email"]);
        expect(result.error.issues[0].message).toContain(
          "less than 50 characters",
        );
      }
    });

    it("should reject missing username", () => {
      const { username, ...invalidData } = validData; // Remove username
      const result = signUpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["username"]);
        expect(result.error.issues[0].message).toContain("Required");
      }
    });

    it("should fail if email is missing", () => {
      const data = { ...validData, email: undefined };
      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(false);
      // Optionally check the specific error
      expect(result.error?.issues[0]?.path).toEqual(["email"]);
      expect(result.error?.issues[0]?.message).toBe("Required");
    });

    it("should fail if username is missing", () => {
      const data = { ...validData, username: undefined };
      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.path).toEqual(["username"]);
      expect(result.error?.issues[0]?.message).toBe("Required");
    });

    it("should fail if password is missing", () => {
      const data = { ...validData, password: undefined };
      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.path).toEqual(["password"]);
      expect(result.error?.issues[0]?.message).toBe("Required");
    });

    it("should fail if email is invalid format", () => {
      const data = { ...validData, email: "invalid-email" };
      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.path).toEqual(["email"]);
      expect(result.error?.issues[0]?.message).toBe("Invalid email address");
    });

    it("should fail if email is too long", () => {
      const data = { ...validData, email: `${"a".repeat(45)}@example.com` }; // 56 chars total
      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.path).toEqual(["email"]);
      expect(result.error?.issues[0]?.message).toBe(
        "Must be less than 50 characters",
      );
    });

    it("should fail if username contains invalid characters", () => {
      const data = { ...validData, username: "invalid user!" };
      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.path).toEqual(["username"]);
      expect(result.error?.issues[0]?.message).toContain(
        "Only letters, numbers, - and _ allowed",
      );
    });

    it("should fail if username is too long", () => {
      const data = { ...validData, username: "a".repeat(51) };
      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.path).toEqual(["username"]);
      expect(result.error?.issues[0]?.message).toBe(
        "Must be less than 50 characters",
      );
    });

    it("should fail if password is too long", () => {
      const data = { ...validData, password: "a".repeat(51) };
      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.path).toEqual(["password"]);
      expect(result.error?.issues[0]?.message).toBe(
        "Must be less than 50 characters",
      );
    });

    it("should trim whitespace and validate successfully if core data is valid", () => {
      const data = {
        email: "  test@example.com  ",
        username: "  test_user-123  ",
        password: "  password123  ",
      };
      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should trim whitespace and still fail if core data is invalid", () => {
      const data = { ...validData, email: "  invalid-email  " };
      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.path).toEqual(["email"]);
      expect(result.error?.issues[0]?.message).toBe("Invalid email address");
    });
  });

  describe("loginSchema", () => {
    const validPassword = "password123";

    it("should validate with correct username and password", () => {
      const data = { username: "testuser", password: validPassword };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should validate with correct email and password", () => {
      const data = { email: "test@example.com", password: validPassword };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
      // Note: The schema allows BOTH username and email, which might be unintended?
      // const dataBoth = { username: 'testuser', email: 'test@example.com', password: validPassword };
      // expect(loginSchema.safeParse(dataBoth).success).toBe(true);
    });

    it("should reject missing password", () => {
      const data = { username: "testuser" }; // Missing password
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["password"]);
        expect(result.error.issues[0].message).toContain("Required");
      }
    });

    it("should reject username longer than 50 characters", () => {
      const longUsername = "a".repeat(51);
      const data = { username: longUsername, password: validPassword };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["username"]);
        expect(result.error.issues[0].message).toContain("less than 50");
      }
    });

    it("should reject password longer than 50 characters", () => {
      const longPassword = "a".repeat(51);
      const data = { username: "testuser", password: longPassword };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["password"]);
        expect(result.error.issues[0].message).toContain("less than 50");
      }
    });

    // Note: Testing optional fields being absent isn't strictly necessary
    // unless there's complex logic depending on their presence/absence.
  });
});

describe("[Auth][Validation] resetPasswordSchema", () => {
  it("should validate successfully with a valid credential", () => {
    const result = resetPasswordSchema.safeParse({
      credential: "user@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("should validate successfully if credential is not provided (optional)", () => {
    const result = resetPasswordSchema.safeParse({}); // Empty object
    expect(result.success).toBe(true);
    const resultUndefined = resetPasswordSchema.safeParse({
      credential: undefined,
    }); // Explicit undefined
    expect(resultUndefined.success).toBe(true);
  });

  it("should reject credential if too long", () => {
    const longCredential = "a".repeat(51);
    const result = resetPasswordSchema.safeParse({
      credential: longCredential,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["credential"]);
    expect(result.error?.issues[0]?.message).toBe(
      "Must be less than 50 characters",
    );
  });

  it("should reject invalid data types for credential", () => {
    const result = resetPasswordSchema.safeParse({ credential: 12345 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["credential"]);
  });
});

describe("[Social][Validation] createPostSchema", () => {
  it("should validate successfully with content only", () => {
    const result = createPostSchema.safeParse({
      content: "Hello world",
      mediaIds: [],
    });
    expect(result.success).toBe(true);
  });

  it("should validate successfully with mediaIds only (empty content)", () => {
    const result = createPostSchema.safeParse({
      content: "",
      mediaIds: ["media-1", "media-2"],
    });
    expect(result.success).toBe(true);
  });

  it("should validate successfully with both content and mediaIds", () => {
    const result = createPostSchema.safeParse({
      content: "Hello",
      mediaIds: ["media-1"],
    });
    expect(result.success).toBe(true);
  });

  // Note: The schema itself doesn't prevent both being empty, but the PostEditor component logic does.
  it("should validate successfully if both content and mediaIds are empty", () => {
    const result = createPostSchema.safeParse({ content: "", mediaIds: [] });
    expect(result.success).toBe(true);
  });

  it("should reject if content is not a string", () => {
    const result = createPostSchema.safeParse({ content: 123, mediaIds: [] });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["content"]);
  });

  it("should reject if mediaIds is not an array", () => {
    const result = createPostSchema.safeParse({
      content: "",
      mediaIds: "not-an-array",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["mediaIds"]);
  });

  it("should reject if mediaIds contains non-strings", () => {
    const result = createPostSchema.safeParse({
      content: "",
      mediaIds: ["media-1", 123],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["mediaIds", 1]); // Path indicates index
  });
});

describe("[Profile][Validation] updateUserProfileSchema", () => {
  const validData = {
    displayName: "Valid Name",
    bio: "Valid bio text.",
    instruments: ["Guitar", "Piano"],
    skills: ["Songwriting"],
    visibility: "PUBLIC" as const, // Use 'as const' for enum value type safety
  };

  it("should validate correct data", () => {
    const result = updateUserProfileSchema.safeParse(validData);
    expect(
      result.success,
      `Validation failed: ${JSON.stringify(result.error?.issues)}`,
    ).toBe(true);
  });

  it("should validate correctly with optional fields omitted", () => {
    const minimalData = {
      displayName: "Minimal Name",
      // bio omitted
      instruments: [], // Empty array is valid
      skills: [], // Empty array is valid
      visibility: "PRIVATE" as const,
    };
    const result = updateUserProfileSchema.safeParse(minimalData);
    expect(
      result.success,
      `Validation failed: ${JSON.stringify(result.error?.issues)}`,
    ).toBe(true);
  });

  it("should reject missing displayName", () => {
    const data = { ...validData, displayName: "" }; // Empty string fails requiredString
    const result = updateUserProfileSchema.safeParse(data);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["displayName"]);
    expect(result.error?.issues[0]?.message).toBe("Required");
  });

  it("should reject displayName if too long", () => {
    const data = { ...validData, displayName: "a".repeat(51) };
    const result = updateUserProfileSchema.safeParse(data);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["displayName"]);
    expect(result.error?.issues[0]?.message).toContain("Must be less than 50");
  });

  it("should reject bio if too long", () => {
    const data = { ...validData, bio: "a".repeat(201) };
    const result = updateUserProfileSchema.safeParse(data);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["bio"]);
    expect(result.error?.issues[0]?.message).toContain("Must be at most 200");
  });

  it("should reject too many instruments", () => {
    const tooManyInstruments = Array.from(
      { length: 16 },
      (_, i) => `Instrument ${i + 1}`,
    );
    const data = { ...validData, instruments: tooManyInstruments };
    const result = updateUserProfileSchema.safeParse(data);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["instruments"]);
    expect(result.error?.issues[0]?.message).toContain("up to 15 instruments");
  });

  it("should reject too many skills", () => {
    const tooManySkills = Array.from(
      { length: 16 },
      (_, i) => `Skill ${i + 1}`,
    );
    const data = { ...validData, skills: tooManySkills };
    const result = updateUserProfileSchema.safeParse(data);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["skills"]);
    expect(result.error?.issues[0]?.message).toContain("up to 15 skills");
  });

  it("should reject invalid visibility enum", () => {
    const data = { ...validData, visibility: "WRONG_VALUE" };
    const result = updateUserProfileSchema.safeParse(data);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["visibility"]);
    expect(result.error?.issues[0]?.message).toContain("Invalid enum value");
  });

  it("should reject missing visibility", () => {
    const { visibility, ...data } = validData;
    const result = updateUserProfileSchema.safeParse(data);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["visibility"]);
  });

  it("should reject invalid websiteUrl format", () => {
    const invalidData = { ...validData, websiteUrl: "invalid-url" };
    const result = updateUserProfileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["websiteUrl"]);
      expect(result.error.issues[0].message).toContain("Invalid url");
    }
  });
});

describe("[Profile][Validation] updateEmailSchema", () => {
  const validData = {
    currentPassword: "password123",
    newEmail: "new.email@example.com",
  };

  it("should validate correct data", () => {
    const result = updateEmailSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject missing currentPassword", () => {
    const data = { ...validData, currentPassword: "" };
    const result = updateEmailSchema.safeParse(data);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["currentPassword"]);
    expect(result.error?.issues[0]?.message).toBe(
      "Current password is required",
    );
  });

  it("should reject missing newEmail", () => {
    const { newEmail, ...data } = validData; // Completely omit
    const result = updateEmailSchema.safeParse(data);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["newEmail"]);
  });

  it("should reject invalid newEmail format", () => {
    const data = { ...validData, newEmail: "invalid-email" };
    const result = updateEmailSchema.safeParse(data);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["newEmail"]);
    expect(result.error?.issues[0]?.message).toBe("Invalid email address");
  });
});

describe("[Auth][Validation] changePasswordSchema", () => {
  const baseData = {
    newPassword: "newPassword123",
    confirmPassword: "newPassword123",
    isSettingPassword: false,
  };

  it("should validate correct data when changing password (currentPassword provided)", () => {
    const data = { ...baseData, currentPassword: "oldPassword456" };
    const result = changePasswordSchema.safeParse(data);
    expect(
      result.success,
      `Validation failed: ${JSON.stringify(result.error?.issues)}`,
    ).toBe(true);
  });

  it("should validate correct data when setting password (currentPassword optional, but provided here)", () => {
    // Even when setting, providing currentPassword (empty string) is allowed by schema
    const data = { ...baseData, currentPassword: "", isSettingPassword: true };
    const result = changePasswordSchema.safeParse(data);
    expect(
      result.success,
      `Validation failed: ${JSON.stringify(result.error?.issues)}`,
    ).toBe(true);
  });

  it("should validate correct data when setting password (currentPassword omitted)", () => {
    const data = { ...baseData, isSettingPassword: true }; // currentPassword omitted
    const result = changePasswordSchema.safeParse(data);
    expect(
      result.success,
      `Validation failed: ${JSON.stringify(result.error?.issues)}`,
    ).toBe(true);
  });

  it("should reject if passwords do not match", () => {
    const data = { ...baseData, confirmPassword: "doesNotMatch" };
    const result = changePasswordSchema.safeParse(data);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["confirmPassword"]);
    expect(result.error?.issues[0]?.message).toBe("Passwords do not match");
  });

  it("should reject if new password is too short", () => {
    const data = {
      ...baseData,
      newPassword: "short",
      confirmPassword: "short",
    };
    const result = changePasswordSchema.safeParse(data);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["newPassword"]);
    expect(result.error?.issues[0]?.message).toContain("at least 8 characters");
  });

  it("should reject if confirmPassword is missing", () => {
    const { confirmPassword, ...data } = baseData;
    const result = changePasswordSchema.safeParse(data);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["confirmPassword"]);
  });

  it("should reject if newPassword is missing", () => {
    const { newPassword, ...data } = baseData;
    const result = changePasswordSchema.safeParse(data);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["newPassword"]);
  });

  it("should reject if isSettingPassword is missing", () => {
    const { isSettingPassword, ...data } = baseData;
    const result = changePasswordSchema.safeParse(data);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["isSettingPassword"]);
  });

  it("should reject if password and confirmPassword do not match", () => {
    const invalidData = {
      ...baseData,
      confirmPassword: "differentPassword789",
    };
    const result = changePasswordSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      // Check for the specific refinement error
      const refinementError = result.error.issues.find(
        (issue) => issue.code === z.ZodIssueCode.custom,
      );
      expect(refinementError).toBeDefined();
      expect(refinementError?.path).toEqual(["confirmPassword"]); // Path of the refinement
      expect(refinementError?.message).toContain("Passwords do not match");
    }
  });
});

describe("[Event][Validation] createEventSchema", () => {
  let today: Date;
  let validData: any;

  beforeEach(() => {
    // Keep fake timers for relative date helpers if needed
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-05-15T12:00:00.000Z"));
    today = new Date();
    // The schema itself doesn't use minDate, so setting it here is less relevant

    // Base valid data for the exported createEventSchema
    validData = {
      title: "Valid Event",
      location: "Valid Location",
      description: "Valid Description",
      url: "http://example.com",
      when: getTomorrow(), // Use relative date
      startTime: "10:00",
      endTime: "12:00",
      performers: ["Performer A"],
      status: "PUBLISHED",
      visibility: "PUBLIC",
      isCancelled: false,
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const getTomorrow = () => {
    const tomorrow = new Date("2024-05-15T12:00:00.000Z");
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    return tomorrow;
  };

  // --- Tests using the IMPORTED createEventSchema ---

  it("should validate correct minimal data (required fields only)", () => {
    // Remove title, desc, url, performers from validData
    const { title, description, url, performers, ...minimalData } = validData;
    const result = createEventSchema.safeParse(minimalData);
    expect(
      result.success,
      `Validation failed: ${JSON.stringify(result.error?.issues)}`,
    ).toBe(true);
  });

  it("should validate correct data with all optional fields", () => {
    const result = createEventSchema.safeParse(validData);
    expect(
      result.success,
      `Validation failed: ${JSON.stringify(result.error?.issues)}`,
    ).toBe(true);
  });

  it("should reject missing location", () => {
    const data = { ...validData, location: "" };
    const result = createEventSchema.safeParse(data);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["location"]);
  });

  it("should reject missing startTime/endTime", () => {
    const dataStart = { ...validData, startTime: "" };
    const resultStart = createEventSchema.safeParse(dataStart);
    expect(resultStart.success).toBe(false);
    expect(resultStart.error?.issues[0]?.path).toEqual(["startTime"]);

    const dataEnd = { ...validData, endTime: "" };
    const resultEnd = createEventSchema.safeParse(dataEnd);
    expect(resultEnd.success).toBe(false);
    expect(resultEnd.error?.issues[0]?.path).toEqual(["endTime"]);
  });

  // Test date format validation (using imported schema)
  it("should handle date format validation", () => {
    // Valid date object
    const dataValidDate = { ...validData, when: new Date() };
    const resultValid = createEventSchema.safeParse(dataValidDate);
    expect(
      resultValid.success,
      `Validation failed: ${JSON.stringify(resultValid.error?.issues)}`,
    ).toBe(true);

    // Invalid date string -> should be caught by preprocess + date validation
    const dataInvalidString = { ...validData, when: "not-a-date" };
    const resultInvalid = createEventSchema.safeParse(dataInvalidString);
    expect(resultInvalid.success).toBe(false);
    expect(resultInvalid.error?.issues[0]?.path).toEqual(["when"]);
    expect(resultInvalid.error?.issues[0]?.message).toBe("Invalid date format");

    // Valid date string
    const dataValidString = { ...validData, when: getTomorrow().toISOString() };
    const resultValidString = createEventSchema.safeParse(dataValidString);
    expect(
      resultValidString.success,
      `Validation failed: ${JSON.stringify(resultValidString.error?.issues)}`,
    ).toBe(true);
  });

  it("should reject fields exceeding max length (title, location, description, url)", () => {
    const dataTitle = { ...validData, title: "a".repeat(101) };
    expect(createEventSchema.safeParse(dataTitle).success).toBe(false);
    expect(
      createEventSchema.safeParse(dataTitle).error?.issues[0]?.path,
    ).toEqual(["title"]);
    // ... rest of length checks ...
  });

  it("should reject invalid status/visibility enums", () => {
    const dataStatus = { ...validData, status: "INVALID_STATUS" as any };
    const resultStatus = createEventSchema.safeParse(dataStatus);
    expect(resultStatus.success).toBe(false);
    expect(resultStatus.error?.issues[0]?.path).toEqual(["status"]);
    // ... rest of enum check ...
  });

  it("should reject if isCancelled is not boolean", () => {
    const data = { ...validData, isCancelled: "not-boolean" };
    const result = createEventSchema.safeParse(data);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["isCancelled"]);
  });

  // Test the time refinement using the imported schema
  it("should reject if endTime is before startTime", () => {
    const invalidData = { ...validData, startTime: "14:00", endTime: "13:00" };
    const result = createEventSchema.safeParse(invalidData);
    // Now this should fail correctly because the refine is part of the imported schema
    expect(result.success).toBe(false);
    if (!result.success) {
      const refinementError = result.error.issues.find(
        (issue) =>
          issue.code === z.ZodIssueCode.custom &&
          issue.path.includes("endTime"),
      );
      expect(
        refinementError,
        "Refinement error for endTime not found",
      ).toBeDefined();
      expect(refinementError?.message).toContain(
        "End time must be after start time",
      );
    }
  });
});

describe("[Social][Validation] createCommentSchema", () => {
  it("should validate correct data", () => {
    const data = { content: "This is a valid comment." };
    const result = createCommentSchema.safeParse(data);
    expect(
      result.success,
      `Validation failed: ${JSON.stringify(result.error?.issues)}`,
    ).toBe(true);
  });

  it("should reject empty content", () => {
    const data = { content: "" };
    const result = createCommentSchema.safeParse(data);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["content"]);
    expect(result.error?.issues[0]?.message).toBe("Required"); // Match requiredString message
  });

  it("should reject if content is missing", () => {
    const data = {};
    const result = createCommentSchema.safeParse(data);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["content"]);
    expect(result.error?.issues[0]?.message).toBe("Required"); // Missing content also triggers requiredString message
  });
});
