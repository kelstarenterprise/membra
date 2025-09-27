-- Add generation count to member_id_cards table
ALTER TABLE "public"."member_id_cards" ADD COLUMN "generationCount" INTEGER NOT NULL DEFAULT 1;

-- Add last generated timestamp
ALTER TABLE "public"."member_id_cards" ADD COLUMN "lastGeneratedAt" TIMESTAMP(3);

-- Update existing cards to have proper timestamps
UPDATE "public"."member_id_cards" 
SET "lastGeneratedAt" = "issuedAt" 
WHERE "issuedAt" IS NOT NULL;

-- Create index for better query performance
CREATE INDEX "member_id_cards_lastGeneratedAt_idx" ON "public"."member_id_cards"("lastGeneratedAt");
CREATE INDEX "member_id_cards_generationCount_idx" ON "public"."member_id_cards"("generationCount");