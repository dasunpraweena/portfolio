-- Certificates studio: add CertificateCategory and extended Certificate fields.
BEGIN;

CREATE TABLE "portfolio"."CertificateCategory" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificateCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CertificateCategory_slug_key" ON "portfolio"."CertificateCategory"("slug");
CREATE UNIQUE INDEX "CertificateCategory_name_key" ON "portfolio"."CertificateCategory"("name");
ALTER TABLE "portfolio"."CertificateCategory" ADD CONSTRAINT "CertificateCategory_order_nonnegative" CHECK ("sortOrder" >= 0);

REVOKE ALL ON TABLE "portfolio"."CertificateCategory" FROM PUBLIC, anon, authenticated, service_role;
ALTER TABLE "portfolio"."CertificateCategory" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "portfolio"."Certificate"
    ADD COLUMN "categoryId" UUID,
    ADD COLUMN "description" TEXT,
    ADD COLUMN "skills" TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
    ADD COLUMN "tools" TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
    ADD COLUMN "duration" TEXT,
    ADD COLUMN "projectUrl" TEXT,
    ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "showOnPortfolio" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "portfolio"."Certificate"
    ADD CONSTRAINT "Certificate_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "portfolio"."CertificateCategory"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "portfolio"."Certificate" DROP CONSTRAINT IF EXISTS "published_certificate_verified";
ALTER TABLE "portfolio"."Certificate" ADD CONSTRAINT "verified_certificate_requires_url" CHECK (NOT "verified" OR "verificationUrl" IS NOT NULL);

INSERT INTO "portfolio"."CertificateCategory" ("id", "slug", "name", "visible", "sortOrder", "updatedAt")
VALUES
    ('11111111-1111-4111-8111-000000000001', 'cybersecurity', 'Cybersecurity', true, 0, CURRENT_TIMESTAMP),
    ('11111111-1111-4111-8111-000000000002', 'software-development', 'Software development', true, 1, CURRENT_TIMESTAMP),
    ('11111111-1111-4111-8111-000000000003', 'achievements', 'Achievements', true, 2, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

COMMIT;
