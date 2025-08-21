# 개발 컨벤션 및 아키텍처 가이드

이 문서는 onat-remix 프로젝트의 일관성, 재사용성, 테스트 용이성을 높이기 위한 핵심 개발 규칙과 아키텍처를 정의합니다.

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
    ├── ui/               # React 컴포넌트
    │   └── Component.tsx
    ├── index.ts          # 외부 노출을 위한 Barrel 파일
    ├── queries.server.ts # 데이터 조회 로직 (읽기)
    ├── service.server.ts # 데이터 변경 로직 (쓰기/수정/삭제)
    ├── types.ts          # 해당 Feature에서 사용하는 타입
    └── validators.ts     # Zod 등을 이용한 데이터 유효성 검증
```

- **`*.server.ts`**: 서버 전용 코드임을 명시하여 클라이언트 번들에 포함되지 않도록 합니다.
- **`index.ts`**: 외부에서는 반드시 이 파일을 통해서만 모듈을 import 해야 합니다.

## 3. 임포트 정책 (Barrel-only Imports)

Feature 내부의 모듈은 `index.ts`를 통해서만 외부에 노출됩니다. 깊은 경로의 직접적인 임포트(deep import)는 금지됩니다.

**이를 위해 `biome.json`에 아래 규칙을 적용합니다.**

```json
{
  "linter": {
    "rules": {
      "nursery": {
        "noRestrictedImports": {
          "level": "error",
          "options": {
            "patterns": [{
              "group": [
                "~/features/*/**",
                "**/features/*/**",
                "!~/features/*/index",
                "!~/features/*/*/index",
                "!~/features/*/*/types",
                "!~/features/*/*/ui/**"
              ],
              "message": "Deep import는 금지됩니다. 각 feature의 index.ts를 통해 임포트하세요."
            }]
          }
        }
      }
    }
  }
}
```

## 4. 프레임워크와 로직의 분리

- **Remix Hooks 금지:** `app/features` 디렉토리 내에서는 `useLoaderData`, `useFetcher`, `useActionData` 등 Remix의 hook을 절대 사용하지 않습니다. 모든 데이터는 `ui` 컴포넌트에 `props`로 전달되어야 합니다.
- **HTTP 레이어의 역할:** `app/routes`는 HTTP 요청/응답을 처리하고, `features`의 `service`나 `queries`를 호출하여 그 결과를 뷰에 전달하는 역할만 담당합니다.
- **링크 컴포넌트 사용:** `features/ui` 내부에서 페이지 이동이 필요한 경우, `@remix-run/react`의 `Link`를 직접 사용하는 대신, 공통으로 만들어진 `~/components/ui/Link.tsx` 컴포넌트를 사용합니다.

## 5. 표준 API 응답 타입

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

## 6. Loader 및 Action 반환 값 규칙

라우트의 종류에 따라 `loader`와 `action`의 반환 값 형식을 명확히 구분합니다.

### 6.1. API 라우트 (`app/routes/api+/`)

-   `api+` 디렉토리 하위의 모든 라우트는 `loader`와 `action` 모두 반드시 `Response` 객체를 반환해야 합니다.
-   **예시:** `return Response.json({ data: "..." });`

### 6.2. UI 라우트 (그 외 모든 라우트)

-   **`loader`:** 순수한 객체(Object)를 직접 반환해야 합니다. Remix가 자동으로 JSON으로 변환합니다.
    -   **예시:** `return { user, posts };`
-   **`action`:** 반드시 `Response` 객체를 반환해야 합니다.
    -   **예시:** `return Response.json({ ok: false, message: "..." }, { status: 400 });` 또는 `return redirect("/path");`
