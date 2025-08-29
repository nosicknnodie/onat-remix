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
- [ ] `_public+/clubs+/$id/_layout.tsx`
  - [ ] **Refactor**: loader의 데이터 조회 로직을 `queries` 파일로 이전
- [ ] `_public+/clubs+/$id/edit.tsx`
- [ ] `_public+/clubs+/$id/members.tsx`
- [ ] `_public+/clubs+/$id/pendings.tsx`
- [ ] `api+/clubs+/$id/join.tsx`
- [ ] `api+/clubs+/$id/mercenaries.tsx`
- [ ] `api+/clubs+/$id/players.tsx`

### 3단계: 게시글/커뮤니티 (Posts/Communities)
- [ ] `_public+/communities+/_index.tsx`
- [ ] `_public+/communities+/new.tsx`
- [ ] `_public+/communities+/$slug+/$id/_index.tsx`
- [ ] `_public+/clubs+/$id/boards+/$slug+/$postId/_index.tsx`
- [ ] `api+/posts+/$id/_index.tsx`
- [ ] `api+/comments+/$id/_index.tsx`
- [ ] `api+/post-like.tsx`
- [ ] `api+/post-vote.tsx`
- [ ] `api+/comment-vote.tsx`

### 4단계: 경기/매치 (Matches)
- [ ] `_public+/matches+/_index.tsx`
- [ ] `_public+/matches+/new.tsx`
- [ ] `_public+/matches+/$id/_index.tsx`
- [ ] `_public+/matches+/$id/edit.tsx`
- [ ] `_public+/matches+/$id/clubs+/$matchClubId/attendance/_index.tsx`
- [ ] `_public+/matches+/$id/clubs+/$matchClubId/mercenaries/_index.tsx`
- [ ] `_public+/matches+/$id/clubs+/$matchClubId/position/_index.tsx`
- [ ] `_public+/matches+/$id/clubs+/$matchClubId/rating/_index.tsx`
- [ ] `_public+/matches+/$id/clubs+/$matchClubId/record/_index.tsx`
- [ ] `_public+/matches+/$id/clubs+/$matchClubId/team/_index.tsx`

### 5단계: 관리자 (Admin)
- [ ] `admin+/_index.tsx`
- [ ] `admin+/communities/_index.tsx`
- [ ] `admin+/communities/new.tsx`

### 6단계: 기타 API
- [ ] `api+/upload-url.tsx`
- [ ] `api+/kakao+/search.tsx`
- [ ] ...기타 식별된 API 라우트