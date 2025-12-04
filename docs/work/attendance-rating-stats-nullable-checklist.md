# AttendanceRatingStats nullable 전환 체크리스트

AttendanceRatingStats 모델의 `averageRating`, `totalRating`, `voterCount`, `likeCount` 필드를 `nullable`로 전환할 때 확인해야 하는 작업들.

## DB 및 Prisma
- [x] `prisma/schema.prisma`에서 해당 필드 타입 뒤에 `?` 추가 및 기본값(`@default(0)`) 제거.
- [x] `prisma migrate dev --name attendance-rating-stats-nullable`로 마이그레이션 생성 후 SQL 검토(컬럼 `DROP DEFAULT`, `SET NULL` 여부 확인).
- [ ] 운영 DB에 동일한 마이그레이션 적용 순서/롤백 플랜 문서화.

## 데이터 정합성
- [x] 기존 데이터 중 `voterCount = 0` 인 레코드의 `averageRating`, `totalRating`, `likeCount`를 `NULL`로 업데이트할지 결정하고 SQL/스크립트 준비.
- [ ] 데이터 정리 스크립트 실행 후 샘플 레코드 수동 검증(`SELECT ... WHERE ... IS NULL`).

### 데이터 정합성 SQL 스크립트
```sql
-- 1) 투표가 없는 통계는 NULL 처리 (테스트 환경에서 먼저 실행 권장)
UPDATE "onat"."AttendanceRatingStats"
SET "averageRating" = NULL,
    "totalRating" = NULL,
    "voterCount" = NULL,
    "likeCount" = NULL
WHERE COALESCE("voterCount", 0) = 0;

-- 2) 검증: 여전히 0이 남아있는지 확인
SELECT COUNT(*) AS remaining_zero_voters
FROM "onat"."AttendanceRatingStats"
WHERE COALESCE("voterCount", 0) = 0;

-- 3) 검증: 투표 수가 NULL인데 평균만 존재하는 비정상 케이스 탐지
SELECT "attendanceId"
FROM "onat"."AttendanceRatingStats"
WHERE "averageRating" IS NOT NULL
  AND "voterCount" IS NULL;
```

## 애플리케이션 코드
- [x] Prisma Client 타입 변경(`number | null`)이 반영되는 영역 파악(서비스/훅/프런트) 후 null 처리 분기 추가.
- [x] GraphQL/REST 응답 스키마가 숫자로 고정돼 있다면 nullable 필드로 업데이트하고 API 문서 반영.
- [x] 조회/집계 쿼리에서 `COALESCE` 혹은 평균 계산 로직을 재검토해 null 의미가 유지되도록 수정.
- [x] 뷰/컴포넌트에서 “평가 없음” UI 처리 추가 (`voterCount === 0` 또는 값이 null일 때).

## 테스트 및 검증
- [ ] Prisma 단위 테스트/서비스 테스트에 null 케이스 추가.
- [ ] E2E나 스냅샷 테스트에서 평점이 없는 매치 시나리오 점검.
- [ ] `pnpm verify` 및 관련 테스트 스위트 실행해 타입/린트/테스트 통과 여부 확인. (현재 `app/routes/_public+/clubs+/$clubId+/matches+/$matchClubId+/position+/_index.tsx` 포맷 이슈로 Biome 실패)

## 문서 및 릴리스
- [ ] 변경된 동작을 README 혹은 앱 내 도움말/운영 가이드에 기록(평가가 없을 때 노출 방식 설명).
- [ ] 배포 노트에 마이그레이션 포함 사실과 데이터 정리 단계 명시.
