-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'INR', 'EUR', 'GBP');

-- CreateEnum
CREATE TYPE "RiskPreference" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "FinancialGoalType" AS ENUM ('EMERGENCY_FUND', 'MARRIAGE_FUND', 'CAR_FUND', 'HOME_DOWN_PAYMENT', 'INVESTMENTS', 'RETIREMENT', 'EDUCATION', 'VACATION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ON_TRACK', 'NEEDS_FOCUS', 'BEHIND', 'COMPLETED', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FitnessMetricType" AS ENUM ('WEIGHT', 'BODY_FAT', 'STEPS', 'STRENGTH', 'CARDIO', 'FLEXIBILITY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "HabitFrequency" AS ENUM ('DAILY', 'WEEKLY', 'WEEKDAYS', 'WEEKENDS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SystemCategory" AS ENUM ('FINANCE', 'HEALTH', 'PRODUCTIVITY', 'RELATIONSHIPS', 'LEARNING', 'CUSTOM');

-- CreateEnum
CREATE TYPE "BudgetCategory" AS ENUM ('RENT', 'FOOD', 'TRANSPORT', 'SUBSCRIPTIONS', 'UTILITIES', 'HEALTHCARE', 'ENTERTAINMENT', 'SHOPPING', 'SAVINGS', 'INVESTMENTS', 'MISCELLANEOUS');

-- CreateEnum
CREATE TYPE "AchievementCategory" AS ENUM ('FINANCE', 'FITNESS', 'HABITS', 'SYSTEMS', 'GENERAL');

-- CreateEnum
CREATE TYPE "TemplateCategory" AS ENUM ('FINANCIAL', 'FITNESS', 'HABIT');

-- CreateEnum
CREATE TYPE "ContributionFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER,
    "country" TEXT,
    "currency" "Currency" NOT NULL DEFAULT 'INR',
    "monthlyIncome" DOUBLE PRECISION,
    "riskPreference" "RiskPreference" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FinancialGoalType" NOT NULL,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "currentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyContribution" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'ON_TRACK',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fitness_goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metricType" "FitnessMetricType" NOT NULL,
    "startValue" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'ON_TRACK',
    "isAchieved" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fitness_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fitness_progress" (
    "id" TEXT NOT NULL,
    "fitnessGoalId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "fitness_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "frequency" "HabitFrequency" NOT NULL,
    "targetCount" INTEGER NOT NULL DEFAULT 1,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isQuantity" BOOLEAN NOT NULL DEFAULT false,
    "quantityUnit" TEXT,
    "quantityTarget" DOUBLE PRECISION,
    "streakFreezeUsed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_check_ins" (
    "id" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "quantity" DOUBLE PRECISION,
    "notes" TEXT,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habit_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "life_systems" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "SystemCategory" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "adherenceTarget" DOUBLE PRECISION NOT NULL DEFAULT 80,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "life_systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_adherence" (
    "id" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "adhered" BOOLEAN NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_adherence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "income" DOUBLE PRECISION NOT NULL,
    "rolloverAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_items" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "category" "BudgetCategory" NOT NULL,
    "planned" DOUBLE PRECISION NOT NULL,
    "actual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rollover" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_snapshots" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "lifeScore" INTEGER NOT NULL,
    "financeScore" INTEGER NOT NULL,
    "fitnessScore" INTEGER NOT NULL,
    "habitsScore" INTEGER NOT NULL,
    "systemsScore" INTEGER NOT NULL,
    "totalSaved" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activeHabits" INTEGER NOT NULL DEFAULT 0,
    "activeGoals" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" "AchievementCategory" NOT NULL,
    "criteria" JSONB NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "TemplateCategory" NOT NULL,
    "type" TEXT NOT NULL,
    "defaultTarget" DOUBLE PRECISION,
    "defaultDuration" INTEGER,
    "icon" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_milestones" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "goalType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_contributions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "goalType" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "frequency" "ContributionFrequency" NOT NULL,
    "nextRunDate" TIMESTAMP(3) NOT NULL,
    "lastRunDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "content" TEXT NOT NULL,
    "mood" INTEGER,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "language" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "weekStartsOn" INTEGER NOT NULL DEFAULT 0,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "habitReminders" BOOLEAN NOT NULL DEFAULT true,
    "reminderTime" TEXT NOT NULL DEFAULT '20:00',
    "dashboardLayout" JSONB,
    "streakFreezeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FinancialGoalToLifeSystem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_FitnessGoalToLifeSystem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_HabitToLifeSystem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "habits_userId_isActive_idx" ON "habits"("userId", "isActive");

-- CreateIndex
CREATE INDEX "habit_check_ins_habitId_date_idx" ON "habit_check_ins"("habitId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "habit_check_ins_habitId_date_key" ON "habit_check_ins"("habitId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "system_adherence_systemId_date_key" ON "system_adherence"("systemId", "date");

-- CreateIndex
CREATE INDEX "budgets_userId_year_month_idx" ON "budgets"("userId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_userId_month_year_key" ON "budgets"("userId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "budget_items_budgetId_category_key" ON "budget_items"("budgetId", "category");

-- CreateIndex
CREATE INDEX "progress_snapshots_userId_date_idx" ON "progress_snapshots"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "progress_snapshots_userId_date_key" ON "progress_snapshots"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_code_key" ON "achievements"("code");

-- CreateIndex
CREATE INDEX "user_achievements_userId_idx" ON "user_achievements"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_userId_achievementId_key" ON "user_achievements"("userId", "achievementId");

-- CreateIndex
CREATE INDEX "goal_templates_category_isPublic_idx" ON "goal_templates"("category", "isPublic");

-- CreateIndex
CREATE INDEX "goal_milestones_goalId_goalType_idx" ON "goal_milestones"("goalId", "goalType");

-- CreateIndex
CREATE INDEX "recurring_contributions_userId_isActive_idx" ON "recurring_contributions"("userId", "isActive");

-- CreateIndex
CREATE INDEX "recurring_contributions_nextRunDate_isActive_idx" ON "recurring_contributions"("nextRunDate", "isActive");

-- CreateIndex
CREATE INDEX "journal_entries_userId_date_idx" ON "journal_entries"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "_FinancialGoalToLifeSystem_AB_unique" ON "_FinancialGoalToLifeSystem"("A", "B");

-- CreateIndex
CREATE INDEX "_FinancialGoalToLifeSystem_B_index" ON "_FinancialGoalToLifeSystem"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_FitnessGoalToLifeSystem_AB_unique" ON "_FitnessGoalToLifeSystem"("A", "B");

-- CreateIndex
CREATE INDEX "_FitnessGoalToLifeSystem_B_index" ON "_FitnessGoalToLifeSystem"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_HabitToLifeSystem_AB_unique" ON "_HabitToLifeSystem"("A", "B");

-- CreateIndex
CREATE INDEX "_HabitToLifeSystem_B_index" ON "_HabitToLifeSystem"("B");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_goals" ADD CONSTRAINT "financial_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fitness_goals" ADD CONSTRAINT "fitness_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fitness_progress" ADD CONSTRAINT "fitness_progress_fitnessGoalId_fkey" FOREIGN KEY ("fitnessGoalId") REFERENCES "fitness_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_check_ins" ADD CONSTRAINT "habit_check_ins_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "life_systems" ADD CONSTRAINT "life_systems_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_adherence" ADD CONSTRAINT "system_adherence_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "life_systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_snapshots" ADD CONSTRAINT "progress_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FinancialGoalToLifeSystem" ADD CONSTRAINT "_FinancialGoalToLifeSystem_A_fkey" FOREIGN KEY ("A") REFERENCES "financial_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FinancialGoalToLifeSystem" ADD CONSTRAINT "_FinancialGoalToLifeSystem_B_fkey" FOREIGN KEY ("B") REFERENCES "life_systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FitnessGoalToLifeSystem" ADD CONSTRAINT "_FitnessGoalToLifeSystem_A_fkey" FOREIGN KEY ("A") REFERENCES "fitness_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FitnessGoalToLifeSystem" ADD CONSTRAINT "_FitnessGoalToLifeSystem_B_fkey" FOREIGN KEY ("B") REFERENCES "life_systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HabitToLifeSystem" ADD CONSTRAINT "_HabitToLifeSystem_A_fkey" FOREIGN KEY ("A") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HabitToLifeSystem" ADD CONSTRAINT "_HabitToLifeSystem_B_fkey" FOREIGN KEY ("B") REFERENCES "life_systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
