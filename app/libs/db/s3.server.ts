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

export async function sendBufferToPublicImage({
  key,
  body,
  contentType,
}: { key: string; body: Buffer; contentType: string }) {
  const bucket = "onat-public-image";
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
