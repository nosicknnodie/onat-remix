import { FilePurposeType } from "@prisma/client";
import { ActionFunctionArgs } from "@remix-run/node";
import sharp from "sharp";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";
import { sendBufferToPublicImage } from "~/libs/db/s3.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file || typeof file === "string")
    return Response.json({ error: "파일 없음" }, { status: 400 });

  const ext = "webp";
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const originalName = file.name || "image";
  const isWebp = originalName.toLowerCase().endsWith(".webp");
  const purpose =
    (formData.get("purpose") as FilePurposeType) || "COMMENT_IMAGE";
  const baseName = originalName.replace(/\.[^/.]+$/, "") || "image";
  const key = `user/${user.id}/${Date.now()}_${baseName}.${ext}`;
  const finalBuffer = isWebp
    ? buffer
    : await sharp(buffer).webp({ quality: 80 }).toBuffer();

  const publicUrl = await sendBufferToPublicImage({
    key: key,
    body: finalBuffer,
    contentType: "image/webp",
  });

  const res = await prisma.file.create({
    data: {
      url: publicUrl,
      key: key,
      uploaderId: user.id,
      mimeType: ext,
      size: finalBuffer.length,
      purpose: purpose,
      isTemp: true,
    },
  });
  return Response.json({ success: "success", ...res });
};
