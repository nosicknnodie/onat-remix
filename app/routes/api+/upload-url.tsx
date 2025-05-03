// routes/upload.tsx
import { type ActionFunction, type LoaderFunction } from "@remix-run/node";
import { sendPublicImage } from "~/libs/db/s3.server";

export const loader: LoaderFunction = async () => {
  // 필요 시 GET presigned URL도 여기서 처리 가능
  return Response.json({});
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) return Response.json({ error: "파일 없음" }, { status: 400 });
  const publicURl = await sendPublicImage(file);
  return Response.json({ publicURl });
};
