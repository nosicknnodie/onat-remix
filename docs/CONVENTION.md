# 개발 컨벤션 및 아키텍처 가이드

이 문서는 onat-remix 프로젝트의 일관성, 재사용성, 테스트 용이성을 높이기 위한 핵심 개발 규칙과 아키-텍처를 정의합니다.

## 1. 핵심 철학

**관심사 분리 (Separation of Concerns):** 비즈니스 로직(Features)을 프레임워크의 HTTP 레이어(Remix Routes)로부터 분리합니다. 이를 통해:
- UI와 로직의 재사용성을 높입니다.
- 프레임워크 의존도를 낮춰 테스트가 용이한 코드를 작성합니다.
- 코드의 복잡도를 낮추고 유지보수성을 향상시킵니다.

## 2. Feature 기반 디렉토리 구조

모든 비즈니스 로직은 `app/features` 디렉토리 내에 각 기능별로 그룹화합니다.

```
app/features/
└── [feature-name]/
    ├── ui/                   # React 컴포넌트 (client-safe)
    │   └── Component.tsx
    ├── index.ts              # client-safe 배럴 (validators, schema, types, ui만 export)
    ├── index.server.ts       # server-only 배럴 (service.server, queries.server 등 export)
    ├── queries.server.ts     # [내부용] 데이터 조회 로직 (읽기)
    ├── service.server.ts     # [외부용] 데이터 조회/변경 로직 (읽기/쓰기/수정/삭제)
    ├── types.ts              # 해당 Feature에서 사용하는 타입
    └── validators.ts         # Zod 등을 이용한 데이터 유효성 검증
```

- **`*.server.ts`**: 서버 전용 코드임을 명시하여 클라이언트 번들에 포함되지 않도록 합니다.
- **`index.ts` (client-safe 배럴)**: 절대 서버 전용 파일을 재export하지 않습니다. `validators`, `schema`, `types`, `ui` 등만 export 하세요.
- **`index.server.ts` (server-only 배럴)**: 서버 전용 항목만 export 합니다. 예) `export * as service from "./service.server"`.

## 3. 임포트 정책 (Barrel-only Imports)

Feature 내부의 모듈은 배럴을 통해서만 외부에 노출됩니다. 깊은 경로의 직접적인 임포트(deep import)는 금지됩니다.

임포트 규칙
- 서버 코드(라우트 loader/action, API 라우트, 서버 서비스/헬퍼): `~/features/[feature]/index.server`에서 import
- 클라이언트/UI 코드(컴포넌트, 훅, 브라우저 전용 유틸): `~/features/[feature]/index`에서 import

**프로젝트의 실제 `biome.json` 규칙 (발췌):**

```json
{
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "noNonNullAssertion": "off",
        "noRestrictedImports": {
          "level": "error",
          "options": {
            "patterns": [
              {
                "group": [
                  "~/features/*/**",
                  "**/features/*/**",
                  "!~/features/*/index",
                  "!~/features/*/*/index",
                  "!~/features/*/*/types",
                  "!~/features/*/*/types/**",
                  "!~/features/*/*/schema",
                  "!~/features/*/*/schema/**",
                  "!~/features/*/index.server",
                  "!~/features/*/ui/**",
                  "!~/features/*/*/ui/**",
                  "!**/features/*/ui/index",
                  "!~/features/index",
                  "!**/features/*/index",
                  "!**/features/*/*/index",
                  "!**/features/index",
                  "!**/features/*/index.server",
                  "!**/features/*/*/index.server"
                ],
                "message": "Deep import 금지: feature 배럴(index)로만 import 하세요."
              }
            ]
          }
        }
      }
    }
  }
}
```

## 3.1. index.ts vs index.server.ts 규칙 요약

- 금지: `index.ts`에서 `service.server`, `queries.server`, `token.service.server` 등을 재export
- 허용: `index.server.ts`에서 서버 전용 항목 재export
- 서버 파일에서 클라이언트 배럴을 가져오지 않습니다. (서버는 필요 시 `index.server.ts` 또는 개별 `.server.ts`를 사용)
- 클라이언트 코드에서 `index.server.ts`를 가져오지 않습니다.

도입 배경
- Remix Vite는 클라이언트 번들에 서버 전용 모듈이 섞여 들어가면 빌드를 차단합니다. ("Server-only module referenced by client")
- `index.ts`가 서버 전용 모듈을 재export하면, UI가 배럴을 통해 간접적으로 서버 코드를 참조하여 빌드 에러와 보안 리스크가 발생합니다.
- 배럴을 `index`(client-safe)와 `index.server`(server-only)로 이원화하면, 개발자가 코드 경계를 명확히 지킬 수 있고 린트 규칙과도 충돌하지 않습니다.

마이그레이션 가이드(기존 코드 정리 시)
- `index.ts`에서 서버 전용 export 제거 → `index.server.ts`에 추가
- 서버 사이드 import를 `~/features/[feature]/index.server`로 변경
- 클라이언트(UI) import는 `~/features/[feature]/index` 유지

## 4. 프레임워크와 로직의 분리

- **Remix Hooks 금지:** `app/features` 디렉토리 내에서는 `useLoaderData`, `useFetcher`, `useActionData` 등 Remix의 hook을 절대 사용하지 않습니다. 모든 데이터는 `ui` 컴포넌트에 `props`로 전달되어야 합니다.
- **HTTP 레이어의 역할:** `app/routes`는 HTTP 요청/응답을 처리하고, `features`의 `service`를 호출하여 그 결과를 뷰에 전달하는 역할만 담당합니다.
- **링크 컴포넌트 사용:** `features/ui` 내부에서 페이지 이동이 필요한 경우, `@remix-run/react`의 `Link`를 직접 사용하는 대신, 공통으로 만들어진 `~/components/ui/Link.tsx` 컴포넌트를 사용합니다.

## 5. Service / Queries 책임 분리

- **`queries.server.ts` (Query Layer):** 데이터베이스 접근 전용 레이어입니다. `prisma`는 오직 이 레이어에서만 사용합니다.
- **`service.server.ts` (Service Layer):** 비즈니스 플로우를 오케스트레이션합니다. `prisma`를 직접 사용하지 말고 반드시 `queries.server.ts`의 함수를 통해 데이터를 조회/변경합니다. 또한 HTTP 세부사항(`Response`, `redirect`, 헤더 설정 등)은 사용하지 않습니다. 서비스는 순수한 값(성공/실패 결과)만 반환하고, HTTP 레이어에서 이를 `Response`로 매핑합니다.
- 장점: 테스트 용이성, 데이터 접근 경로 명확화, 사이드이펙트(예: S3 삭제)와 DB 접근의 책임 분리.

## 6. 타입 원칙

- **`any` 사용 금지:** 공통/코어 단이 아닌 경우 `any`를 사용하지 않습니다. 필요한 경우 `unknown`을 우선 사용하고, 사용자 정의 타입으로 좁혀서 처리합니다.
- 에디터 JSON 등 구조적 데이터는 Feature의 `types.ts`에 최소 타입을 정의해 재사용합니다.

## 6.1. HTTP 경계 검증(DTO) 패턴

- 라우트(HTTP 레이어)에서 Request/FormData/JSON을 파싱하고 zod로 유효성 검증합니다.
- 검증 실패 시 라우트에서 즉시 400(Response)로 반환하며, 서비스는 호출하지 않습니다.
- 검증 성공 시, 서비스에 전달할 순수 DTO(파싱·정제된 타입)를 만들어 넘깁니다.
- 서비스는 DTO만 받아 비즈니스 규칙을 수행하고, 순수 결과 객체를 반환합니다. HTTP 매핑은 라우트에서 수행합니다.

예시 흐름
- parse: `validators.parseNewPostForm(request)` → 실패: 400, 성공: `{ id, boardId, title, content }`
- DTO 구성: `contentJSON = JSON.parse(content)` → `service.publishPost({ id, boardId, title, contentJSON })`
- 결과 매핑: 서비스 결과를 라우트에서 `Response`(JSON/redirect)로 변환

## 7. 표준 API 응답 타입

Remix의 `action` 함수는 반드시 아래의 표준화된 `ActionData<T>` 타입을 반환해야 합니다. 이를 통해 클라이언트에서 일관된 방식으로 응답을 처리할 수 있습니다.

```typescript
export type FieldErrors = Record<string, string[] | undefined>;

export type ActionSuccess<T = undefined> = {
  ok: true;
  message?: string;
  data?: T;
  fieldErrors?: FieldErrors;
};

export type ActionFailure = {
  ok: false;
  message?: string;
  data?: undefined;
  fieldErrors?: FieldErrors;
};

export type ActionData<T = undefined> = ActionSuccess<T> | ActionFailure;
```

## 8. Loader 및 Action 반환 값 규칙

라우트의 종류에 따라 `loader`와 `action`의 반환 값 형식을 명확히 구분합니다.

### 6.1. API 라우트 (`app/routes/api+/`)

-   `api+` 디렉토리 하위의 모든 라우트는 `loader`와 `action` 모두 반드시 `Response` 객체를 반환해야 합니다.
-   **예시:** `return Response.json({ data: "..." });`

### 6.2. UI 라우트 (그 외 모든 라우트)

-   **`loader`:** 순수한 객체(Object)를 직접 반환해야 합니다. Remix가 자동으로 JSON으로 변환합니다.
    -   **예시:** `return { user, posts };`
-   **`action`:** 반드시 `Response` 객체를 반환해야 합니다.
    -   **예시:** `return Response.json({ ok: false, message: "..." }, { status: 400 });` 또는 `return redirect("/path");`

## 9. Feature UI 분리

- 라우트 파일에서 복잡한 UI(Form 등)는 해당 Feature의 `ui/` 디렉토리로 분리합니다.
- `ui` 컴포넌트는 Remix 훅을 사용하지 않습니다. 필요한 데이터는 `props`로 전달합니다.
- 재사용 가능한 형태로 컴포넌트를 설계하여 다른 라우트에서도 쉽게 활용할 수 있도록 합니다.
