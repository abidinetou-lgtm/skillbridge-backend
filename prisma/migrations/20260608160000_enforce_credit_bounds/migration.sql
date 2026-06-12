-- Normalize any legacy balances before enforcing the new permanent bounds.
UPDATE "User"
SET "credits" = LEAST(500, GREATEST(0, "credits"))
WHERE "credits" < 0 OR "credits" > 500;

-- Prevent every database write, including future code paths, from bypassing the bounds.
ALTER TABLE "User"
ADD CONSTRAINT "User_credits_bounds_check"
CHECK ("credits" >= 0 AND "credits" <= 500);
