---
status: Draft
owner: 개인 프로젝트(향후 팀 이관 예정)
related: [docs/PLAN.md, docs/adr/001-feature-architecture-and-dto-boundary.md]
---

# 클럽(Clubs) 마일스톤 스펙

## 배경 / 목표
아마추어 축구 클럽을 생성/가입/관리할 수 있는 기본 기능을 완성한다. 사용자는 클럽을 만들고, 가입을 신청하며, 관리자는 신청을 승인/거절하고 멤버를 관리한다. 이는 매칭/용병 기능의 전제 조건이다.

## 사용자 시나리오
- (U1) 사용자 A는 클럽을 생성한다 → 생성 후 클럽 상세 페이지로 이동.
- (U2) 사용자 B는 클럽 상세에서 "가입 신청"을 보낸다 → 상태가 "신청 완료"로 표시.
- (U3) 관리자(소유자/관리자 권한)는 관리 페이지에서 가입 신청을 승인/거절한다.
- (U4) 승인 시 사용자 B는 클럽 멤버가 되며, 멤버 목록에 표시된다.
- (U5) 관리자/일반 멤버는 권한에 따라 서로 다른 액션을 볼 수 있다.

## 요구사항
- 기능(Functional)
  - 클럽 생성(Create): 이름, 지역, 소개(선택), 기본 이미지(선택).
  - 가입 신청(Join Request): 중복 신청 방지, 상태(PENDING/APPROVED/REJECTED).
  - 신청 관리(Manage): 목록 조회, 승인/거절, 결정 사유(선택) 기록.
  - 멤버 목록(Member List): 프로필, 역할(role: OWNER/ADMIN/MEMBER) 표시.
- 비기능(Non-Functional)
  - 접근 제어: 소유자/관리자만 승인/거절 권한.
  - 데이터 정합성: 중복 멤버/신청 방지(Unique + 상태 전이 where 조건).
  - 성능: 리스트 페이지네이션 고려(기본 20개).
  - 로깅/감사: 승인/거절 이벤트 기록(추가 필드 또는 이벤트 테이블 검토).

## 데이터 모델 / 권한(초안)
- 엔티티
  - Club(id, name, region, description?, imageUrl?, createdAt, ownerId)
  - ClubJoinRequest(id, clubId, userId, status[PENDING|APPROVED|REJECTED], reason?, decidedBy?, decidedAt, createdAt)
  - ClubMember(id, clubId, userId, role[OWNER|ADMIN|MEMBER], joinedAt)
- 제약
  - (clubId, userId) Unique on ClubMember
  - (clubId, userId, status=PENDING) Unique on ClubJoinRequest 유사 제약(상태 전이 기반 where 조건으로 방지)
- 권한
  - OWNER/ADMIN: 신청 승인/거절, 멤버 역할 변경(ADMIN<->MEMBER), 멤버 추방
  - MEMBER: 읽기 전용(멤버 목록 확인)

## UI 개요
- `/clubs/new`: 생성 폼(이름 필수, 지역/소개/이미지 선택)
- `/clubs/:id`: 상세 + 가입 신청 버튼(비멤버), 멤버 목록 탭
- `/clubs/:id/manage`: 신청 관리 테이블(상태/신청자/사유/결정 버튼)
  - 컴포넌트는 `app/features/clubs/ui/**`로 분리, props 기반, Remix 훅 미사용

## API / 라우트 규칙
- UI 라우트: 위 경로들. `loader`는 POJO, `action`은 `Response`.
- 필요 시 API 라우트: `app/routes/api+/clubs/**` 에 CRUD/관리 액션 노출, 모든 핸들러 `Response` 반환.
- validators: `app/features/clubs/validators.ts`에서 DTO 검증(zod) 제공.
- service: `app/features/clubs/service.server.ts`에서 유스케이스 오케스트레이션.
- queries: `app/features/clubs/queries.server.ts`에서 Prisma 접근.

## 완료 기준(AC)
- [ ] 클럽 생성: 유효성 검증 실패 시 400, 성공 시 상세로 리다이렉트.
- [ ] 가입 신청: 동일 사용자의 중복 PENDING 신청 불가, UI 상태 반영.
- [ ] 신청 관리: 승인 시 `ClubMember` 생성, 거절 시 사유(선택) 기록.
- [ ] 멤버 목록: 역할별 뱃지/액션 가시성.
- [ ] 모든 action 응답은 `ActionData<T>` 준수.
- [ ] `api+` 라우트는 `Response` 일관, UI 라우트 loader는 POJO.

## 리스크 / 영향 범위
- 동시성: 동일 사용자에 대한 중복 승인 처리 레이스 → 상태 전이 where + Unique 제약으로 방지.
- 권한 누락: 서버 측 권한 체크 누락 시 오남용 → service 레벨에서 권한 검증 강제.
- 마이그레이션: Prisma 스키마 변경과 초기 데이터 시드 필요.

## 마이그레이션/롤아웃
- Prisma 스키마 추가/변경 후: `pnpm exec prisma generate` → `pnpm exec prisma migrate dev`.
- 기존 데이터 없음(개인 프로젝트) → 시드 스크립트는 선택.
- 배포 전 수동 테스트 플로: 생성 → 신청 → 승인/거절 → 목록 확인.

