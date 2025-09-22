-- CreateEnum
CREATE TYPE "public"."MemberStatus" AS ENUM ('PROSPECT', 'PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."MembershipLevel" AS ENUM ('ORDINARY', 'EXECUTIVE', 'DELEGATE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."EducationLevel" AS ENUM ('PRIMARY', 'SECONDARY', 'TERTIARY', 'POSTGRADUATE', 'VOCATIONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "public"."BillingCycle" AS ENUM ('ONE_TIME', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('CASH', 'CARD', 'MOBILE_MONEY', 'BANK_TRANSFER', 'WAIVER');

-- CreateEnum
CREATE TYPE "public"."DueStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'WAIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ActivityStatus" AS ENUM ('INVITED', 'REGISTERED', 'ATTENDED', 'ABSENT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "public"."CardStatus" AS ENUM ('PENDING', 'PRINTED', 'ISSUED', 'REVOKED', 'EXPIRED');

-- CreateTable
CREATE TABLE "public"."member_categories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rank" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'MEMBER',
    "memberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."members" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" "public"."Gender" NOT NULL,
    "nationalId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "residentialAddress" TEXT NOT NULL,
    "regionConstituencyElectoralArea" TEXT NOT NULL,
    "email" TEXT,
    "occupation" TEXT,
    "highestEducationLevel" "public"."EducationLevel",
    "membershipLevel" "public"."MembershipLevel" NOT NULL,
    "branchWard" TEXT,
    "recruitedBy" TEXT,
    "memberCategoryId" TEXT,
    "status" "public"."MemberStatus" NOT NULL DEFAULT 'PROSPECT',
    "outstandingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "passportPictureUrl" TEXT,
    "nationality" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dues_plans" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "cycle" "public"."BillingCycle" NOT NULL DEFAULT 'ONE_TIME',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "memberCategoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dues_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."assigned_dues" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "planId" TEXT,
    "memberCategoryId" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "dueDate" TIMESTAMP(3),
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "status" "public"."DueStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assigned_dues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "assignedDueId" TEXT,
    "planId" TEXT,
    "description" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "method" "public"."PaymentMethod" NOT NULL DEFAULT 'CASH',
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activities" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activity_registrations" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" "public"."ActivityStatus" NOT NULL DEFAULT 'INVITED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channel" "public"."NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."member_id_cards" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "status" "public"."CardStatus" NOT NULL DEFAULT 'PENDING',
    "frontImageUrl" TEXT,
    "backImageUrl" TEXT,
    "qrData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_id_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "member_categories_code_key" ON "public"."member_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_memberId_key" ON "public"."users"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "members_membershipId_key" ON "public"."members"("membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "members_nationalId_key" ON "public"."members"("nationalId");

-- CreateIndex
CREATE UNIQUE INDEX "members_email_key" ON "public"."members"("email");

-- CreateIndex
CREATE INDEX "members_status_membershipLevel_idx" ON "public"."members"("status", "membershipLevel");

-- CreateIndex
CREATE INDEX "members_lastName_firstName_idx" ON "public"."members"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "members_branchWard_idx" ON "public"."members"("branchWard");

-- CreateIndex
CREATE INDEX "members_memberCategoryId_idx" ON "public"."members"("memberCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "dues_plans_code_key" ON "public"."dues_plans"("code");

-- CreateIndex
CREATE INDEX "dues_plans_memberCategoryId_idx" ON "public"."dues_plans"("memberCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "assigned_dues_reference_key" ON "public"."assigned_dues"("reference");

-- CreateIndex
CREATE INDEX "assigned_dues_memberId_status_idx" ON "public"."assigned_dues"("memberId", "status");

-- CreateIndex
CREATE INDEX "assigned_dues_memberId_dueDate_idx" ON "public"."assigned_dues"("memberId", "dueDate");

-- CreateIndex
CREATE INDEX "assigned_dues_memberId_periodStart_periodEnd_idx" ON "public"."assigned_dues"("memberId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "assigned_dues_memberCategoryId_idx" ON "public"."assigned_dues"("memberCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_reference_key" ON "public"."payments"("reference");

-- CreateIndex
CREATE INDEX "payments_memberId_paidAt_idx" ON "public"."payments"("memberId", "paidAt");

-- CreateIndex
CREATE INDEX "payments_assignedDueId_idx" ON "public"."payments"("assignedDueId");

-- CreateIndex
CREATE INDEX "activities_startsAt_idx" ON "public"."activities"("startsAt");

-- CreateIndex
CREATE INDEX "activity_registrations_memberId_idx" ON "public"."activity_registrations"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "activity_registrations_activityId_memberId_key" ON "public"."activity_registrations"("activityId", "memberId");

-- CreateIndex
CREATE INDEX "notifications_memberId_createdAt_idx" ON "public"."notifications"("memberId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "member_id_cards_cardNumber_key" ON "public"."member_id_cards"("cardNumber");

-- CreateIndex
CREATE INDEX "member_id_cards_memberId_status_idx" ON "public"."member_id_cards"("memberId", "status");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."members" ADD CONSTRAINT "members_memberCategoryId_fkey" FOREIGN KEY ("memberCategoryId") REFERENCES "public"."member_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."members" ADD CONSTRAINT "members_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."members" ADD CONSTRAINT "members_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dues_plans" ADD CONSTRAINT "dues_plans_memberCategoryId_fkey" FOREIGN KEY ("memberCategoryId") REFERENCES "public"."member_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assigned_dues" ADD CONSTRAINT "assigned_dues_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assigned_dues" ADD CONSTRAINT "assigned_dues_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."dues_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assigned_dues" ADD CONSTRAINT "assigned_dues_memberCategoryId_fkey" FOREIGN KEY ("memberCategoryId") REFERENCES "public"."member_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_assignedDueId_fkey" FOREIGN KEY ("assignedDueId") REFERENCES "public"."assigned_dues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."dues_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_registrations" ADD CONSTRAINT "activity_registrations_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "public"."activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_registrations" ADD CONSTRAINT "activity_registrations_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."member_id_cards" ADD CONSTRAINT "member_id_cards_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
