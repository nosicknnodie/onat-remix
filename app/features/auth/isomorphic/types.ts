// 도메인/DTO/액션 데이터 타입 정의로 레이어 간 규격을 통일합니다.
export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type RegisterSuccess = {
  success: string; // 예: "확인 메일을 보냈습니다."
};

export type RegisterFieldErrors = Partial<Record<keyof RegisterInput, string[]>>;

export type RegisterActionData =
  | { errors: RegisterFieldErrors; values?: Partial<RegisterInput> }
  | { success: string }
  | { errorMessage: string };
