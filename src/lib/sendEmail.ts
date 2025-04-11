import nodemailer, { SendMailOptions } from "nodemailer";

export default async function sendVerificationEmail(
  to: string,
  verificationUrl: string,
) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions: SendMailOptions = {
    from: `"Decibel Tribe" <${process.env.EMAIL_USERNAME}>`,
    to,
    subject: "Verify your email",
    text: `Please click the link below to verify your email: ${verificationUrl}`,
    html: `
      <p>Please click the link below to verify your email:</p>
      <a href="${verificationUrl}">Verify Email</a>
    `,
  };

  // Add try...catch for better error logging
  try {
    // Return the result of sendMail on success
    const result = await transporter.sendMail(mailOptions);
    console.log(`Verification email sent successfully to ${to}`);
    return result;
  } catch (error) {
    console.error(`Error sending verification email to ${to}:`, error);
    // Optionally re-throw the error if the calling function needs to know
    throw error;
  }
}
