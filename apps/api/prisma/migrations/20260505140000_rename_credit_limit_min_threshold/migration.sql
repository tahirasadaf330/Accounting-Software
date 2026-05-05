-- Rename: creditLimitMinThreshold -> minThreshold (semantics also change to "minimum allowed transaction amount")
ALTER TABLE "contacts" RENAME COLUMN "creditLimitMinThreshold" TO "minThreshold";
