---
status: Accepted
date: 2025-09-09
related: [docs/CONVENTION.md]
---

# Feature 기반 아키텍처와 DTO 경계 도입

## Context
Remix(Vite) 기반의 onat-remix 프로젝트에서 기능별 재사용성과 테스트 용이성을 높이고, 클라이언트 번들에 서버 전용 코드가 섞이는 문제를 예방해야 한다. 또한 자동 배포 환경에서 일관된 HTTP 반환 규칙과 표준 응답 타입이 필요하다. 현재 코드베이스는 feature 중심 폴더링과 배럴 분리를 상당 부분 적용 중이며, 팀/에이전트 협업을 위해 규칙을 명시적으로 고정할 필요가 있다.

## Decision
1) `app/features/<feature>/`에 client-safe와 server-only 배럴을 이원화한다: `index.ts`(client-safe), `index.server.ts`(server-only).
2) Deep import 금지. 외부에서는 반드시 배럴을 통해 import한다.
3) Service/Queries 레이어 분리: Prisma는 `queries.server.ts`에서만 사용, `service.server.ts`는 비즈니스 오케스트레이션만 담당하고 HTTP 세부사항을 포함하지 않는다.
4) DTO 검증 경계 채택: 라우트에서 Request/FormData/JSON을 파싱 → `validators`(client-safe)에서 검증/정제 → 서비스에 DTO 전달.
5) Loader/Action 규칙 표준화: `api+/` 라우트는 `loader`/`action` 모두 `Response` 반환, UI 라우트는 `loader`는 순수 객체, `action`은 `Response`.
6) 표준 `ActionData<T>` 타입을 도입해 action 응답을 일관화한다.

## Consequences
- (장점) 클라이언트 번들에 서버 전용 모듈이 섞이는 빌드/보안 리스크 제거.
- (장점) 테스트 용이성 향상: 서비스는 순수 함수/값 반환, HTTP·프레임워크 의존 축소.
- (장점) 코드 탐색성/재사용성 향상: feature 단위로 책임이 자명.
- (트레이드오프) 초기 보일러플레이트(배럴/validators/queries 파일) 증가.
- (트레이드오프) 엄격한 임포트 규칙으로 빠른 “편법 호출”은 어려움.

## Alternatives
- 대안 A: 단일 배럴(`index.ts`)만 사용하고 서버/클라이언트 구분 없이 export
  - 장점: 단순함. 단일 진입점.
  - 단점: client 번들에 server-only 누출 위험, 빌드 에러/보안 이슈.
- 대안 B: 라우트에 모든 로직 배치(서비스/쿼리 분리 없음)
  - 장점: 초기 구현 속도.
  - 단점: 테스트 어려움, 중복/결합도 증가, 유지보수 비용 상승.
- 대안 C: 서비스에서 Prisma 직접 접근(쿼리 레이어 제거)
  - 장점: 파일 수 감소.
  - 단점: 트랜잭션/권한/데이터 접근 규칙 분산, 변경 영향 추적 난이도 증가.

## Migration
- `index.ts`에서 서버 전용 export 제거 → `index.server.ts`로 이동.
- 서버 사이드 import를 `~/features/<feature>/index.server`로 일괄 치환.
- Prisma 사용 코드를 `queries.server.ts`로 이동하고, 서비스는 쿼리를 호출하도록 수정.
- 라우트에서 입력 파싱/검증을 `validators`로 위임하고 실패 시 즉시 400 반환.
- action 반환을 `ActionData<T>` 규격으로 정리하고, API/UI 라우트별 반환 규칙을 준수.

## Notes
- 상세 규칙과 예시는 `docs/CONVENTION.md`와 `AGENTS.md`에 수록되어 있으며, 변경 시 ADR을 우선 갱신 후 컨벤션 문서를 동기화한다.
