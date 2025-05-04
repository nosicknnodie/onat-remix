// routes/upload.tsx
import {
  type ActionFunction,
  type LoaderFunction,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import { createFileUploadHandler } from "@remix-run/node/dist/upload/fileUploadHandler";
// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
import fs from "fs/promises";
import sharp from "sharp";
import { getUser } from "~/libs/db/lucia.server";
import { sendPublicImage } from "~/libs/db/s3.server";

export const loader: LoaderFunction = async () => {
  // 필요 시 GET presigned URL도 여기서 처리 가능
  return Response.json({});
};

export const action: ActionFunction = async ({ request }) => {
  const user = await getUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const uploadHandler = createFileUploadHandler({
    maxPartSize: 10_000_000, // 10MB
    file: ({ filename }) => filename,
  });

  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler
  );
  const file = formData.get("file");
  if (!file || typeof file === "string")
    return Response.json({ error: "파일 없음" }, { status: 400 });

  if ("filepath" in file) {
    const fileBuffer = await fs.readFile(file.filepath as string);
    const webpBuffer = await sharp(fileBuffer).webp({ quality: 80 }).toBuffer();
    const publicUrl = await sendPublicImage(webpBuffer);
    // const res = await prisma.file.create({
    //   data: {
    //     url: publicUrl,
    //     userId: user.id,
    //   },
    // })
    return Response.json({ publicUrl });
  }

  const publicUrl = await sendPublicImage(file);
  return Response.json({ publicUrl });
};
