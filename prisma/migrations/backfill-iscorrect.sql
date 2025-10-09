-- Backfill isCorrect for old NovelQuestionCompleted records
-- Logic: If score > 0 and selectedAnswer is NULL (old record), mark as correct
UPDATE "NovelQuestionCompleted"
SET "isCorrect" = true
WHERE "score" > 0
  AND "selectedAnswer" IS NULL;

-- Backfill isCorrect for old RCQuestionCompleted records
-- Logic: If score > 0 and selectedAnswer is NULL (old record), mark as correct
UPDATE "RCQuestionCompleted"
SET "isCorrect" = true
WHERE "score" > 0
  AND "selectedAnswer" IS NULL;

-- Verify the updates
SELECT
  'NovelQuestionCompleted' as table_name,
  COUNT(*) as updated_count
FROM "NovelQuestionCompleted"
WHERE "isCorrect" = true
  AND "selectedAnswer" IS NULL

UNION ALL

SELECT
  'RCQuestionCompleted' as table_name,
  COUNT(*) as updated_count
FROM "RCQuestionCompleted"
WHERE "isCorrect" = true
  AND "selectedAnswer" IS NULL;
