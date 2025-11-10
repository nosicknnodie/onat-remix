import type { NewBoardInput } from "../isomorphic/types";
import * as q from "./admin.queries";
export async function createBoard(input: NewBoardInput) {
  return q.createBoard(input);
}

export const listPublicBoards = q.listPublicBoards;
