-- 1) NOT NULL 잠시 해제
ALTER TABLE "Match" ALTER COLUMN "description" DROP NOT NULL;

-- 2) JSONB로 안전하게 캐스팅 (기존 텍스트는 문자열 JSON으로 변환)
ALTER TABLE "Match"
  ALTER COLUMN "description" TYPE jsonb
  USING (
    CASE
      WHEN "description" IS NULL THEN NULL
      ELSE to_jsonb("description")
    END
  );

-- 3) Lexical 기본 상태로 비어 있는 값 채우기
UPDATE "Match"
SET "description" = '{
  "root": {
    "children": [],
    "direction": null,
    "format": "",
    "indent": 0,
    "type": "root",
    "version": 1
  }
}'::jsonb
WHERE "description" IS NULL
   OR "description" = '{}'::jsonb
   OR "description" = '""'::jsonb; -- 빈 문자열이 있었다면

-- 4) 다시 NOT NULL 설정
ALTER TABLE "Match" ALTER COLUMN "description" SET NOT NULL;