/*
  Warnings:

  - The values [SAVINGS,INVESTMENTS] on the enum `BudgetCategory` will be removed. If these variants are still used in the database, this will fail.

*/

-- First, delete any budget items with SAVINGS or INVESTMENTS categories
DELETE FROM "budget_items" WHERE "category" IN ('SAVINGS', 'INVESTMENTS');

-- Delete any budget template items with SAVINGS or INVESTMENTS categories
DELETE FROM "budget_template_items" WHERE "category" IN ('SAVINGS', 'INVESTMENTS');

-- AlterEnum
BEGIN;
CREATE TYPE "BudgetCategory_new" AS ENUM ('RENT', 'FOOD', 'TRANSPORT', 'SUBSCRIPTIONS', 'UTILITIES', 'HEALTHCARE', 'ENTERTAINMENT', 'SHOPPING', 'MISCELLANEOUS', 'FINANCIAL_GOAL');
ALTER TABLE "budget_items" ALTER COLUMN "category" TYPE "BudgetCategory_new" USING ("category"::text::"BudgetCategory_new");
ALTER TABLE "budget_template_items" ALTER COLUMN "category" TYPE "BudgetCategory_new" USING ("category"::text::"BudgetCategory_new");
ALTER TYPE "BudgetCategory" RENAME TO "BudgetCategory_old";
ALTER TYPE "BudgetCategory_new" RENAME TO "BudgetCategory";
DROP TYPE "BudgetCategory_old";
COMMIT;
