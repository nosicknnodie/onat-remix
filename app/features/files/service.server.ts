import fs from "node:fs/promises";
import type { FilePurposeType } from "@prisma/client";
import type { NodeOnDiskFile } from "@remix-run/node/dist/upload/fileUploadHandler";
import sharp from "sharp";
import slugify from "slugify";
import { prisma } from "~/libs/db/db.server";
import { sendBufferToPublicImage } from "~/libs/db/s3.server";

export async function saveImageFromNodeFile(input: {
  nodeFile: NodeOnDiskFile;
  userId: string;
  purpose: FilePurposeType;
}) {
  const { nodeFile, userId, purpose } = input;
  const ext = "webp";
  const baseName = nodeFile.name?.replace(/\.[^/.]+$/, "") || "image";
  const safeName = slugify(baseName, { lower: true, strict: true });

  const fileBuffer = await fs.readFile(nodeFile.getFilePath());
  const webpBuffer = await sharp(fileBuffer).webp({ quality: 80 }).toBuffer();

  const filename = `${safeName}.${ext}`;
  const key = `user/${userId}/${Date.now()}_${filename}`;
  const publicUrl = await sendBufferToPublicImage({
    key,
    body: webpBuffer,
    contentType: "image/webp",
  });

  return prisma.file.create({
    data: {
      url: publicUrl,
      key,
      uploaderId: userId,
      mimeType: ext,
      size: webpBuffer.length,
      purpose,
    },
  });
}
