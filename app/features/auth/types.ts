import type { z } from "zod";
import type { editorSchema } from "./validators";

export type IEditorUser = z.infer<typeof editorSchema>;
export type IEditorUserErrors = z.inferFlattenedErrors<typeof editorSchema>;
