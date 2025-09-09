---
title: "Template 폴더 정리 및 컴포넌트 이동"
status: "진행 중"
priority: "중간"
category: "Refactoring"
created_date: "2025-09-09"
---

목표
- `app/template` 하위 컴포넌트들을 실제 사용처 기준으로 이동하여, Feature/UI 모듈화 컨벤션(CONVENTION.md)에 맞게 정리한다.
- 공통으로 2곳 이상에서 사용하는 컴포넌트는 `app/components`로 승격한다.

완료 항목
- 공통 컴포넌트로 이동
  - Position 선택 UI: `app/template/Position.tsx` → `app/components/Position.tsx`
    - 참조 업데이트: settings/position, mercenaries edit, mercenaries new
  - 레이아웃 임포트 경로 정리 (우선 경로만 교체, 실제 파일 이동은 다음 단계)
    - root/header: `app/components/layout/Header`
    - admin/header: `app/components/layout/AdminHeader`
    - admin/side: `app/components/layout/AdminSideMenu`
    - main/side: `app/components/layout/MainSideMenu`
  - 이미지 크로퍼 다이얼로그 경로 정리 (임시 래퍼): `app/components/cropper/ImageCropperDialog`
    - 참조 업데이트: clubs/$id/edit, settings/edit, features/clubs/create/ui/ClubCreateForm

- Feature 전용으로 이동(또는 래핑)
  - Clubs: JoinDialog → `app/features/clubs/ui/JoinDialog`
    - 참조 업데이트: clubs/$id/_layout
  - Matches: match-comment → `app/features/matches/ui/match-comment/CommentSection`
    - 참조 업데이트: matches/$id/clubs/$matchClubId/_layout
  - Matches: Mercenary New UI → `app/features/matches/ui/mercenaries/New/{EmailSearch, AddMercenary, hook}`
    - 참조 업데이트: mercenaries/new 라우트
    - hook 내부의 fetcher 타입 의존 제거(템플릿의 action import 제거)
  - Matches: Mercenary New 서버 로직 분리
    - `features/matches/mercenaries/service.server.ts`에
      - `findUserForMercenaryByEmail`, `createMercenaryForMatchClub`, `getMatchClub` 추가
    - mercenaries/new 라우트에서 action을 서비스 호출로 대체

남은 작업(TODO)
- 레이아웃 컴포넌트 실제 파일 이동
  - 현재 `app/components/layout/*`는 임시 경로 교체만 되어있음(래퍼 제거 및 실제 코드 이동 필요)
  - 대상: `template/layout/{AdminHeader,Header,AdminSideMenu,MainSideMenu}`
- 크로퍼 컴포넌트 실제 파일 이동
  - `template/cropper/{ImageCropper, ImageCropperDialog, cropper.hook}` → `components/cropper`로 이동
  - 현재는 `ImageCropperDialog`만 경로 래핑
- Post(커뮤니티) 코멘트/투표 UI
  - `template/post/*` → `features/communities/ui/*`로 래핑 완료
  - 후속: 래퍼 제거 및 실제 코드 이동
- 사용되지 않는 템플릿 식별 후 제거
  - 삭제 완료: `app/template/match/MatchCard.tsx`, `app/template/main/Profile.tsx`
  - `app/template/auth/` 디렉토리는 현재 비어있음(추후 폴더 자체 제거 가능)

검증 방법
- typecheck: `pnpm typecheck`
- lint: `pnpm lint`
- 수동 테스트: 관련 라우트 UI 동작 확인 (settings/position, clubs edit, mercenaries new/edit, match 댓글, 게시판 글/댓글)
