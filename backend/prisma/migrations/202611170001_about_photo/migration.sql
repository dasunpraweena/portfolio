-- Add separate About section photo relation on Profile.
BEGIN;
ALTER TABLE "portfolio"."Profile" ADD COLUMN "aboutPhotoAssetId" UUID;
ALTER TABLE "portfolio"."Profile" ADD CONSTRAINT "Profile_aboutPhotoAssetId_fkey" FOREIGN KEY ("aboutPhotoAssetId") REFERENCES "portfolio"."Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
COMMIT;

