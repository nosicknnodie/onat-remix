import type { SerializedEditorState } from "lexical";
import { EMPTY_MATCH_DESCRIPTION } from "./match.types";

type Nullable<T> = T | null | undefined;

export type UserNameSource = {
  nick?: string | null;
  name?: string | null;
};

export type PlayerNameSource = {
  nick?: string | null;
  name?: string | null;
  user?: Nullable<UserNameSource>;
};

export type MercenaryNameSource = {
  nick?: string | null;
  name?: string | null;
  user?: Nullable<UserNameSource>;
};

export type AttendanceNameSource = {
  player?: Nullable<PlayerNameSource>;
  mercenary?: Nullable<MercenaryNameSource>;
};

const coalesceName = (...values: (string | null | undefined)[]) => {
  for (const value of values) {
    if (value) return value;
  }
  return "";
};

export const getPlayerDisplayName = (player?: Nullable<PlayerNameSource>) => {
  return coalesceName(player?.nick, player?.user?.nick, player?.user?.name, player?.name);
};

export const getMercenaryDisplayName = (mercenary?: Nullable<MercenaryNameSource>) => {
  return coalesceName(
    mercenary?.nick,
    mercenary?.user?.nick,
    mercenary?.user?.name,
    mercenary?.name,
  );
};

export const getAttendanceDisplayName = (attendance?: Nullable<AttendanceNameSource>) => {
  return coalesceName(
    getPlayerDisplayName(attendance?.player),
    getMercenaryDisplayName(attendance?.mercenary),
  );
};

const createParagraphEditorState = (text: string): SerializedEditorState =>
  ({
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text,
              type: "text",
              version: 1,
            },
          ],
          direction: null,
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
        },
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  }) as unknown as SerializedEditorState;

export const parseMatchDescription = (description: unknown): SerializedEditorState => {
  if (!description) return EMPTY_MATCH_DESCRIPTION as unknown as SerializedEditorState;
  if (typeof description === "string") {
    try {
      const parsed = JSON.parse(description);
      if (parsed && typeof parsed === "object") {
        return parsed as unknown as SerializedEditorState;
      }
    } catch {
      return createParagraphEditorState(description);
    }
  }
  if (typeof description === "object") {
    return description as unknown as SerializedEditorState;
  }
  return EMPTY_MATCH_DESCRIPTION as unknown as SerializedEditorState;
};
