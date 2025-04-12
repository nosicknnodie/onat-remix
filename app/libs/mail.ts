import nodemailer from "nodemailer";

const domain = process.env.NEXT_PUBLIC_APP_URL;
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  // port: '587',
  secure: false,
  auth: {
    user: process.env.SMTP_ID,
    pass: process.env.SMTP_PW,
  },
  from: process.env.SMTP_ID,
});
export const sendTwoFactorTokenEmail = async (email: string, token: string) => {
  const res = await transporter.sendMail({
    to: email,
    subject: "2FA Code",
    html: `<p>Your 2FA code: ${token}</p>`,
  });
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${domain}/auth/new-password?token=${token}`;

  const res = await transporter.sendMail({
    to: email,
    subject: "Reset your password",
    html: `<p>Click <a href="${resetLink}">here</a> to reset password.</p>`,
  });
};

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${domain}/auth/new-verification?token=${token}`;

  const res = await transporter.sendMail({
    to: email,
    subject: "Confirm your email",
    html: `<p>Click <a href="${confirmLink}">here</a> to confirm email.</p>`,
  });
};
