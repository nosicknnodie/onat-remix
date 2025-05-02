import nodemailer from "nodemailer";

// const domain = process.env.APP_URL;
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

export const sendPasswordResetEmail = async (email: string, token: string, url: string) => {
  const resetLink = `${url}/auth/new-password?token=${token}`;
  await transporter.sendMail({
    to: email,
    subject: "[두드림] 비밀번호 초기화 안내 메일입니다.",
    html: `<p>여기를 클릭해서 비밀번호를 변경 하실수 있습니다. <br />
     <a href="${resetLink}">여기를 클릭</a> </p>`,
  });
};

export const sendVerificationEmail = async (email: string, token: string, url: string) => {
  const confirmLink = `${url}/auth/new-verification?token=${token}`;
  await transporter.sendMail({
    to: email,
    subject: "[두드림] 회원가입 안내 메일입니다.",
    html: `<p>여기를 클릭하시면 회원가입을 완료하실수 있습니다. <a href="${confirmLink}">여기를 클릭</a></p>`,
  });
};
