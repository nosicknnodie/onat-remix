import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

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

export async function sendPublicImage(file: File) {
  const bucket = "onat-public-image";
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: file.name,
    Body: buffer,
    ContentType: file.type,
  });
  await s3.send(command);
  const publicURl = `https://minio-api.onsoa.net/${bucket}/${file.name}`;
  return publicURl;
}
