# 기능: 009 - 경기(Matches)

## 1. 배경/목표
- 클럽이 경기를 생성/관리하고, 출석/용병/평가/기록을 관리할 수 있도록 한다.

## 2. 사용자 스토리
- 매니저는 경기를 생성하고 장소/시간/설명을 입력한다.
- 팀원은 출석 여부를 표시하고, 경기 후 평점을 남긴다.
- 필요 시 용병을 모집하고 포지션별로 구성한다.

## 3. 완료 조건 (AC)
- [ ] 경기 생성/수정에서 DTO 검증(zod)을 통과해야 한다.
- [ ] 리스트/상세에서 경기 정보와 참석자 현황을 볼 수 있다.
- [ ] 출석/평가/기록 입력이 가능하다(경로 분할 가능).
- [ ] 장소 검색은 카카오 로컬 API 연동으로 보조한다(선택).

## 4. 기술 계획
- validators: `app/features/matches/validators.ts` — `parseCreate`, `parseUpdate`
- 배럴: `app/features/matches/index.ts` — client-safe(`types`, `ui`)만 export
- 하위 기능 폴더: `attendance/`, `team/`, `mercenaries/`, `position/`, `rating/`, `record/`, `create/`, `detail/`, `list/`
- 서비스/쿼리: (추가 구현) service.server/queries.server로 유스케이스/DB 접근 분리
- UI: `app/features/matches/ui/**` 컴포넌트는 props 기반(Remix 훅 금지)

## 5. 테스트 노트
- (생성) 필드 누락 시 에러 반환, 성공 시 상세로 이동.
- (출석) 같은 사용자의 중복 응답 방지.
- (평가) 본인 팀/경기 범위 권한 체크.

