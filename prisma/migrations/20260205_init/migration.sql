-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('EMPLOYEE', 'THERAPIST', 'TENANT_ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "AuthMethod" AS ENUM ('MAGIC_LINK', 'PASSWORD');

-- CreateEnum
CREATE TYPE "AuthOutcome" AS ENUM ('SUCCESS', 'FAILURE');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "logo_url" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "session_duration_minutes" INTEGER NOT NULL,
    "day_start" TEXT NOT NULL,
    "day_end" TEXT NOT NULL,
    "daily_capacity_per_location" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_accounts" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "display_name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "role_name" "RoleType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "tenant_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "therapists" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "specialties" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "therapists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "therapist_assignments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "therapist_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "therapist_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_slots" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "therapist_id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "slot_date" DATE NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availability_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "therapist_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "slot_id" UUID NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magic_tokens" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "email" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "magic_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "method" "AuthMethod" NOT NULL,
    "outcome" "AuthOutcome" NOT NULL,
    "reason" TEXT,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_domain_key" ON "tenants"("domain");

-- CreateIndex
CREATE INDEX "tenants_domain_idx" ON "tenants"("domain");

-- CreateIndex
CREATE INDEX "tenants_active_idx" ON "tenants"("active");

-- CreateIndex
CREATE INDEX "locations_tenant_id_idx" ON "locations"("tenant_id");

-- CreateIndex
CREATE INDEX "programs_tenant_id_idx" ON "programs"("tenant_id");

-- CreateIndex
CREATE INDEX "programs_active_idx" ON "programs"("active");

-- CreateIndex
CREATE UNIQUE INDEX "user_accounts_email_key" ON "user_accounts"("email");

-- CreateIndex
CREATE INDEX "user_accounts_email_idx" ON "user_accounts"("email");

-- CreateIndex
CREATE INDEX "user_accounts_active_idx" ON "user_accounts"("active");

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_name_key" ON "roles"("role_name");

-- CreateIndex
CREATE INDEX "user_roles_user_id_idx" ON "user_roles"("user_id");

-- CreateIndex
CREATE INDEX "user_roles_tenant_id_idx" ON "user_roles"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_tenant_id_key" ON "user_roles"("user_id", "role_id", "tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_user_id_key" ON "employees"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE INDEX "employees_tenant_id_idx" ON "employees"("tenant_id");

-- CreateIndex
CREATE INDEX "employees_email_idx" ON "employees"("email");

-- CreateIndex
CREATE INDEX "employees_active_idx" ON "employees"("active");

-- CreateIndex
CREATE UNIQUE INDEX "therapists_user_id_key" ON "therapists"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "therapists_email_key" ON "therapists"("email");

-- CreateIndex
CREATE UNIQUE INDEX "therapists_cpf_key" ON "therapists"("cpf");

-- CreateIndex
CREATE INDEX "therapists_email_idx" ON "therapists"("email");

-- CreateIndex
CREATE INDEX "therapists_cpf_idx" ON "therapists"("cpf");

-- CreateIndex
CREATE INDEX "therapists_active_idx" ON "therapists"("active");

-- CreateIndex
CREATE INDEX "therapist_assignments_tenant_id_idx" ON "therapist_assignments"("tenant_id");

-- CreateIndex
CREATE INDEX "therapist_assignments_therapist_id_idx" ON "therapist_assignments"("therapist_id");

-- CreateIndex
CREATE INDEX "therapist_assignments_location_id_idx" ON "therapist_assignments"("location_id");

-- CreateIndex
CREATE INDEX "therapist_assignments_active_idx" ON "therapist_assignments"("active");

-- CreateIndex
CREATE UNIQUE INDEX "therapist_assignments_therapist_id_tenant_id_location_id_key" ON "therapist_assignments"("therapist_id", "tenant_id", "location_id");

-- CreateIndex
CREATE INDEX "availability_slots_tenant_id_idx" ON "availability_slots"("tenant_id");

-- CreateIndex
CREATE INDEX "availability_slots_location_id_idx" ON "availability_slots"("location_id");

-- CreateIndex
CREATE INDEX "availability_slots_therapist_id_idx" ON "availability_slots"("therapist_id");

-- CreateIndex
CREATE INDEX "availability_slots_program_id_idx" ON "availability_slots"("program_id");

-- CreateIndex
CREATE INDEX "availability_slots_slot_date_idx" ON "availability_slots"("slot_date");

-- CreateIndex
CREATE UNIQUE INDEX "availability_slots_therapist_id_location_id_program_id_slot_key" ON "availability_slots"("therapist_id", "location_id", "program_id", "slot_date", "start_time");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_code_key" ON "appointments"("code");

-- CreateIndex
CREATE INDEX "appointments_tenant_id_idx" ON "appointments"("tenant_id");

-- CreateIndex
CREATE INDEX "appointments_employee_id_idx" ON "appointments"("employee_id");

-- CreateIndex
CREATE INDEX "appointments_therapist_id_idx" ON "appointments"("therapist_id");

-- CreateIndex
CREATE INDEX "appointments_location_id_idx" ON "appointments"("location_id");

-- CreateIndex
CREATE INDEX "appointments_slot_id_idx" ON "appointments"("slot_id");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "appointments_start_at_idx" ON "appointments"("start_at");

-- CreateIndex
CREATE INDEX "appointments_code_idx" ON "appointments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "magic_tokens_token_hash_key" ON "magic_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "magic_tokens_email_idx" ON "magic_tokens"("email");

-- CreateIndex
CREATE INDEX "magic_tokens_token_hash_idx" ON "magic_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "magic_tokens_expires_at_idx" ON "magic_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "auth_logs_user_id_idx" ON "auth_logs"("user_id");

-- CreateIndex
CREATE INDEX "auth_logs_created_at_idx" ON "auth_logs"("created_at");

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "therapists" ADD CONSTRAINT "therapists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "therapist_assignments" ADD CONSTRAINT "therapist_assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "therapist_assignments" ADD CONSTRAINT "therapist_assignments_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "therapist_assignments" ADD CONSTRAINT "therapist_assignments_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "availability_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magic_tokens" ADD CONSTRAINT "magic_tokens_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_logs" ADD CONSTRAINT "auth_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

