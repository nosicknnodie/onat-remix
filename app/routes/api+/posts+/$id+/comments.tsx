import { ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";
import { generateShortId } from "~/libs/id";
import { parseRequestData } from "~/libs/requestData";

// POST /api/posts/$id/comments
export async function action({ params, request }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) return Response.json({ success: false }, { status: 401 });
  const postId = params.id as string;
  const data = await parseRequestData(request);
  const { parentId, content } = data;

  try {
    // indexId create
    const indexId = generateShortId(); // base36 + 랜덤 조합

    // get parent
    const parent = parentId
      ? await prisma.postComment.findUnique({ where: { id: parentId } })
      : null;

    const depth = parent ? parent.depth + 1 : 0;
    const path = parent ? `${parent.path}.${indexId}` : indexId;

    const comment = await prisma.postComment.create({
      data: {
        postId,
        authorId: user.id,
        parentId,
        indexId,
        path,
        depth,
        content,
      },
    });

    return Response.json({ success: true, comment });
  } catch (error) {
    console.error(error);
    return Response.json(
      { success: false, errors: "Internal Server Error" },
      { status: 500 }
    );
  }
}
