import { useEffect } from "react";
import { getToastForError } from "~/libs/isomorphic";
import type { ActionData } from "~/types/action";
import { useToast } from "./use-toast";

/**
 * ActionData를 관찰하여 실패 시 표준 토스트를 표시합니다.
 * - 성공 시 토스트는 표시하지 않습니다(화면별로 필요 시 별도 처리 권장).
 */
function isActionData(value: unknown): value is ActionData<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    typeof (value as { ok?: unknown }).ok === "boolean"
  );
}

function isValidationLike(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Record<string, unknown>;
  // Common server response shapes
  if ("fieldErrors" in o && o.fieldErrors) return true;
  if ("errors" in o && o.errors) return true;
  if ("success" in o && o.success === false) return true;
  return false;
}

export function useActionToast(actionData: ActionData | unknown) {
  const { toast } = useToast();

  useEffect(() => {
    // Primary: standardized ActionData failure
    if (isActionData(actionData)) {
      if (actionData.ok === false) {
        toast(getToastForError(actionData));
      }
      return;
    }
    // Fallback: validation-like or error-shaped payloads
    if (isValidationLike(actionData)) {
      toast(getToastForError(actionData));
    }
  }, [actionData, toast]);
}
