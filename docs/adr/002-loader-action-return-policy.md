---
status: Accepted
date: 2025-09-09
related: [docs/CONVENTION.md, docs/adr/001-feature-architecture-and-dto-boundary.md]
---

# Loader/Action 반환 규칙 표준화 (API vs UI 라우트)

## Context
Remix는 `loader`/`action`의 반환 형태로 순수 객체(POJO)와 `Response`를 모두 허용한다. 그러나 API 라우트와 UI 라우트가 혼재된 레포에서 반환 규칙이 일관되지 않으면 클라이언트 처리, 캐싱, 에러 핸들링, 테스트 방식이 제각각이 되어 생산성과 신뢰성이 떨어진다. 또한 자동 배포 환경에서 예측 가능한 응답 규격이 필요하다.

## Decision
1) 경로 규칙
   - API 라우트: `app/routes/api+/**`
   - UI 라우트: 그 외 모든 라우트

2) 반환 형태
   - API 라우트 → `loader`/`action` 모두 반드시 `Response` 반환
     - 예: `return Response.json({ ok: true, data }, { status: 200 });`
   - UI 라우트 → `loader`는 순수 객체(POJO) 반환, `action`은 반드시 `Response` 반환
     - 예: `loader: return { user, posts };`
     - 예: `action: return Response.json({ ok: false, message: "..." }, { status: 400 });`

3) 표준 에러/성공 응답
   - `action`은 `ActionData<T>` 타입을 준수한다. (성공/실패, 메시지, 필드 에러)

4) 리다이렉트
   - 리다이렉트는 `redirect("/path")` 또는 `Response`로 명시적으로 처리한다.

## Consequences
- (장점) 클라이언트와 서버의 응답 계약이 명확해져, 테스트/에러 처리/캐싱이 일관된다.
- (장점) API 응답은 항상 `Response`라서 헤더/상태코드 제어가 용이하다.
- (장점) UI 라우트의 `loader`는 직관적인 데이터 직반환으로 단순화된다.
- (트레이드오프) 기존 혼합 스타일을 사용하는 라우트는 마이그레이션이 필요하다.

## Alternatives
- 대안 A: 모든 라우트에서 항상 `Response`만 반환
  - 장점: 규칙이 단일하다. 헤더/상태 제어 일관.
  - 단점: UI 라우트에서도 불필요하게 래핑되어 보일러플레이트 증가.
- 대안 B: 상황에 따라 팀원이 임의 선택(현상 유지)
  - 장점: 유연함.
  - 단점: 일관성 상실, 문서/테스트/클라이언트 처리 복잡도 증가.

## Migration
- `app/routes/api+/**`의 `loader`/`action`에서 `Response` 미사용 구간을 `Response.json`으로 교체.
- UI 라우트의 `loader`가 `Response`를 반환한다면 POJO로 반환하도록 수정.
- 모든 `action`은 `ActionData<T>` 규격을 따르도록 결과 매핑을 정리.

## Notes
- 세부 패턴, 예시, 타입 정의는 `docs/CONVENTION.md`와 `AGENTS.md`를 따른다.
