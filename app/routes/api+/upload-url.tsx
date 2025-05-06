// routes/upload.tsx
import { FilePurposeType } from "@prisma/client";
import {
  type ActionFunction,
  type LoaderFunction,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import {
  NodeOnDiskFile,
  createFileUploadHandler,
} from "@remix-run/node/dist/upload/fileUploadHandler";
// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
import fs from "fs/promises";
import sharp from "sharp";
import slugify from "slugify";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";
import { sendBufferToPublicImage } from "~/libs/db/s3.server";

export const loader: LoaderFunction = async () => {
  // 필요 시 GET presigned URL도 여기서 처리 가능
  return Response.json({});
};

export const action: ActionFunction = async ({ request }) => {
  const user = await getUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const uploadHandler = createFileUploadHandler({
    maxPartSize: 25_000_000, // 25MB
    file: ({ filename }) => filename,
  });

  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler
  );
  const file = formData.get("file");
  const purpose = (formData.get("purpose") as FilePurposeType) || "PROFILE";
  if (!file || typeof file === "string")
    return Response.json({ error: "파일 없음" }, { status: 400 });
  const ext = "webp";
  const nodeFile = file as unknown as NodeOnDiskFile;
  const baseName = nodeFile.name?.replace(/\.[^/.]+$/, "") || "image";
  const safeName = slugify(baseName, { lower: true, strict: true });

  const fileBuffer = await fs.readFile(nodeFile.getFilePath());
  const webpBuffer = await sharp(fileBuffer).webp({ quality: 80 }).toBuffer();

  const filename = `${safeName}.${ext}`;
  const key = `user/${user.id}/${Date.now()}_${filename}`;
  const publicUrl = await sendBufferToPublicImage({
    key: key,
    body: webpBuffer,
    contentType: "image/webp",
  });
  const res = await prisma.file.create({
    data: {
      url: publicUrl,
      uploaderId: user.id,
      mimeType: ext,
      size: webpBuffer.length,
      purpose: purpose,
    },
  });

  return Response.json({ ...res });
};
