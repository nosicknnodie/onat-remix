# 레포지토리 작업 지침서 (AGENTS.md)

이 문서는 onat-remix에서 사람과 에이전트가 동일한 규칙으로 빠르고 안전하게 작업하도록 돕는 실행형 가이드입니다. 아래의 컨벤션은 `docs/CONVENTION.md`를 실무 관점에서 요약·확장한 것입니다.

## 프로젝트 구조 & 모듈 구성
- 소스 경로: `app/` (features, routes, ui, libs)
- 정적 자산: `public/`
- DB 스키마: `prisma/`
- 테스트: `tests/`
- Remix flat-routes 사용: `app/routes/_public+/...`, `app/routes/api+/...` 등. 라우트는 얇게 유지하고 feature 서비스만 호출합니다.

### Feature 디렉터리 규칙 (`app/features/<feature>/`)
- 클라이언트 배럴: `index.ts` (client-safe: `types`, `validators`, `ui`만 export)
- 서버 배럴: `index.server.ts` (server-only: `service.server`, `queries.server` 등 export)
- 파일 예시
  - `ui/Component.tsx`: Remix 훅 금지, props 기반 UI
  - `queries.server.ts`: DB 읽기 전용 레이어 (Prisma는 여기에서만 사용)
  - `service.server.ts`: 비즈니스 오케스트레이션. HTTP 세부사항 없이 순수 값 반환
  - `types.ts`: 해당 기능의 타입 정의
  - `validators.ts`: zod 등으로 DTO 검증 (client-safe)

## 작업 플로우 (권장)
- 입력 파싱: 라우트에서 `Request/FormData/JSON` 파싱
- 검증: `~/features/<feature>/validators`의 parse 함수로 DTO 생성
- 서비스 호출: `~/features/<feature>/index.server`에서 서비스 호출
- 데이터 접근: 서비스는 반드시 `queries.server`를 통해서만 DB 접근
- 결과 매핑: 라우트에서 서비스 결과를 `Response` 또는 단순 객체로 변환
- 렌더링: UI 라우트는 데이터를 props로 `ui/` 컴포넌트에 전달(Remix 훅 사용 금지)

## 임포트/배럴 정책 (Deep import 금지)
- 서버 코드: `~/features/<feature>/index.server`에서 import
- 클라이언트/UI: `~/features/<feature>/index`에서 import
- 금지: feature 내부 깊은 경로 직접 import. Biome의 `noRestrictedImports`로 차단됨.

### index.ts vs index.server.ts
- 금지: `index.ts`에서 서버 전용 파일(`*.server.ts`) 재export
- 허용: `index.server.ts`는 서버 전용 항목만 export
- 서버 파일은 클라이언트 배럴(`index.ts`)을 가져오지 않음
- 클라이언트 코드는 `index.server.ts`를 가져오지 않음

## 프레임워크와 로직 분리
- features 내부에서 Remix 훅(`useLoaderData`, `useFetcher`, `useActionData`) 금지
- 라우트의 역할: HTTP 요청/응답 처리 + 서비스 호출 + 결과 매핑에 한정
- 링크는 공통 `~/components/ui/Link.tsx` 사용 (직접 `@remix-run/react` Link 지양)

## Service / Queries 책임
- `queries.server.ts`: Prisma를 포함한 데이터 접근 전용. 읽기/쓰기 모두 가능하되, 비즈니스 규칙 없음
- `service.server.ts`: 비즈니스 플로우 담당. Prisma 직접 사용 금지, HTTP 세부사항 없음, 순수 결과 객체 반환

## 타입 원칙
- `any` 금지(불가피하면 `unknown` → 좁히기). 공통/코어가 아닌 곳에서는 엄격한 타입 지향
- 구조적 데이터(JSON 등)는 각 feature의 `types.ts`에 최소 타입 정의 후 재사용

## HTTP 경계 검증(DTO) 패턴
- 라우트에서 원시 입력 파싱 → `validators`로 검증 → DTO 생성
- validators는 client-safe: 서버 객체 참조 금지, zod 스키마 + `parseXxx(data: unknown)`만 존재
- 검증 실패는 라우트에서 즉시 400 응답; 서비스는 호출하지 않음
- 서비스는 DTO만 입력으로 받아 순수 결과 반환; HTTP 매핑은 라우트 책임

## 표준 ActionData 타입
```ts
export type FieldErrors = Record<string, string[] | undefined>;
export type ActionSuccess<T = undefined> = { ok: true; message?: string; data?: T; fieldErrors?: FieldErrors };
export type ActionFailure = { ok: false; message?: string; data?: undefined; fieldErrors?: FieldErrors };
export type ActionData<T = undefined> = ActionSuccess<T> | ActionFailure;
```

## Loader / Action 반환 규칙
- `app/routes/api+/**`
  - loader/action은 반드시 `Response` 반환 (예: `return Response.json({ data })`)
- UI 라우트(그 외)
  - loader: 순수 객체를 반환 (Remix가 JSON으로 래핑)
  - action: 반드시 `Response` 반환 (예: `Response.json(...)` 또는 `redirect(...)`)

## 개발/빌드/테스트 명령
- `pnpm dev`: Remix + Vite 개발 서버 실행
- `pnpm build`: 클라이언트/서버 빌드
- `pnpm start`: 빌드된 서버 실행 (`./build/server/index.js`)
- `pnpm typecheck`: 타입 검사
- `pnpm lint` / `pnpm lint:fix`: Biome 린트 (수정은 `--write`)
- `pnpm format`: Biome 포맷터
- `pnpm test`: Vitest (단위/통합 + Storybook 테스트)
- `pnpm test:ui`: Vitest UI
- `pnpm coverage`: V8 커버리지
- Storybook: `pnpm storybook`(dev), `pnpm build-storybook`(static)

## 코드 스타일 & 네이밍
- Biome: 들여쓰기 2, 라인폭 100, deep import 금지 규칙 적용
- 컴포넌트: PascalCase, 함수/변수: camelCase, 라우트 파일: kebab-case
- 서버 전용 파일은 `.server.ts` 접미사 필수
- feature import는 반드시 배럴을 통해서만 수행

## 테스트 가이드
- 테스트 프레임워크: Vitest; 브라우저 테스트는 Playwright(`vitest.workspace.ts` 구성)
- 위치: `tests/**/*.test.ts(x)`; Storybook 스토리 `app/**/*.stories.tsx`도 테스트 가능
- E2E 예시: `E2E_BASE_URL=http://localhost:3000 pnpm test`
- 서비스 단에 의미 있는 단위 테스트 작성, 외부 연동은 mock 처리

## 커밋 & PR
- Conventional Commits 사용: `feat:`, `fix:`, `refactor:`, `test:`, `docs:` 등 (예: `feat(matches): team page loader`)
- PR에는 요약, 관련 이슈 링크, UI 변경 스크린샷, 실행한 테스트/검증 내용 포함

## 보안 & 설정
- 비밀키 커밋 금지. `.env.local` 사용(ignored), 안전한 기본값은 `.env.example`에 제공
- Prisma 스키마 변경 후: `pnpm exec prisma generate` → `pnpm exec prisma migrate dev`
- 자주 쓰는 환경변수: `DATABASE_URL`, SMTP, Redis, S3/MinIO 키 등

## 마이그레이션 체크리스트 (기존 코드 정리)
- `index.ts`에서 서버 전용 export 제거 → `index.server.ts`로 이동
- 서버 사이드 import를 `~/features/<feature>/index.server`로 변경
- 클라이언트(UI) import는 `~/features/<feature>/index` 유지
- Prisma 사용 위치를 `queries.server.ts`로 이동
- Remix 훅을 `features/ui`에서 제거하고 props 기반으로 변경

## 빠른 체크리스트 (Do / Don't)
- Do: 라우트는 얇게, 서비스는 순수 값 반환, DB는 queries에서만
- Do: validators로 DTO 생성 후 서비스 호출, ActionData 규격 준수
- Don't: deep import, 클라이언트 번들에서 서버 코드 참조, 서비스에서 Prisma 직접 사용
- Don't: features 내부에서 Remix 훅 사용, 라우트에서 복잡한 UI 구현
