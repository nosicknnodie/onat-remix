TRUNCATE "onat"."Evaluation"

-- 0) 필요 시 백업 후 실행
TRUNCATE "onat"."MatchClubStatsTotal", "onat"."AttendanceRatingStats", "onat"."AttendanceRatingVote";

-- 1) MatchClubStatsTotal (승인 회원 기준, 투표/출석/용병 포함)
INSERT INTO "onat"."MatchClubStatsTotal" (
  "matchClubId",
  "playerCount",
  "voteCount",
  "voteRate",
  "checkCount",
  "checkRate",
  "mercenaryVoteCount",
  "mercenaryCheckCount"
)
SELECT
  mc.id AS "matchClubId",
  (SELECT COUNT(*) FROM "onat"."Player" p WHERE p."clubId" = mc."clubId" AND p.status = 'APPROVED') AS "playerCount",
  SUM(CASE WHEN a."playerId" IS NOT NULL AND a."isVote" THEN 1 ELSE 0 END) AS "voteCount",
  CASE
    WHEN (SELECT COUNT(*) FROM "onat"."Player" p WHERE p."clubId" = mc."clubId" AND p.status = 'APPROVED') > 0
      THEN ROUND(SUM(CASE WHEN a."playerId" IS NOT NULL AND a."isVote" THEN 1 ELSE 0 END)::numeric /
                 NULLIF((SELECT COUNT(*) FROM "onat"."Player" p WHERE p."clubId" = mc."clubId" AND p.status = 'APPROVED'),0) * 100)
    ELSE 0
  END AS "voteRate",
  SUM(CASE WHEN a."playerId" IS NOT NULL AND a."isCheck" THEN 1 ELSE 0 END) AS "checkCount",
  CASE
    WHEN SUM(CASE WHEN a."playerId" IS NOT NULL AND a."isVote" THEN 1 ELSE 0 END) > 0
      THEN ROUND(SUM(CASE WHEN a."playerId" IS NOT NULL AND a."isCheck" THEN 1 ELSE 0 END)::numeric /
                 NULLIF(SUM(CASE WHEN a."playerId" IS NOT NULL AND a."isVote" THEN 1 ELSE 0 END),0) * 100)
    ELSE 0
  END AS "checkRate",
  SUM(CASE WHEN a."mercenaryId" IS NOT NULL AND a."isVote"  THEN 1 ELSE 0 END) AS "mercenaryVoteCount",
  SUM(CASE WHEN a."mercenaryId" IS NOT NULL AND a."isCheck" THEN 1 ELSE 0 END) AS "mercenaryCheckCount"
FROM "onat"."MatchClub" mc
LEFT JOIN "onat"."Attendance" a ON a."matchClubId" = mc.id
GROUP BY mc.id
ON CONFLICT ("matchClubId") DO UPDATE SET
  "playerCount" = EXCLUDED."playerCount",
  "voteCount"   = EXCLUDED."voteCount",
  "voteRate"    = EXCLUDED."voteRate",
  "checkCount"  = EXCLUDED."checkCount",
  "checkRate"   = EXCLUDED."checkRate",
  "mercenaryVoteCount"  = EXCLUDED."mercenaryVoteCount",
  "mercenaryCheckCount" = EXCLUDED."mercenaryCheckCount";

-- AttendanceRatingStats (받은 평가 합계) - User 테이블명 수정
INSERT INTO "onat"."AttendanceRatingStats" (
  "attendanceId",
  "averageRating",
  "totalRating",
  "voterCount",
  "likeCount"
)
SELECT
  a.id AS "attendanceId",
  CASE
    WHEN COALESCE(cnt.voterCount, 0) > 0
      THEN ROUND(COALESCE(cnt.totalRating, 0)::numeric / cnt.voterCount, 2)
    ELSE NULL
  END AS "averageRating",
  CASE
    WHEN COALESCE(cnt.voterCount, 0) > 0
      THEN COALESCE(cnt.totalRating, 0)::numeric
    ELSE NULL
  END AS "totalRating",
  CASE
    WHEN COALESCE(cnt.voterCount, 0) > 0 THEN cnt.voterCount
    ELSE NULL
  END AS "voterCount",
  CASE
    WHEN COALESCE(cnt.voterCount, 0) > 0 THEN COALESCE(cnt.likeCount, 0)
    ELSE NULL
  END AS "likeCount"
FROM "onat"."Attendance" a
LEFT JOIN (
  SELECT
    e."attendanceId",
    COUNT(*) FILTER (WHERE r_user.id IS DISTINCT FROM target_user.id) AS voterCount,
    SUM(e.score) FILTER (WHERE r_user.id IS DISTINCT FROM target_user.id) AS totalRating,
    COUNT(*) FILTER (WHERE e.liked AND r_user.id IS DISTINCT FROM target_user.id) AS likeCount
  FROM "onat"."Evaluation" e
  JOIN "onat"."Attendance" target_a ON target_a.id = e."attendanceId"
  LEFT JOIN "onat"."Player" target_player ON target_player.id = target_a."playerId"
  LEFT JOIN "onat"."users" target_user ON target_user.id = target_player."userId"
  LEFT JOIN "onat"."users" r_user ON r_user.id = e."userId"
  GROUP BY e."attendanceId"
) cnt ON cnt."attendanceId" = a.id
ON CONFLICT ("attendanceId") DO UPDATE SET
  "averageRating" = EXCLUDED."averageRating",
  "totalRating"   = EXCLUDED."totalRating",
  "voterCount"    = EXCLUDED."voterCount",
  "likeCount"     = EXCLUDED."likeCount";

-- 3) AttendanceRatingVote (내가 남긴 평가/좋아요 합계) onat 스키마
INSERT INTO "onat"."AttendanceRatingVote" (
  "attendanceId",
  "totalUsedRating",
  "hasVoted",
  "votedMemberCount",
  "usedLikeCount"
)
WITH rater AS (
  SELECT
    a.id AS "attendanceId",
    a."matchClubId",
    COALESCE(p."userId", m."userId") AS "userId"  -- 평가자 userId (선수/용병)
  FROM "onat"."Attendance" a
  LEFT JOIN "onat"."Player" p ON p.id = a."playerId"
  LEFT JOIN "onat"."Mercenary" m ON m.id = a."mercenaryId"
),
votes AS (
  SELECT
    r."attendanceId",
    COALESCE(SUM(e.score), 0) AS "totalUsedRating",
    COUNT(DISTINCT e."attendanceId") AS "votedMemberCount",
    COUNT(*) FILTER (WHERE e.liked) AS "usedLikeCount"
  FROM rater r
  JOIN "onat"."Evaluation" e
    ON e."userId" = r."userId"
  JOIN "onat"."Attendance" tgt
    ON tgt.id = e."attendanceId"
   AND tgt."matchClubId" = r."matchClubId"
  LEFT JOIN "onat"."Player" tp ON tp.id = tgt."playerId"
  LEFT JOIN "onat"."Mercenary" tm ON tm.id = tgt."mercenaryId"
  LEFT JOIN "onat"."users" tu ON tu.id = tp."userId"
  LEFT JOIN "onat"."users" tmu ON tmu.id = tm."userId"
  WHERE COALESCE(tu.id, tmu.id) IS DISTINCT FROM r."userId"  -- 본인 제외
  GROUP BY r."attendanceId"
)
SELECT
  a.id,
  COALESCE(v."totalUsedRating", 0),
  (COALESCE(v."votedMemberCount", 0) > 0) AS "hasVoted",
  COALESCE(v."votedMemberCount", 0),
  COALESCE(v."usedLikeCount", 0)
FROM "onat"."Attendance" a
LEFT JOIN votes v ON v."attendanceId" = a.id
ON CONFLICT ("attendanceId") DO UPDATE SET
  "totalUsedRating" = EXCLUDED."totalUsedRating",
  "hasVoted"        = EXCLUDED."hasVoted",
  "votedMemberCount"= EXCLUDED."votedMemberCount",
  "usedLikeCount"   = EXCLUDED."usedLikeCount";




-- 필요 시 백업 후 초기화
-- TRUNCATE "onat"."MatchClubStatsHistory", "onat"."PlayerStatsHistory";

-------------------------------
-- 1) MatchClubStatsHistory (MatchClubStatsTotal 기반)
-------------------------------
WITH base AS (
  SELECT
    mc.id AS "matchClubId",
    m."stDate" AS match_date,
    mt."voteCount",
    mt."voteRate",
    mt."checkCount",
    mt."checkRate"
  FROM "onat"."MatchClub" mc
  JOIN "onat"."Match" m ON m.id = mc."matchId"
  JOIN "onat"."MatchClubStatsTotal" mt ON mt."matchClubId" = mc.id
),
expanded AS (
  SELECT "matchClubId", 'MONTH'::"onat"."StatsPeriodType" AS "periodType",
         to_char(date_trunc('month', match_date), 'YYYY-MM') AS "periodKey",
         AVG("voteCount")::int AS "voteCount",
         AVG("voteRate")::int AS "voteRate",
         AVG("checkCount")::int AS "checkCount",
         AVG("checkRate")::int AS "checkRate",
         COUNT(*) AS "matchCount"
  FROM base GROUP BY 1,2,3
  UNION ALL
  SELECT "matchClubId", 'QUARTER'::"onat"."StatsPeriodType",
         to_char(date_trunc('quarter', match_date), 'YYYY-"Q"Q'),
         AVG("voteCount")::int, AVG("voteRate")::int, AVG("checkCount")::int, AVG("checkRate")::int, COUNT(*)
  FROM base GROUP BY 1,2,3
  UNION ALL
  SELECT "matchClubId", 'HALF_YEAR'::"onat"."StatsPeriodType",
         to_char(date_trunc('year', match_date), 'YYYY') || '-H' ||
           CASE WHEN EXTRACT(month FROM match_date) <= 6 THEN '1' ELSE '2' END,
         AVG("voteCount")::int, AVG("voteRate")::int, AVG("checkCount")::int, AVG("checkRate")::int, COUNT(*)
  FROM base GROUP BY 1,2,3
  UNION ALL
  SELECT "matchClubId", 'YEAR'::"onat"."StatsPeriodType",
         to_char(date_trunc('year', match_date), 'YYYY'),
         AVG("voteCount")::int, AVG("voteRate")::int, AVG("checkCount")::int, AVG("checkRate")::int, COUNT(*)
  FROM base GROUP BY 1,2,3
)
INSERT INTO "onat"."MatchClubStatsHistory" (
  id, "matchClubId", "periodType", "periodKey",
  "voteCount", "voteRate", "checkCount", "checkRate", "matchCount", "calculatedAt"
)
SELECT gen_random_uuid(), "matchClubId", "periodType", "periodKey",
       "voteCount", "voteRate", "checkCount", "checkRate", "matchCount", now()
FROM expanded
ON CONFLICT ("matchClubId", "periodType", "periodKey") DO UPDATE SET
  "voteCount" = EXCLUDED."voteCount",
  "voteRate" = EXCLUDED."voteRate",
  "checkCount" = EXCLUDED."checkCount",
  "checkRate" = EXCLUDED."checkRate",
  "matchCount" = EXCLUDED."matchCount",
  "calculatedAt" = now();

-------------------------------
-- 2) PlayerStatsHistory (원천 재집계, voteRate = isVote 출석 수 / 클럽 기간별 경기수 * 100)
-------------------------------
-- PlayerStatsHistory 재집계(onat)
WITH matches AS (
  SELECT a."playerId", mc.id AS "matchClubId", m."stDate" AS match_date
  FROM "onat"."Attendance" a
  JOIN "onat"."MatchClub" mc ON mc.id = a."matchClubId"
  JOIN "onat"."Match" m ON m.id = mc."matchId"
  WHERE a."playerId" IS NOT NULL
    AND m."stDate" <= now()
),
periods AS (
  SELECT
    "playerId",
    "matchClubId",
    match_date,
    date_trunc('month', match_date)   AS month_start,
    date_trunc('quarter', match_date) AS quarter_start,
    date_trunc('year', match_date)    AS year_start,
    CASE WHEN EXTRACT(month FROM match_date) <= 6
         THEN date_trunc('year', match_date)
         ELSE date_trunc('year', match_date) + INTERVAL '6 month'
    END AS half_year_start
  FROM matches
),
rating AS (
  SELECT
    a."playerId",
    mc.id AS "matchClubId",
    m."stDate" AS match_date,
    rs."averageRating"
  FROM "onat"."AttendanceRatingStats" rs
  JOIN "onat"."Attendance" a ON a.id = rs."attendanceId"
  JOIN "onat"."MatchClub" mc ON mc.id = a."matchClubId"
  JOIN "onat"."Match" m ON m.id = mc."matchId"
  WHERE a."playerId" IS NOT NULL
    AND rs."averageRating" > 0
    AND m."stDate" <= now()
),
goals AS (
  SELECT a."playerId", mc.id AS "matchClubId", m."stDate" AS match_date, COUNT(*) AS cnt
  FROM "onat"."Record" r
  JOIN "onat"."Attendance" a ON a.id = r."attendanceId"
  JOIN "onat"."MatchClub" mc ON mc.id = a."matchClubId"
  JOIN "onat"."Match" m ON m.id = mc."matchId"
  WHERE r."isOwnGoal" = FALSE
    AND r."eventType" IN ('GOAL','PK_GOAL')
    AND a."playerId" IS NOT NULL
    AND m."stDate" <= now()
  GROUP BY 1,2,3
),
assists AS (
  SELECT a."playerId", mc.id AS "matchClubId", m."stDate" AS match_date, COUNT(*) AS cnt
  FROM "onat"."Record" r
  JOIN "onat"."Attendance" a ON a.id = r."assistAttendanceId"
  JOIN "onat"."MatchClub" mc ON mc.id = a."matchClubId"
  JOIN "onat"."Match" m ON m.id = mc."matchId"
  WHERE r."assistAttendanceId" IS NOT NULL
    AND a."playerId" IS NOT NULL
    AND m."stDate" <= now()
  GROUP BY 1,2,3
),
likes AS (
  SELECT a."playerId", mc.id AS "matchClubId", m."stDate" AS match_date, COUNT(*) AS cnt
  FROM "onat"."Evaluation" e
  JOIN "onat"."Attendance" a ON a.id = e."attendanceId"
  JOIN "onat"."MatchClub" mc ON mc.id = a."matchClubId"
  JOIN "onat"."Match" m ON m.id = mc."matchId"
  WHERE e.liked = TRUE
    AND a."playerId" IS NOT NULL
    AND m."stDate" <= now()
  GROUP BY 1,2,3
),
votes AS (
  SELECT DISTINCT a."playerId", mc.id AS "matchClubId", m."stDate" AS match_date, COUNT(*) AS cnt
  FROM "onat"."Attendance" a
  JOIN "onat"."MatchClub" mc ON mc.id = a."matchClubId"
  JOIN "onat"."Match" m ON m.id = mc."matchId"
  WHERE a."playerId" IS NOT NULL
    AND a."isVote" = TRUE
    AND m."stDate" <= now()
  GROUP BY a."playerId", mc.id, m."stDate"
),
expanded AS (
  SELECT "playerId", "matchClubId", match_date,
         'MONTH'::"onat"."StatsPeriodType" AS period_type,
         to_char(month_start, 'YYYY-MM') AS period_key
  FROM periods
  UNION ALL
  SELECT "playerId", "matchClubId", match_date,
         'QUARTER'::"onat"."StatsPeriodType",
         to_char(quarter_start, 'YYYY-"Q"Q')
  FROM periods
  UNION ALL
  SELECT "playerId", "matchClubId", match_date,
         'HALF_YEAR'::"onat"."StatsPeriodType",
         to_char(year_start, 'YYYY') || '-H' ||
           CASE WHEN EXTRACT(month FROM match_date) <= 6 THEN '1' ELSE '2' END
  FROM periods
  UNION ALL
  SELECT "playerId", "matchClubId", match_date,
         'YEAR'::"onat"."StatsPeriodType",
         to_char(year_start, 'YYYY')
  FROM periods
),
club_period_matches AS (
  SELECT mc."clubId", 'MONTH'::"onat"."StatsPeriodType" AS period_type,
         to_char(date_trunc('month', m."stDate"), 'YYYY-MM') AS period_key, COUNT(*) AS club_match_count
  FROM "onat"."MatchClub" mc JOIN "onat"."Match" m ON m.id = mc."matchId"
  WHERE m."stDate" <= now()
  GROUP BY 1,2,3
  UNION ALL
  SELECT mc."clubId", 'QUARTER'::"onat"."StatsPeriodType",
         to_char(date_trunc('quarter', m."stDate"), 'YYYY-"Q"Q'), COUNT(*)
  FROM "onat"."MatchClub" mc JOIN "onat"."Match" m ON m.id = mc."matchId"
  WHERE m."stDate" <= now()
  GROUP BY 1,2,3
  UNION ALL
  SELECT mc."clubId", 'HALF_YEAR'::"onat"."StatsPeriodType",
         to_char(date_trunc('year', m."stDate"), 'YYYY') || '-H' ||
           CASE WHEN EXTRACT(month FROM m."stDate") <= 6 THEN '1' ELSE '2' END,
         COUNT(*)
  FROM "onat"."MatchClub" mc JOIN "onat"."Match" m ON m.id = mc."matchId"
  WHERE m."stDate" <= now()
  GROUP BY 1,2,3
  UNION ALL
  SELECT mc."clubId", 'YEAR'::"onat"."StatsPeriodType",
         to_char(date_trunc('year', m."stDate"), 'YYYY'), COUNT(*)
  FROM "onat"."MatchClub" mc JOIN "onat"."Match" m ON m.id = mc."matchId"
  WHERE m."stDate" <= now()
  GROUP BY 1,2,3
),
aggregate AS (
  SELECT
    e."playerId",
    e.period_type,
    e.period_key,
    ROUND(AVG(r."averageRating")::numeric, 2) AS avg_rating,
    ROUND(SUM(r."averageRating")::numeric, 2) AS total_rating,
    COUNT(DISTINCT v."matchClubId") AS match_count, -- isVote TRUE 경기 수
    COALESCE(SUM(g.cnt), 0) AS total_goal,
    COALESCE(SUM(s.cnt), 0) AS total_assist,
    COALESCE(SUM(l.cnt), 0) AS total_like,
    COALESCE(SUM(v.cnt), 0) AS vote_count
  FROM expanded e
  LEFT JOIN rating r ON r."playerId" = e."playerId" AND r."matchClubId" = e."matchClubId"
  LEFT JOIN goals g ON g."playerId" = e."playerId" AND g."matchClubId" = e."matchClubId"
  LEFT JOIN assists s ON s."playerId" = e."playerId" AND s."matchClubId" = e."matchClubId"
  LEFT JOIN likes l ON l."playerId" = e."playerId" AND l."matchClubId" = e."matchClubId"
  LEFT JOIN votes v ON v."playerId" = e."playerId" AND v."matchClubId" = e."matchClubId"
  GROUP BY 1,2,3
)
INSERT INTO "onat"."PlayerStatsHistory" (
  id, "playerId", "periodType", "periodKey",
  "averageRating", "totalRating", "matchCount",
  "totalGoal", "totalAssist", "totalLike", "voteRate", "calculatedAt"
)
SELECT
  gen_random_uuid(),
  agg."playerId",
  agg.period_type,
  agg.period_key,
  agg.avg_rating,
  agg.total_rating,
  agg.match_count,
  agg.total_goal,
  agg.total_assist,
  agg.total_like,
  CASE
    WHEN cpm.club_match_count > 0
      THEN ROUND((COALESCE(agg.vote_count, 0)::numeric / nullif(cpm.club_match_count,0)) * 100)
    ELSE 0
  END AS voteRate,
  now()
FROM aggregate agg
JOIN "onat"."Player" p ON p.id = agg."playerId"
JOIN club_period_matches cpm
  ON cpm."clubId" = p."clubId"
 AND cpm.period_type = agg.period_type
 AND cpm.period_key = agg.period_key
ON CONFLICT ("playerId", "periodType", "periodKey") DO UPDATE SET
  "averageRating" = EXCLUDED."averageRating",
  "totalRating"   = EXCLUDED."totalRating",
  "matchCount"    = EXCLUDED."matchCount",
  "totalGoal"     = EXCLUDED."totalGoal",
  "totalAssist"   = EXCLUDED."totalAssist",
  "totalLike"     = EXCLUDED."totalLike",
  "voteRate"      = EXCLUDED."voteRate",
  "calculatedAt"  = now();
