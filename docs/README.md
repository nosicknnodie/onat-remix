# 문서 인덱스 & 가이드

이 폴더는 설계/규칙/기능/운영 문서를 한 곳에서 관리합니다. 변경은 항상 관련 코드 PR과 함께 업데이트합니다.

## 구조
- `CONVENTION.md`: 개발 컨벤션(단일 출처)
- `adr/`: Architecture Decision Record (중대한 결정 기록)
- `rfc/`: 큰 변경 제안서(논의/합의)
- `features/`: 기능 명세(요구사항/흐름/UI)
- `tasks/`: 구현 작업 단위
- `runbooks/`: 운영/장애 대응
- `diagrams/`: 다이어그램 소스(mermaid/PlantUML/drawio 등)
- `_templates/`: 문서 템플릿 모음
 - `integrations/`: MCP/디자인/외부 연동 가이드

## 템플릿 사용
새 문서를 만들 때 `_templates`에서 복사하여 작성하세요.

예) ADR 작성
1) `_templates/adr.md` 복사 → `adr/2025-01-01-adopt-dto-boundary.md`
2) 상태 `Draft`로 시작 → 합의 후 `Accepted/Rejected`로 변경
3) 관련 문서(이슈/PR/RFC) 링크 추가

예) RFC 작성
1) `_templates/rfc.md` 복사 → `rfc/2025-01-07-remix-migration.md`
2) 리뷰어/데드라인 지정 → 논의/수정 → 결론은 ADR로 귀결

예) 기능/작업 문서
1) `_templates/feature.md` → `features/2025-01-10-new-feature.md`
2) `_templates/task.md` → `tasks/003-implement-new-feature.md`

예) 런북 작성
1) `_templates/runbook.md` → `runbooks/incident-db-outage.md`

## 네이밍 규칙
- 연속 ID: `NNN-title.md` (기본: ADR / features / tasks)
- 날짜 기반: `YYYY-MM-DD-title.md` (선택: RFC 등 제안성 문서)
- 소문자-kebab-case 사용

## 링크 규칙
- 상대 경로를 사용하고, 실제 파일 경로를 명시합니다.
- 코드/경로/명령은 백틱으로 감쌉니다(예: `pnpm dev`, `app/routes/...`).

## 업데이트 원칙
- 규칙/정책 변경 시: `adr/` 기록 → `CONVENTION.md` 동기화
- 큰 변경 제안: `rfc/` → 합의 후 `adr/`로 귀결
- 기능 구현: `features/` + `tasks/`로 분리, PR에 링크 포함

## ADR 인덱스
- [001 — Feature architecture and DTO boundary](adr/001-feature-architecture-and-dto-boundary.md)
- [002 — Loader/Action return policy](adr/002-loader-action-return-policy.md)
- [003 — Prisma access and transaction policy](adr/003-prisma-access-and-transaction-policy.md)

## Features 인덱스
- [001 — Auth](features/001-auth.md)
- [002 — Clubs](features/002-clubs.md)
- [003 — Mercenary](features/003-mercenary.md)
- [004 — Clubs milestone spec](features/004-clubs-milestone-spec.md)
 - [005 — Admin console](features/005-admin.md)
 - [006 — Communities](features/006-communities.md)
 - [007 — Files/Images](features/007-files.md)
 - [008 — Kakao Local Search](features/008-kakao.md)
 - [009 — Matches](features/009-matches.md)
 - [010 — Settings](features/010-settings.md)
 - [011 — Design Inventory](features/011-design-inventory.md)

## Integrations
- [MCP — Figma 연동 가이드](integrations/mcp-figma.md)
- [Figma → Storybook 스캐폴딩](integrations/figma-scaffold.md)
- [Figma 라이브러리 구성 계획](integrations/figma-library-plan.md)
 - [Figma 컴포넌트 스펙(코드 매핑)](integrations/figma-component-specs.md)
