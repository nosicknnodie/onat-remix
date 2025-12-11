# 자체전 팀 도입 체크리스트

## 합의된 전제/답변
- [x] MatchClub 생성: 기존 구조 유지(매치당 클럽 1개). 자체전은 단일 MatchClub 아래 `Team` 2개로 표현하고 `isSelf` 플래그는 그대로 사용.
- [x] 색상 포맷: 팔레트 라이브러리 선택 값을 `#000000` 형태 문자열로 저장/표현.
- [x] ClubTeamMember 제약: DB는 `@@unique([clubTeamId, playerId])` + `@@index([playerId])`만 적용, soft delete/이력 없음. “한 선수 한 팀” 제약은 두지 않음(템플릿/기간별 중복 허용).
- [x] 기간/StatsPeriodType: `ALL` enum 추가, `periodKey`는 `all`.
- [x] 통계 필드: `matchCount`, `winCount`, `drawCount`, `loseCount`, `totalGoal`, `totalConcede` 사용(`totalLike` 제외).
- [x] 통계 집계 시점: Record 이벤트(득점 등) 시점에 즉시 ClubTeamStatsHistory 업데이트. Cron 재계산 없음.
- [x] 기간 필터: 커스텀 날짜 범위는 v1 범위 밖(전체/연/분기만).
- [x] 자체전 Team의 clubTeamId: 자체전일 때 두 팀 모두 고정 팀을 참조하도록 유도. 고정 팀 템플릿 없으면 생성/선택 플로우로 이동(페이지 이동 또는 팝업).

## 1단계: 모델/마이그레이션
- [ ] Prisma에 `ClubTeam`, `ClubTeamMember`, `ClubTeamStatsHistory` 추가, `Team`에 `clubTeamId`(nullable) 연동 및 인덱스/제약 정의(`@@unique([clubTeamId, playerId])`, `@@index([playerId])` 포함).
- [ ] `StatsPeriodType`에 `ALL` 추가, `periodKey=all` 정의 반영한 마이그레이션 스크립트 작성.
- [ ] 기존 `MatchClub.isSelf`/`Quarter.isSelf`와 신규 `clubTeamId` 사용 규칙을 문서로 명시하고, 기존 매치 데이터 영향도 검증(매치당 클럽 1개 유지).
- [ ] 더미 데이터(레드/블루 팀 + 멤버) 시드 혹은 스크립트 작성으로 기본 동작 확인.

## 2단계: 관리자 UI/팀 편성
- [ ] `고정 팀 관리` 화면: 리스트/생성/수정/isUse 토글 + 간단 전적 요약 카드 구성(색상 입력은 HEX 문자열로 제한).
- [ ] `팀 편성` 화면: 미배정/팀A/팀B 3컬럼 DnD + 모바일 버튼 대체; 서버 트랜잭션으로 멤버십 이동 API 연동.
- [ ] 서버 도메인 규칙: 편성 세션(활성 템플릿) 내 중복 배치 방지, `미배정` 이동 시 멤버십 삭제 로직 확정 및 테스트. (템플릿/기간을 넘는 중복 소속은 허용)
- [ ] 자체전 생성 시 고정 팀 템플릿이 없으면 생성/선택 플로우로 유도하는 UX 정의.

## 3단계: 자체전 매치 생성 연동
- [ ] 매치 생성 플로우에 `일반/자체전` 옵션 추가, 자체전 선택 시 고정 팀 A/B 선택 UX 구현.
- [ ] 생성 시 `Match`, `MatchClub`, `Team(2개, clubTeamId 포함)` 생성 + 선택적 Attendance 기본값 생성 로직 연결.
- [ ] 기존 대외 경기 플로우와 분리되어 영향 없음을 검증하는 테스트/문서 추가.

## 4단계: 통계/랭킹
- [ ] `ClubTeamStatsHistory` 집계 방식 결정(경기 종료 즉시 vs Cron) 후 Job/트리거 구현.
- [ ] 랭킹/팀 상세 화면: 기간 필터, 승무패/득실/승률/최근 경기 요약, 그래프 데이터 API 연결.
- [ ] 자체전 통계가 기존 `MatchClubStats*` 계산과 섞이지 않도록 필터/쿼리 가이드 작성.

## 5단계: 권한/롤아웃
- [ ] 팀 관리·편성 권한을 `MASTER/MANAGER` 이상으로 제한하는 가드/정책 적용.
- [ ] 베타 플래그(특정 클럽만 노출) 설계 및 배포/롤백 절차 정리.
