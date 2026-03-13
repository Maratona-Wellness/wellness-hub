-- AlterTable: Make Program.tenantId optional
ALTER TABLE "programs" ALTER COLUMN "tenant_id" DROP NOT NULL;

-- DropForeignKey: Change cascade to set null
ALTER TABLE "programs" DROP CONSTRAINT IF EXISTS "programs_tenant_id_fkey";
ALTER TABLE "programs" ADD CONSTRAINT "programs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: TenantProgram (many-to-many)
CREATE TABLE "tenant_programs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_programs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenant_programs_tenant_id_idx" ON "tenant_programs"("tenant_id");
CREATE INDEX "tenant_programs_program_id_idx" ON "tenant_programs"("program_id");
CREATE INDEX "tenant_programs_active_idx" ON "tenant_programs"("active");
CREATE UNIQUE INDEX "tenant_programs_tenant_id_program_id_key" ON "tenant_programs"("tenant_id", "program_id");

-- AddForeignKey
ALTER TABLE "tenant_programs" ADD CONSTRAINT "tenant_programs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tenant_programs" ADD CONSTRAINT "tenant_programs_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing data: Create TenantProgram entries for existing programs with tenantId
INSERT INTO "tenant_programs" ("id", "tenant_id", "program_id", "active", "created_at", "updated_at")
SELECT gen_random_uuid(), "tenant_id", "id", "active", "created_at", NOW()
FROM "programs"
WHERE "tenant_id" IS NOT NULL;
