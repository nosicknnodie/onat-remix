import CryptoJS from "crypto-js";

const secretKey = process.env.SECRET_KEY!;
if (!secretKey) {
  throw new Error("SECRET_KEY is not defined");
}

// 암호화
function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, secretKey).toString();
}

// 복호화
function decrypt(encryptedText: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedText, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export const AES = {
  encrypt,
  decrypt,
};
