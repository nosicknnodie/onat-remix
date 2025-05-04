import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import mime from "mime-types";

const s3 = new S3Client({
  region: "ap-northeast-2", // 개인서버라 의미없긴함.
  endpoint: "https://minio-api.onsoa.net", // MinIO 엔드포인트
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true,
});

// export async function getPresignedUploadUrl(filename: string, contentType: string) {
//   const command = new PutObjectCommand({
//     Bucket: "onat",
//     Key: filename,
//     ContentType: contentType,
//   });

//   return await getSignedUrl(s3, command, { expiresIn: 60 });
// }

export async function sendPublicImage(file: File | Buffer) {
  const bucket = "onat-public-image";
  let key: string;
  let body: Buffer;
  let contentType: string;

  if (Buffer.isBuffer(file)) {
    // 🔹 file이 변환된 이미지 Buffer일 경우
    const ext = mime.extension("image/webp") || "webp";
    key = `${Date.now()}.${ext}`;
    body = file;
    contentType = "image/webp";
  } else {
    // 🔹 file이 File-like 객체일 경우 (예: memoryStorage 사용 시)
    body = file as unknown as Buffer; // stream일 수도 있음
    key = file.name;
    contentType = file.type || "application/octet-stream";
  }
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3.send(command);
  const publicUrl = `https://minio-api.onsoa.net/${bucket}/${key}`;
  return publicUrl;
}
