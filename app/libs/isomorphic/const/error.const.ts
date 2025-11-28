export type ErrorCode =
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "NETWORK"
  | "SERVER"
  | "UNKNOWN";

export const ERROR_MESSAGES: Record<ErrorCode, { title: string; description: string }> = {
  AUTH_REQUIRED: {
    title: "로그인이 필요합니다",
    description: "계속하려면 로그인해주세요.",
  },
  FORBIDDEN: {
    title: "권한이 없습니다",
    description: "이 작업을 수행할 권한이 없습니다.",
  },
  NOT_FOUND: {
    title: "대상을 찾을 수 없습니다",
    description: "요청한 리소스가 존재하지 않습니다.",
  },
  VALIDATION: {
    title: "입력값을 확인해주세요",
    description: "일부 필드에 올바르지 않은 값이 있습니다.",
  },
  NETWORK: {
    title: "네트워크 오류",
    description: "네트워크 상태를 확인하고 다시 시도해주세요.",
  },
  SERVER: {
    title: "서버 오류",
    description: "잠시 후 다시 시도해주세요.",
  },
  UNKNOWN: {
    title: "알 수 없는 오류",
    description: "문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
  },
};
