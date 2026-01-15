/*
  Warnings:

  - You are about to drop the `_FinancialGoalToLifeSystem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_FitnessGoalToLifeSystem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_HabitToLifeSystem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `life_systems` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `system_adherence` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `isPrivate` on table `journal_entries` required. This step will fail if there are existing NULL values in that column.
  - Made the column `wordCount` on table `journal_entries` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "_FinancialGoalToLifeSystem" DROP CONSTRAINT "_FinancialGoalToLifeSystem_A_fkey";

-- DropForeignKey
ALTER TABLE "_FinancialGoalToLifeSystem" DROP CONSTRAINT "_FinancialGoalToLifeSystem_B_fkey";

-- DropForeignKey
ALTER TABLE "_FitnessGoalToLifeSystem" DROP CONSTRAINT "_FitnessGoalToLifeSystem_A_fkey";

-- DropForeignKey
ALTER TABLE "_FitnessGoalToLifeSystem" DROP CONSTRAINT "_FitnessGoalToLifeSystem_B_fkey";

-- DropForeignKey
ALTER TABLE "_HabitToLifeSystem" DROP CONSTRAINT "_HabitToLifeSystem_A_fkey";

-- DropForeignKey
ALTER TABLE "_HabitToLifeSystem" DROP CONSTRAINT "_HabitToLifeSystem_B_fkey";

-- DropForeignKey
ALTER TABLE "life_systems" DROP CONSTRAINT "life_systems_userId_fkey";

-- DropForeignKey
ALTER TABLE "system_adherence" DROP CONSTRAINT "system_adherence_systemId_fkey";

-- AlterTable
ALTER TABLE "journal_entries" ALTER COLUMN "isPrivate" SET NOT NULL,
ALTER COLUMN "wordCount" SET NOT NULL;

-- DropTable
DROP TABLE "_FinancialGoalToLifeSystem";

-- DropTable
DROP TABLE "_FitnessGoalToLifeSystem";

-- DropTable
DROP TABLE "_HabitToLifeSystem";

-- DropTable
DROP TABLE "life_systems";

-- DropTable
DROP TABLE "system_adherence";

-- DropEnum
DROP TYPE "SystemCategory";
