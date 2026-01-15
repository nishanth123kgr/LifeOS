-- AlterTable
ALTER TABLE "budget_items" ADD COLUMN     "linkedGoalId" TEXT;

-- CreateIndex
CREATE INDEX "budget_items_linkedGoalId_idx" ON "budget_items"("linkedGoalId");

-- AddForeignKey
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_linkedGoalId_fkey" FOREIGN KEY ("linkedGoalId") REFERENCES "financial_goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
