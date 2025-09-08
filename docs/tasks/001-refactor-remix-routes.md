---
title: "Remix 라우트 리팩토링 및 기능 모듈화"
status: "진행 중"
priority: "높음"
category: "Refactoring"
created_date: "2025-08-29"
---

## 🎯 목표 (Goal)

Remix의 `app/routes`에 있는 로더(loader) 및 액션(action) 함수의 비즈니스 로직을 `app/features` 디렉토리로 분리하여, 라우트 파일의 코드를 가볍고 간결하게 유지합니다.

## 🗂️ 상세 작업 계획 (Detailed Breakdown)

리팩토링 작업을 체계적으로 진행하기 위해, 라우트 그룹별로 체크리스트를 구성합니다. 각 항목은 **분석 → 로직 분리 → 리팩토링 → 검증** 단계를 포함합니다.

### 1단계: 인증 (Auth)
- [x] `_public+/auth+/login.tsx`
  - [x] **Refactor**: 라우트의 action에 있는 비즈니스 로직을 `features/auth/login/service.server.ts`의 단일 서비스 함수로 이전
- [x] `_public+/auth+/register.tsx`
  - [x] **Refactor**: `login.tsx`과 동일한 패턴으로, action 로직을 단일 서비스 함수로 이전
- [x] `_public+/auth+/new-password.tsx`
  - [x] **Refactor**: loader와 action 로직을 각각 단일 서비스 핸들러 함수로 이전
  - [x] **Fix**: `service.ts` 파일명을 `service.server.ts`로 변경
- [x] `_public+/auth+/edit.tsx`
  - [x] **Refactor**: `loader`와 `action` 로직을 전용 `queries` 및 `service` 파일로 분리
- [x] `_public+/auth+/reset-form.tsx`
  - [x] **Refactor**: action 로직을 단일 서비스 핸들러 함수로 이전
  - [x] **Fix**: `service.ts` 파일명을 `service.server.ts`로 변경
- [x] `api+/auth.logout.tsx`
  - [x] **Refactor**: 로그아웃 로직을 `core` 서비스로 이전

### 2단계: 클럽 (Clubs)
- [x] `_public+/clubs+/_index.tsx`
- [x] `_public+/clubs+/new.tsx`
  - [x] **Refactor**: action 로직을 단일 서비스 핸들러 함수로 이전
- [x] `_public+/clubs+/$id/_layout.tsx`
  - [x] **Refactor**: loader의 데이터 조회 로직을 `service` 파일로 이전
- [x] `_public+/clubs+/$id/edit.tsx`
  - [x] **Refactor**: loader와 action 로직을 `service` 파일로 이전
- [x] `_public+/clubs+/$id/members.tsx`
  - [x] **Refactor**: loader 로직을 `service` 파일로 이전
- [x] `_public+/clubs+/$id/pendings.tsx`
  - [x] **Refactor**: loader 로직을 `service` 파일로 이전
- [x] `api+/clubs+/$id/join.tsx`
  - [x] **Refactor**: action 로직을 `service` 파일로 이전
- [x] `api+/clubs+/$id/mercenaries.tsx`
  - [x] **Refactor**: loader 로직을 `service` 파일로 이전
- [x] `api+/clubs+/$id/players.tsx`
  - [x] **Refactor**: loader 로직을 `service` 파일로 이전

### 3단계: 게시글/커뮤니티 (Posts/Communities)
- [x] `_public+/communities+/_index.tsx`
  - [x] **Refactor**: loader 로직을 `service` 파일로 이전
- [x] `_public+/communities+/new.tsx`
- [x] `_public+/communities+/$slug+/$id/_index.tsx`
- [x] `_public+/clubs+/$id/boards+/$slug+/$postId/_index.tsx`
- [x] `api+/posts+/$id/_index.tsx`
- [x] `api+/comments+/$id/_index.tsx`
- [x] `api+/post-like.tsx`
- [x] `api+/post-vote.tsx`
- [x] `api+/comment-vote.tsx`

### 4단계: 경기/매치 (Matches)
- [x] `_public+/matches+/_index.tsx`
- [x] `_public+/matches+/new.tsx`
- [x] `_public+/matches+/$id/_index.tsx` (loader/action 없음, UI-only)
- [x] `_public+/matches+/$id/edit.tsx`
- [x] `_public+/matches+/$id/clubs+/$matchClubId/_layout.tsx`
- [x] `_public+/matches+/$id/clubs+/$matchClubId/attendance/_index.tsx`
- [x] `_public+/matches+/$id/clubs+/$matchClubId/mercenaries/_index.tsx`
- [x] `_public+/matches+/$id/clubs+/$matchClubId/position/_index.tsx`
- [x] `_public+/matches+/$id/clubs+/$matchClubId/position/setting/_index.tsx`
- [x] `_public+/matches+/$id/clubs+/$matchClubId/rating/_index.tsx`
- [x] `_public+/matches+/$id/clubs+/$matchClubId/record/_index.tsx`
- [x] `_public+/matches+/$id/clubs+/$matchClubId/team/_index.tsx`

#### UI 분리 (Matches 하위)
- [x] Mercenaries: 테이블/검색/버튼 UI → `features/matches/ui/MercenariesTable`
- [x] Team: 팀 카드/참석자 렌더 → `features/matches/ui/TeamCard`
- [x] Record: 쿼터/골 UI → `features/matches/ui/Record` (`QuarterRecord`, `GoalItem`)
- [x] Rating: 카드 UI → `features/matches/ui/RatingCard`
- [x] Position: 메인 보드 UI → `features/matches/ui/PositionBoard`
- [x] Position Setting: 툴바/쿼터 스텝퍼 → `features/matches/ui/PositionSetting` (`PositionToolbar`, `QuarterStepper`)
- [x] Position Setting: Drag & Drop UI 래핑 → `features/matches/ui/Dnd` (`DraggableChip`, `DropSpot`)

#### 남은 UI 분리 체크리스트 (Matches 하위 세부)
- [x] Match Header Card: 매치 요약 카드(제목/설명/장소/시간/참여 클럽/클럽 선택)
  - 적용 대상: `matches/$id/_index.tsx`, `matches/$id/clubs/$matchClubId/_index.tsx`
  - 목표: `features/matches/ui/MatchHeaderCard`로 분리하고 라우트는 상태/네비게이션만 담당
 - [x] Club Subnav Tabs: 클럽 상세 상단 서브탭(정보/참석/팀/포지션/기록/평점)
  - 적용 대상: `matches/$id/clubs/$matchClubId/_layout.tsx`
  - 목표: `features/matches/ui/ClubSubnavTabs`로 분리, 라우트는 링크 작성만 담당
 - [x] Club Admin Menu: 우측 드롭다운(매치 수정, 자체전 여부 토글)
  - 적용 대상: `matches/$id/clubs/$matchClubId/_layout.tsx`
  - 목표: `features/matches/ui/ClubAdminMenu`로 분리, 라우트는 콜백/권한 전달
- [x] Attendance Page UI: 상태 버튼/요약/그룹 카드 렌더 및 관리 액션/드로어
  - 적용 대상: `matches/$id/clubs/$matchClubId/attendance/_index.tsx` 및 `_components/*`
  - 목표: `features/matches/ui/attendance/*`로 분리 (GroupCard, ManageAction, Player/Mercenary/Check Drawers)
  - 진행: [x] GroupCard 분리/교체, [x] ManageAction/Drawers 분리, [x] 라우트 폴더 기존 컴포넌트 정리
  - 유의: Remix 훅(fetcher 등)은 라우트에 유지하고 UI는 props로 이벤트/상태만 수신
- [x] Place Search/History/Map: 매치 생성의 장소 검색/히스토리/지도
  - 적용 대상: `matches/_components/{SearchPlace,HistoryPlaceDownList,Map}.tsx`
  - 목표: `features/matches/ui/place/*`로 이동 또는 통합 컴포넌트화
  - 진행: [x] 이동 완료 및 `matches/new.tsx`, `matches/$id/edit.tsx` 교체
- [ ] Breadcrumbs: 매치/클럽 상세 브레드크럼 UI
  - 적용 대상: `matches/_layout.tsx`, `matches/$id/_layout.tsx`
  - 목표: 단순 UI는 유지 가능하나, 재사용 필요 시 `features/matches/ui/Breadcrumbs` 추출

세부 하위 라우트 점검 목록
- mercenaries
  - [x] Actions 드롭다운: `mercenaries/_actions.tsx` → `features/matches/ui/mercenaries/Actions`
  - [x] InfoDrawer: `mercenaries/_InfoDrawer.tsx` → `features/matches/ui/mercenaries/InfoDrawer`
  - [x] HistoryDrawer: `mercenaries/_HistoryDrawer.tsx` → `features/matches/ui/mercenaries/HistoryDrawer`
  - [x] Columns 정의: `mercenaries/_columns.tsx` → `features/matches/ui/mercenaries/columns` (테이블 UI 규칙에 맞게)
- team
  - [x] TeamAttendanceActions(드롭다운): `team/_actions.tsx` → `features/matches/ui/team/AttendanceActions`
  - [x] EditDialog: `team/_EditDialog.tsx` → `features/matches/ui/team/EditDialog`
  - [x] InfoDrawer: `team/_InfoDrawer.tsx` → `features/matches/ui/team/InfoDrawer`
- position
  - [x] Team Actions(포지션 설정 등): `position/_Actions.tsx` → `features/matches/ui/position/TeamActions`
  - [x] Setting Drawer: `position/setting/_Drawer.tsx` → `features/matches/ui/position/SettingDrawer`
  - [x] Setting Context: `position/setting/_context.tsx` → `features/matches/ui/position/setting.context` (Remix 훅 미사용 확인)
- rating
  - [x] RightDrawer(참여자 상세): `rating/_RightDrawer.tsx` → `features/matches/ui/rating/RightDrawer`
- record
  - [x] RightDrawer(골 추가 패널): `record/_Drawer.tsx` → `features/matches/ui/record/RightDrawer`

#### 진행 현황 업데이트
- [x] Match Header Card 컴포넌트 분리 및 2개 라우트 교체
- [x] Club Subnav Tabs/Club Admin Menu 분리 및 레이아웃 교체
- [x] Attendance: GroupCard/ManageAction/Drawers 분리 및 교체
- [x] Mercenaries: Actions/Info/History/Columns 분리 및 교체
- [x] Position: Team Actions 분리 및 보드 헤더 교체
- [x] Rating: RightDrawer 분리 및 교체
- [x] Record: RightDrawer 분리 및 교체

## 변경 요약 (추가)
- 추가: `app/features/matches/ui/ClubSubnavTabs.tsx`
- 추가: `app/features/matches/ui/ClubAdminMenu.tsx`
- 배럴: `app/features/matches/ui/index.ts` export 갱신
- 교체: `app/routes/_public+/matches+/$id+/clubs+/$matchClubId+/_layout.tsx`
  - 상단 탭 → `ClubSubnavTabs`
  - 우측 드롭다운 → `ClubAdminMenu` (토글 콜백/권한은 라우트에서 관리)

검증 방법 (추가)
- 경로: `/matches/:id/clubs/:matchClubId` 하위 탭 이동/활성 상태 확인
- 관리자 권한에서 우측 메뉴의 자체전 토글 및 매치 수정 링크 동작 확인

## 변경 요약 (PR-style)
- 추가: `app/features/matches/ui/MatchHeaderCard.tsx`
- 배럴 추가: `app/features/matches/ui/index.ts`에 `MatchHeaderCard` export
- 교체: `app/routes/_public+/matches+/$id+/_index.tsx` → `MatchHeaderCard` 사용
- 교체: `app/routes/_public+/matches+/$id+/clubs+/$matchClubId+/_index.tsx` → `MatchHeaderCard` 사용

검증 방법
- 경로: `/matches/:id` 및 `/matches/:id/clubs/:matchClubId`
- 확인: 상단 매치 요약 카드가 동일하게 렌더되고, 클럽 선택 Select/아바타 링크 동작 정상

### 5단계: 관리자 (Admin)
- [ ] `admin+/_index.tsx`
- [ ] `admin+/communities/_index.tsx`
- [ ] `admin+/communities/new.tsx`

### 6단계: 기타 API
- [ ] `api+/upload-url.tsx`
- [ ] `api+/kakao+/search.tsx`
- [ ] ...기타 식별된 API 라우트

## ✅ 완료 조건 (Definition of Done)

- `app/routes` 내의 모든 `loader`와 `action` 함수는 50줄 이하의 코드 라인을 유지해야 합니다.
- 모든 비즈니스 로직은 `app/features` 내의 해당 모듈로 완전히 이전되어야 합니다.
- 리팩토링된 모든 기능은 기존과 동일하게 작동해야 하며, 수동 테스트를 통해 검증되어야 합니다.
- `CONVENTION.md` 문서의 모든 규칙을 준수해야 합니다.
