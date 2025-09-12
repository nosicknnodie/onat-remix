import type { FilePurposeType } from "@prisma/client";
import {
  type ActionFunction,
  type LoaderFunction,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import {
  createFileUploadHandler,
  type NodeOnDiskFile,
} from "@remix-run/node/dist/upload/fileUploadHandler";
import { files } from "~/features/index.server";
import { getUser } from "~/libs/index.server";

export const loader: LoaderFunction = async () => {
  // 필요 시 GET presigned URL도 여기서 처리 가능
  return Response.json({});
};

export const action: ActionFunction = async ({ request }) => {
  const user = await getUser(request);
  if (!user)
    return Response.json(
      { ok: false, message: "Unauthorized", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  const uploadHandler = createFileUploadHandler({
    maxPartSize: 25_000_000, // 25MB
    file: ({ filename }) => filename,
  });

  const formData = await unstable_parseMultipartFormData(request, uploadHandler);
  const file = formData.get("file");
  const purpose = (formData.get("purpose") as FilePurposeType) || "PROFILE";
  if (!file || typeof file === "string")
    return Response.json(
      { ok: false, message: "파일 없음", code: "VALIDATION", fieldErrors: { file: ["required"] } },
      { status: 422 },
    );
  const nodeFile = file as unknown as NodeOnDiskFile;
  const saved = await files.service.saveImageFromNodeFile({
    nodeFile,
    userId: user.id,
    purpose,
  });
  return Response.json({ ok: true, data: saved, ...saved });
};
