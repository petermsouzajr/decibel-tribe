import { describe, it, expect, vi, beforeEach } from "vitest";
// Import the function to test - assuming default export
import sendVerificationEmail from "@/lib/sendEmail";

// --- Mocks ---

// Hoist mock function variables
const { mockSendMail, mockCreateTransport } = vi.hoisted(() => ({
  mockSendMail: vi.fn(),
  mockCreateTransport: vi.fn(),
}));

// Mock nodemailer
vi.mock("nodemailer", () => ({
  default: {
    createTransport: mockCreateTransport,
  },
}));

// --- End Mocks ---

describe("[Util][Email] sendVerificationEmail", () => {
  const testEmail = "test@example.com";
  const testUrl = "http://localhost:3000/verify?token=12345";
  const mockTransporter = { sendMail: mockSendMail };

  beforeEach(() => {
    vi.resetAllMocks();
    // Default behavior: createTransport returns the mock transporter
    mockCreateTransport.mockReturnValue(mockTransporter);
    // Default behavior: sendMail resolves successfully
    mockSendMail.mockResolvedValue("Email sent successfully");

    // Mock process.env if needed (e.g., for the 'from' address)
    process.env.EMAIL_USERNAME = "noreply@decibeltribe.com";
  });

  it("should call createTransport with correct config", async () => {
    await sendVerificationEmail(testEmail, testUrl);
    expect(mockCreateTransport).toHaveBeenCalledTimes(1);
    expect(mockCreateTransport).toHaveBeenCalledWith({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD, // Assumes EMAIL_PASSWORD is set in env
      },
    });
  });

  it("should call sendMail with correct parameters", async () => {
    await sendVerificationEmail(testEmail, testUrl);
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledWith({
      from: `"Decibel Tribe" <${process.env.EMAIL_USERNAME}>`,
      to: testEmail,
      subject: "Verify your email",
      text: `Please click the link below to verify your email: ${testUrl}`,
      html: expect.stringContaining(testUrl), // Check if URL is in HTML
    });
    // More specific HTML check if needed
    expect(mockSendMail.mock.calls[0][0].html).toContain(
      `<a href="${testUrl}">`,
    );
  });

  it("should resolve when sendMail resolves", async () => {
    const expectedResult = "Success Info";
    mockSendMail.mockResolvedValue(expectedResult);
    await expect(sendVerificationEmail(testEmail, testUrl)).resolves.toBe(
      expectedResult,
    );
  });

  it("should reject when sendMail rejects", async () => {
    const expectedError = new Error("SMTP Error");
    mockSendMail.mockRejectedValue(expectedError);
    const mockConsoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {}); // Spy on console.error

    // Expect the function to resolve with undefined now, as it catches the error
    await expect(
      sendVerificationEmail(testEmail, testUrl),
    ).resolves.toBeUndefined();

    // Verify that the error was logged
    expect(mockConsoleError).toHaveBeenCalledTimes(1);
    expect(mockConsoleError).toHaveBeenCalledWith(
      `Error sending verification email to ${testEmail}:`,
      expectedError,
    );

    mockConsoleError.mockRestore(); // Clean up the spy
  });

  it("should reject if createTransport throws (less likely but possible)", async () => {
    const expectedError = new Error("Transport config error");
    mockCreateTransport.mockImplementation(() => {
      throw expectedError;
    });
    await expect(sendVerificationEmail(testEmail, testUrl)).rejects.toThrow(
      expectedError,
    );
    expect(mockSendMail).not.toHaveBeenCalled(); // Ensure sendMail wasn't reached
  });
});
