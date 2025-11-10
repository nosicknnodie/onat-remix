import type { BoardType, UserRoleType } from "@prisma/client";
export type DraftPost = {
  id: string;
  boardId: string | null;
  title: string | null;
  content: unknown | null;
};

export type BoardListItem = {
  id: string;
  name: string;
  slug: string | null;
  isUse: boolean;
  writeRole: string | null;
  order: number;
};

export type ContentNode = {
  type?: string;
  imageId?: string;
  root?: ContentNode;
  children?: ContentNode[];
};

export type NewPostDTO = {
  id: string;
  boardId: string;
  title: string;
  contentJSON: unknown;
};

export type PublishPostSuccess = {
  ok: true;
  postId: string;
  boardSlug: string | null;
};

export type PublishPostFailure =
  | { ok: false; reason: "validation"; errors: unknown; values: Record<string, unknown> }
  | { ok: false; reason: "forbidden"; message: string }
  | { ok: false; reason: "error"; message: string };

export type PublishPostResult = PublishPostSuccess | PublishPostFailure;

export type NewBoardInput = {
  name: string;
  slug: string;
  type: BoardType;
  order: number;
  readRole: UserRoleType | null;
  writeRole: UserRoleType | null;
};
