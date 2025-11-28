import type { ErrorCode } from "~/libs/isomorphic/const/error.const";
import { ERROR_MESSAGES } from "~/libs/isomorphic/const/error.const";

/** HTTP 상태코드, ActionData, Exception을 표준 에러코드로 매핑 */
export function toErrorCode(err: unknown): ErrorCode {
  // Explicit API-provided code takes precedence when present
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code?: unknown }).code;
    if (
      code === "AUTH_REQUIRED" ||
      code === "FORBIDDEN" ||
      code === "NOT_FOUND" ||
      code === "VALIDATION" ||
      code === "NETWORK" ||
      code === "SERVER" ||
      code === "UNKNOWN"
    ) {
      return code;
    }
  }

  // Remix Response (loader/action throw new Response)
  if (err instanceof Response) {
    const s = err.status;
    if (s === 401) return "AUTH_REQUIRED";
    if (s === 403) return "FORBIDDEN";
    if (s === 404) return "NOT_FOUND";
    if (s === 422) return "VALIDATION";
    if (s >= 500) return "SERVER";
  }

  // ActionData-like shape { ok: false, message?, fieldErrors? }
  if (typeof err === "object" && err !== null && "ok" in err) {
    const e = err as { ok?: unknown; fieldErrors?: unknown };
    if (e.ok === false) {
      if (e.fieldErrors) return "VALIDATION";
      return "UNKNOWN";
    }
  }

  // Common API shape { success: false, errors? }
  if (typeof err === "object" && err !== null && "success" in err) {
    const e = err as { success?: unknown; errors?: unknown };
    if (e.success === false) {
      if (e.errors) return "VALIDATION";
      return "UNKNOWN";
    }
  }

  // Generic validation-like shape { fieldErrors? } or { errors? }
  if (typeof err === "object" && err !== null) {
    const e = err as { fieldErrors?: unknown; errors?: unknown };
    if (e.fieldErrors) return "VALIDATION";
    if (e.errors) return "VALIDATION";
  }

  // 네트워크 오류 시나리오 (fetch 등)
  if (typeof err === "object" && err && "message" in err) {
    const m = err as { message?: unknown };
    const msg = String(m.message ?? "").toLowerCase();
    if (msg.includes("network") || msg.includes("failed to fetch")) return "NETWORK";
  }

  return "UNKNOWN";
}

/** 에러코드 → 토스트 메시지(title, description, variant) */
export function getToastForError(err: unknown): {
  title: string;
  description: string;
  variant: "default" | "destructive";
} {
  const code = toErrorCode(err);
  const m = ERROR_MESSAGES[code];
  return {
    title: m.title,
    description: m.description,
    variant: "destructive",
  };
}

/** 임의의 문자열/코드에 대해 강제로 특정 에러코드 토스트 생성 */
export function buildErrorToast(code: ErrorCode, extra?: string) {
  const m = ERROR_MESSAGES[code];
  return {
    title: m.title,
    description: extra ? `${m.description}\n${extra}` : m.description,
    variant: "destructive" as const,
  };
}
