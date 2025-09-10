---
title: "Core 공유 모듈 정리(contexts/hooks/libs/utils)"
status: "Phase 1 진행 중"
priority: "중간"
category: "Refactoring"
created_date: "2025-09-09"
---

목표
- 전역 공유 모듈(`contexts`, `hooks`, `libs`, `utils`)을 일관된 규칙으로 정리해 재사용성과 가독성을 향상.
- 서버/클라이언트 경계를 명확히 하여 빌드 안정성과 보안을 강화.

원칙(요약)
- 서버 전용: 파일명 `*.server.ts(x)`, 네임드 배럴 `index.server.ts`만 통해 import.
- 클라이언트/범용: `*.ts(x)` 유지. 필요 시 `index.ts` 배럴 제공.
- 전략적 배럴화: 외부로 노출되는 최상단에서만 import 하도록 경로 단순화.

체크리스트
1) contexts
- [x] `app/contexts/index.ts` 배럴 추가 (AuthUserContext, infinite/* 일괄 export)
- [x] 전역에서 배럴 경로로 통일(`~/contexts`) (기존 개별 경로 점진 교체)
- [x] 컨텍스트 별 타입/Provider/훅 정리 및 JSDoc 부착

2) hooks
- [x] `app/hooks/index.ts` 배럴 추가 (`use-mobile`, `use-toast` 등)
- [x] 네이밍 정규화: 접두사 `use-` 유지, named export 사용 (`useMobile`, `useToast`)
- [x] 사용처 import 경로 정리(`~/hooks`)

3) libs
- [ ] 서버 전용 식별 및 `*.server.ts`로 통일 (mail, map, queries 하위 등)
- [x] `libs/index.server.ts`(서버) / `libs/index.ts`(클라이언트/범용) 배럴 설계
- [ ] 유틸/상수 모듈 분리: `const/`, `utils.ts` 역할 문서화
- [ ] confirm.tsx 컴포넌트화 검토 (`components/ui/confirm`로 승격)
  - [x] confirm 승격 및 전역 경로 교체, 기존 파일 제거
- [ ] libs/queries/* 사용처별 Feature 이동
  - [x] `libs/queries/attendance/atttendances.ts` → `features/matches/rating/queries.server.ts`
  - [ ] 나머지 libs/queries/* 이동 대상 식별 및 마이그레이션 계획 수립

4) utils
- [x] `utils/action.server.ts` 공통 응답 스키마/헬퍼 보강(JSDoc, 타입 노출)
- [ ] utils 배럴 도입 여부 결정 (현 단계는 유지하되 문서화)

5) 품질/안전망
- [ ] 타입체크/린트 통과 유지 (CI 스크립트 기준)
- [ ] 위험 변경(파일명 변경) 시 단계적 마이그레이션 가이드 작성

실행 계획(Phase)
- Phase 1: 배럴 추가 (contexts/hooks) 및 사용 가이드 문서화
- Phase 2: libs 서버/클라 경계 식별 + 파일명/배럴 정리 (PR 분리)
  - 진행 내역: `isMobile.ts` → `isMobile.server.ts`, `db/adatper.ts` → `db/adapter.server.ts`, `nodeModule.ts` → `nodeModule.server.ts`, server 라우트에서 `~/libs/index.server` 사용
- Phase 3: confirm 컴포넌트 승격, utils 문서화/보강
- Phase 4: 전역 import 경로 통일 작업 (검색 치환 + 린트 룰 보강 검토)

현황
- [x] 템플릿/라우터 정리(이전 작업)
- [x] Phase 1: contexts/hooks 배럴 추가 및 도입 일부 완료
- [ ] Phase 2: libs 서버/클라 경계 식별 및 통일 예정
