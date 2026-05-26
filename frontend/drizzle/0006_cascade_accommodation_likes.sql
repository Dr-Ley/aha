ALTER TABLE "likes" DROP CONSTRAINT IF EXISTS "likes_accommodation_id_accommodations_id_fk";

ALTER TABLE "likes"
ADD CONSTRAINT "likes_accommodation_id_accommodations_id_fk"
FOREIGN KEY ("accommodation_id")
REFERENCES "accommodations"("id")
ON DELETE CASCADE;
