---
title: "에러 처리/토스트 표준화 계획"
status: "초안(검토 요청)"
priority: "높음"
category: "Architecture/UX"
created_date: "2025-09-10"
---

목표
- 동일한 에러 타입에 대해 일관된 사용자 메시지(Toast/Alert)를 노출.
- 서버/클라이언트 경계를 고려하여 안전하고 단순한 에러 전파/표준화.
- DX 향상: 액션/로더/서비스에서 최소한의 코드로 표준 메시지 사용.

현황
- Toaster 전역 탑재: `app/root.tsx`에 `<Toaster />` 추가됨.
- 표준 에러 코드/문구 정의: `app/libs/const/error.const.ts`
- 에러 매핑 헬퍼: `app/libs/errors.ts` (`toErrorCode`, `getToastForError`, `buildErrorToast`)

범위
- UI 라우트(페이지/컴포넌트): `useToast()` + `getToastForError()`로 표준 토스트 출력.
- 서버 경계(로더/액션/서비스): 표준 응답/예외 정책 정립 및 문서화.
- API 라우트(`app/routes/api+/**`): `Response.json(ActionData)` 채택 + `code?: ErrorCode` 권장.

표준 정의
- 에러 코드(`ErrorCode`): `AUTH_REQUIRED | FORBIDDEN | NOT_FOUND | VALIDATION | NETWORK | SERVER | UNKNOWN`
- 표준 메시지(`ERROR_MESSAGES`): 코드별 `title`, `description` 한국어 문구 제공.
- 매핑 규칙(`toErrorCode`):
  - `Response` 상태코드 → 401:AUTH_REQUIRED, 403:FORBIDDEN, 404:NOT_FOUND, 422:VALIDATION, 5xx:SERVER
  - `ActionData` 유사 `{ ok:false, fieldErrors? }` → VALIDATION(필드 오류 존재 시) / UNKNOWN
  - 네트워크 오류 문구 포함 시 → NETWORK
  - 기타 → UNKNOWN
- 토스트 빌더:
  - `getToastForError(err)` → `{ title, description, variant:'destructive' }`
  - `buildErrorToast(code, extra?)` → 문구 커스터마이즈용

추가 헬퍼(서버 응답)
- `jsonOk(data?, message?, init?)` → `Response.json({ ok:true, data, message }, { status:200 })`
- `jsonFail(message?, fieldErrors?, init?)` → `Response.json({ ok:false, message, fieldErrors }, { status: fieldErrors ? 422 : 400 })`

사용 지침(클라이언트/UI)
- 임포트: `import { useToast } from "~/hooks"; import { getToastForError } from "~/libs";`
- 패턴:
  - 비동기 처리: `try/catch`에서 `toast(getToastForError(error))`
  - 검증 실패 응답(`ActionData`) 받은 경우 그대로 `getToastForError`에 전달

사용 지침(서버)
- UI 라우트 `action`: 실패 시 기존 `ActionData` 유지(AGENTS 규칙 준수), 필요 시 422 상태와 함께 반환
  - 예: `return Response.json(fail("입력 오류", fieldErrors), { status: 422 })`
- 로더: 인증 요구 시 `throw redirect(...)` 또는 `throw new Response(..., {status:401})`
- API 라우트: `Response.json(ActionData)` 채택. 실패 시 `code?: ErrorCode`, `message?: string`, `fieldErrors?` 포함 권장

API 응답 스키마(표준)
- 성공: `{ ok: true, data?: T, message?: string }`
- 실패: `{ ok: false, message?: string, fieldErrors?: FieldErrors, code?: ErrorCode }`
- 상태코드 매핑:
  - 422: 검증 실패(Zod 등) → `fieldErrors` 포함 권장
  - 401: 미인증(AUTH_REQUIRED)
  - 403: 권한 없음(FORBIDDEN)
  - 404: 리소스 없음(NOT_FOUND)
  - 5xx: 서버 오류(SERVER)
- 예시(Zod 검증 실패):
  ```ts
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const flat = parsed.error.flatten()
    return Response.json({ ok:false, code:"VALIDATION", message:"Invalid input", fieldErrors: flat.fieldErrors }, { status: 422 })
  }
  ```

파일 배치/임포트 규칙
- 상수: `app/libs/const/error.const.ts` (client-safe)
- 매핑/헬퍼: `app/libs/errors.ts` (client-safe)
- 임포트 경로: 클라이언트는 `~/libs`, 서버는 필요 시 `~/libs/index.server` (딥 임포트 금지)

롤아웃 단계(Phase)
- Phase 1: 기반 구축
  - [x] Toaster 전역 설치
  - [x] ErrorCode/메시지/매핑 헬퍼 도입
- Phase 2: 서버 경계 정리
  - [ ] UI 라우트 액션에서 422(VALIDATION) 사용 가이드 적용
    - 초기 적용: `/auth/edit` 액션에 422 매핑 반영(Response.json)
    - 추가 적용: `/clubs/new`, `/clubs/$id/edit`, `/matches/new`, `/matches/$id/edit`, `/communities/new`, `/communities/$slug/$id/edit`, `/settings/security`
  - [ ] API 라우트 응답을 `ActionData`로 표준화(검증 422, 권한 403, 미인증 401, 없음 404, 서버 5xx)
    - 적용 예: `/api/comment-vote`, `/api/post-vote`, `/api/goal`, `/api/upload-url`, `/api/players/:id`, `/api/clubs/:id/join`, `/api/evaluations/like|score`, `/api/team`, `/api/clubs/:id/{players,mercenaries}`, `/api/matchClubs/:matchClubId/isSelf`
  - [ ] 인증/권한/404에서 표준 `Response` 상태코드 사용 점검
- Phase 3: 클라이언트 적용
  - [ ] 폼/상호작용 주요 지점에 `getToastForError` 적용(로그인, 게시글 작성/수정, 매치 편집 등)
  - [ ] 중복 토스트/스팸 방지 정책 검토(동일 메시지 합치기 등)
- Phase 4: 관찰성/국제화
  - [ ] 에러 코드 메트릭 수집(선택: 콘솔/로깅 훅)
  - [ ] i18n 확장 전략 협의(문구 테이블 분리 또는 다국어 상수)
- Phase 5: 정리
  - [ ] 산발적 커스텀 에러 문구 제거/정리
  - [ ] 문서 최종 업데이트 및 예제 추가

체크리스트
- [ ] UI 주요 화면에서 네트워크/서버/검증 오류 토스트 정상 동작 확인
- [ ] 액션/로더에서 상태코드와 메시지 일관성 검토
- [ ] `ActionData` 실패 응답과 토스트 매핑 간극 없는지 점검
- [ ] 배럴 임포트 준수(`~/libs`, `~/libs/index.server`), 딥 임포트 미사용
- [ ] 테스트 케이스(단위/통합)에서 에러 코드/문구 매핑 검증 (선택)
- [ ] API 라우트 응답이 `ActionData` 스키마와 상태코드 표준을 준수하는지 점검

예시 스니펫
```ts
// client (component)
const { toast } = useToast();
try {
  await doSomething();
} catch (e) {
  toast(getToastForError(e));
}

// server (action)
import { fail } from "~/utils/action.server";
export async function action() {
  const fieldErrors = { name: ["필수값입니다"] };
  return Response.json(fail("입력 오류", fieldErrors), { status: 422 });
}
```

리스크 및 완화
- 과도한 토스트 노출 → 동일 코드/메시지 중복 시 지연/스로틀 고려(후속 개선)
- 서버 커스텀 오류 다양성 → 표준 코드 매핑 테이블 주기적 보강
- 다국어 요구 → 문구 테이블을 분리(i18n)하도록 설계해 향후 확장 용이
