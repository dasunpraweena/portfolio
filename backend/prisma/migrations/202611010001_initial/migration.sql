-- Generated offline with Prisma 7.10.1; application schema only.
BEGIN;
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "portfolio";

-- CreateEnum
CREATE TYPE "portfolio"."PublicationStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "portfolio"."ProjectCategory" AS ENUM ('WEB', 'SOFTWARE', 'DATA');

-- CreateEnum
CREATE TYPE "portfolio"."WorkKind" AS ENUM ('CONCEPT', 'ACADEMIC');

-- CreateEnum
CREATE TYPE "portfolio"."AssetKind" AS ENUM ('IMAGE', 'PDF');

-- CreateTable
CREATE TABLE "portfolio"."Profile" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "heroTitle" TEXT[],
    "introduction" TEXT NOT NULL,
    "aboutTitle" TEXT[],
    "about" TEXT[],
    "values" TEXT[],
    "location" TEXT NOT NULL,
    "availability" TEXT NOT NULL,
    "status" "portfolio"."PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "photoAssetId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio"."SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "defaultTheme" TEXT NOT NULL DEFAULT 'dark',
    "showAvailability" BOOLEAN NOT NULL DEFAULT true,
    "sectionOrder" TEXT[],
    "sectionCopy" JSONB NOT NULL DEFAULT '{}',
    "internalNotes" TEXT,
    "cvAssetId" UUID,
    "cvPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio"."Project" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" "portfolio"."ProjectCategory" NOT NULL,
    "short" TEXT NOT NULL,
    "tags" TEXT[],
    "visual" TEXT NOT NULL,
    "workKind" "portfolio"."WorkKind" NOT NULL DEFAULT 'CONCEPT',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "implementationStatus" TEXT,
    "problem" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "features" TEXT[],
    "contribution" TEXT,
    "lessons" TEXT,
    "repositoryUrl" TEXT,
    "demoUrl" TEXT,
    "status" "portfolio"."PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio"."Technology" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Technology_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio"."ProjectTechnology" (
    "projectId" UUID NOT NULL,
    "technologyId" UUID NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProjectTechnology_pkey" PRIMARY KEY ("projectId","technologyId")
);

-- CreateTable
CREATE TABLE "portfolio"."ProjectAsset" (
    "projectId" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "caption" TEXT,
    "illustrative" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProjectAsset_pkey" PRIMARY KEY ("projectId","assetId")
);

-- CreateTable
CREATE TABLE "portfolio"."SkillCategory" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "status" "portfolio"."PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio"."Skill" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "portfolio"."PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio"."LearningTopic" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "focus" TEXT[],
    "goal" TEXT NOT NULL,
    "learningStatus" TEXT NOT NULL DEFAULT 'Currently learning',
    "status" "portfolio"."PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio"."JourneyMilestone" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "routeLabel" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "tags" TEXT[],
    "linkSection" TEXT,
    "linkLabel" TEXT,
    "occurredAt" DATE,
    "status" "portfolio"."PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JourneyMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio"."Education" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "faculty" TEXT,
    "degree" TEXT NOT NULL,
    "studyStatus" TEXT NOT NULL,
    "coursework" TEXT[],
    "achievements" TEXT[],
    "startDate" DATE,
    "endDate" DATE,
    "status" "portfolio"."PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio"."Experience" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "organisation" TEXT,
    "description" TEXT,
    "startDate" DATE,
    "endDate" DATE,
    "status" "portfolio"."PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio"."Certificate" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "completedAt" DATE,
    "credentialId" TEXT,
    "verificationUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "assetId" UUID,
    "status" "portfolio"."PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio"."SocialLink" (
    "id" UUID NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT,
    "status" "portfolio"."PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio"."ContactMessage" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio"."Asset" (
    "id" UUID NOT NULL,
    "kind" "portfolio"."AssetKind" NOT NULL,
    "privatePath" TEXT NOT NULL,
    "publicPath" TEXT,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "uploadedBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "portfolio"."Project"("slug");

-- CreateIndex
CREATE INDEX "Project_status_category_sortOrder_idx" ON "portfolio"."Project"("status", "category", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Technology_name_key" ON "portfolio"."Technology"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SkillCategory_slug_key" ON "portfolio"."SkillCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_categoryId_name_key" ON "portfolio"."Skill"("categoryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "LearningTopic_slug_key" ON "portfolio"."LearningTopic"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "JourneyMilestone_slug_key" ON "portfolio"."JourneyMilestone"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Education_slug_key" ON "portfolio"."Education"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Experience_slug_key" ON "portfolio"."Experience"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_slug_key" ON "portfolio"."Certificate"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SocialLink_platform_key" ON "portfolio"."SocialLink"("platform");

-- CreateIndex
CREATE INDEX "ContactMessage_createdAt_idx" ON "portfolio"."ContactMessage"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_privatePath_key" ON "portfolio"."Asset"("privatePath");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_publicPath_key" ON "portfolio"."Asset"("publicPath");

-- AddForeignKey
ALTER TABLE "portfolio"."Profile" ADD CONSTRAINT "Profile_photoAssetId_fkey" FOREIGN KEY ("photoAssetId") REFERENCES "portfolio"."Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio"."SiteSettings" ADD CONSTRAINT "SiteSettings_cvAssetId_fkey" FOREIGN KEY ("cvAssetId") REFERENCES "portfolio"."Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio"."ProjectTechnology" ADD CONSTRAINT "ProjectTechnology_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "portfolio"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio"."ProjectTechnology" ADD CONSTRAINT "ProjectTechnology_technologyId_fkey" FOREIGN KEY ("technologyId") REFERENCES "portfolio"."Technology"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio"."ProjectAsset" ADD CONSTRAINT "ProjectAsset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "portfolio"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio"."ProjectAsset" ADD CONSTRAINT "ProjectAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "portfolio"."Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio"."Skill" ADD CONSTRAINT "Skill_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "portfolio"."SkillCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio"."Certificate" ADD CONSTRAINT "Certificate_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "portfolio"."Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Defense in depth: no Data API role can reach application tables.
REVOKE ALL ON SCHEMA portfolio FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON ALL TABLES IN SCHEMA portfolio FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA portfolio FROM PUBLIC, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA portfolio REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA portfolio REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA portfolio REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated, service_role;
ALTER TABLE portfolio."Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio."SiteSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio."Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio."Technology" ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio."ProjectTechnology" ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio."ProjectAsset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio."SkillCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio."Skill" ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio."LearningTopic" ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio."JourneyMilestone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio."Education" ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio."Experience" ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio."Certificate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio."SocialLink" ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio."ContactMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio."Asset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio."Project" ADD CONSTRAINT "Project_order_nonnegative" CHECK ("sortOrder" >= 0);
ALTER TABLE portfolio."ProjectTechnology" ADD CONSTRAINT "ProjectTechnology_order_nonnegative" CHECK ("sortOrder" >= 0);
ALTER TABLE portfolio."ProjectAsset" ADD CONSTRAINT "ProjectAsset_order_nonnegative" CHECK ("sortOrder" >= 0);
ALTER TABLE portfolio."SkillCategory" ADD CONSTRAINT "SkillCategory_order_nonnegative" CHECK ("sortOrder" >= 0);
ALTER TABLE portfolio."Skill" ADD CONSTRAINT "Skill_order_nonnegative" CHECK ("sortOrder" >= 0);
ALTER TABLE portfolio."LearningTopic" ADD CONSTRAINT "LearningTopic_order_nonnegative" CHECK ("sortOrder" >= 0);
ALTER TABLE portfolio."JourneyMilestone" ADD CONSTRAINT "JourneyMilestone_order_nonnegative" CHECK ("sortOrder" >= 0);
ALTER TABLE portfolio."Education" ADD CONSTRAINT "Education_order_nonnegative" CHECK ("sortOrder" >= 0);
ALTER TABLE portfolio."Experience" ADD CONSTRAINT "Experience_order_nonnegative" CHECK ("sortOrder" >= 0);
ALTER TABLE portfolio."Certificate" ADD CONSTRAINT "Certificate_order_nonnegative" CHECK ("sortOrder" >= 0);
ALTER TABLE portfolio."SocialLink" ADD CONSTRAINT "SocialLink_order_nonnegative" CHECK ("sortOrder" >= 0);
ALTER TABLE portfolio."Profile" ADD CONSTRAINT "profile_singleton" CHECK (id = 'main');
ALTER TABLE portfolio."SiteSettings" ADD CONSTRAINT "settings_singleton" CHECK (id = 'main'), ADD CONSTRAINT "valid_theme" CHECK ("defaultTheme" IN ('dark','light')), ADD CONSTRAINT "published_cv_requires_file" CHECK (NOT "cvPublished" OR "cvAssetId" IS NOT NULL);
ALTER TABLE portfolio."Certificate" ADD CONSTRAINT "published_certificate_verified" CHECK (status <> 'PUBLISHED' OR verified);
ALTER TABLE portfolio."Asset" ADD CONSTRAINT "asset_size" CHECK ("sizeBytes" > 0 AND "sizeBytes" <= CASE WHEN kind = 'IMAGE' THEN 8388608 ELSE 10485760 END), ADD CONSTRAINT "asset_mime" CHECK ((kind = 'IMAGE' AND "mimeType" IN ('image/jpeg','image/png','image/webp')) OR (kind = 'PDF' AND "mimeType" = 'application/pdf')), ADD CONSTRAINT "asset_hash" CHECK (sha256 ~ '^[a-f0-9]{64}$'), ADD CONSTRAINT "asset_copy_key" CHECK ("publicPath" IS NULL OR "publicPath" = "privatePath");
ALTER TABLE portfolio."Education" ADD CONSTRAINT "Education_date_order" CHECK ("startDate" IS NULL OR "endDate" IS NULL OR "startDate" <= "endDate");
ALTER TABLE portfolio."Experience" ADD CONSTRAINT "Experience_date_order" CHECK ("startDate" IS NULL OR "endDate" IS NULL OR "startDate" <= "endDate");
ALTER TABLE portfolio."Profile" ALTER COLUMN "heroTitle" SET NOT NULL, ALTER COLUMN "heroTitle" SET DEFAULT ARRAY[]::text[];
ALTER TABLE portfolio."Profile" ALTER COLUMN "aboutTitle" SET NOT NULL, ALTER COLUMN "aboutTitle" SET DEFAULT ARRAY[]::text[];
ALTER TABLE portfolio."Profile" ALTER COLUMN "about" SET NOT NULL, ALTER COLUMN "about" SET DEFAULT ARRAY[]::text[];
ALTER TABLE portfolio."Profile" ALTER COLUMN "values" SET NOT NULL, ALTER COLUMN "values" SET DEFAULT ARRAY[]::text[];
ALTER TABLE portfolio."SiteSettings" ALTER COLUMN "sectionOrder" SET NOT NULL, ALTER COLUMN "sectionOrder" SET DEFAULT ARRAY[]::text[];
ALTER TABLE portfolio."Project" ALTER COLUMN "tags" SET NOT NULL, ALTER COLUMN "tags" SET DEFAULT ARRAY[]::text[];
ALTER TABLE portfolio."Project" ALTER COLUMN "features" SET NOT NULL, ALTER COLUMN "features" SET DEFAULT ARRAY[]::text[];
ALTER TABLE portfolio."LearningTopic" ALTER COLUMN "focus" SET NOT NULL, ALTER COLUMN "focus" SET DEFAULT ARRAY[]::text[];
ALTER TABLE portfolio."JourneyMilestone" ALTER COLUMN "tags" SET NOT NULL, ALTER COLUMN "tags" SET DEFAULT ARRAY[]::text[];
ALTER TABLE portfolio."Education" ALTER COLUMN "coursework" SET NOT NULL, ALTER COLUMN "coursework" SET DEFAULT ARRAY[]::text[];
ALTER TABLE portfolio."Education" ALTER COLUMN "achievements" SET NOT NULL, ALTER COLUMN "achievements" SET DEFAULT ARRAY[]::text[];
COMMIT;
