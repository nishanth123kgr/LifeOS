/*
  Warnings:

  - A unique constraint covering the columns `[budgetId,category,linkedGoalId]` on the table `budget_items` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('EXPENSE', 'GOAL_CONTRIBUTION', 'INCOME', 'TRANSFER');

-- AlterEnum
ALTER TYPE "BudgetCategory" ADD VALUE 'FINANCIAL_GOAL';

-- DropIndex
DROP INDEX "budget_items_budgetId_category_key";

-- AlterTable
ALTER TABLE "budget_items" ADD COLUMN     "name" TEXT;

-- CreateTable
CREATE TABLE "budget_templates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My Budget Template',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_template_items" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "category" "BudgetCategory" NOT NULL,
    "plannedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "linkedGoalId" TEXT,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "TransactionType" NOT NULL,
    "description" TEXT,
    "source" TEXT,
    "destination" TEXT,
    "budgetItemId" TEXT,
    "financialGoalId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "budget_templates_userId_key" ON "budget_templates"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "budget_template_items_templateId_category_linkedGoalId_key" ON "budget_template_items"("templateId", "category", "linkedGoalId");

-- CreateIndex
CREATE INDEX "transactions_userId_date_idx" ON "transactions"("userId", "date");

-- CreateIndex
CREATE INDEX "transactions_budgetItemId_idx" ON "transactions"("budgetItemId");

-- CreateIndex
CREATE INDEX "transactions_financialGoalId_idx" ON "transactions"("financialGoalId");

-- CreateIndex
CREATE UNIQUE INDEX "budget_items_budgetId_category_linkedGoalId_key" ON "budget_items"("budgetId", "category", "linkedGoalId");

-- AddForeignKey
ALTER TABLE "budget_templates" ADD CONSTRAINT "budget_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_template_items" ADD CONSTRAINT "budget_template_items_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "budget_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_budgetItemId_fkey" FOREIGN KEY ("budgetItemId") REFERENCES "budget_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_financialGoalId_fkey" FOREIGN KEY ("financialGoalId") REFERENCES "financial_goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
