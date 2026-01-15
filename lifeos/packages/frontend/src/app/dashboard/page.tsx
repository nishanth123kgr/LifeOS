'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusBadge } from '@/components/ui/Badge';
import { LifeScoreCircle, ScoreBreakdown } from '@/components/dashboard/LifeScore';
import { ProgressBarChart, DonutChart } from '@/components/charts/Charts';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';
import { 
  Target, 
  Dumbbell, 
  CheckSquare, 
  TrendingUp,
  Flame,
  ArrowRight,
  Trophy,
  Sparkles,
  Calendar,
  Wallet,
  Activity,
  ChevronRight,
  Plus
} from 'lucide-react';

interface DashboardData {
  user: { name: string; currency: string };
  lifeScore: number;
  scores: { finance: number; fitness: number; habits: number };
  weights: { finance: number; fitness: number; habits: number };
  financial: {
    totalGoals: number;
    totalTarget: number;
    totalSaved: number;
    goalsByStatus: { onTrack: number; needsFocus: number; behind: number };
    goals: Array<{ id: string; name: string; progress: number; status: string; currentAmount: number; targetAmount: number }>;
  };
  fitness: {
    totalGoals: number;
    goals: Array<{ id: string; name: string; progress: number; status: string; currentValue: number; targetValue: number; unit: string }>;
  };
  habits: {
    totalHabits: number;
    totalStreakDays: number;
    habits: Array<{ id: string; name: string; currentStreak: number; longestStreak: number; checkedInToday: boolean }>;
  };
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery<{ data: DashboardData }>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Failed to load dashboard data</p>
        </div>
      </DashboardLayout>
    );
  }

  const dashboard = data.data;
  const currency = dashboard.user?.currency || 'INR';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const financialChartData = dashboard.financial.goals.map(g => ({
    name: g.name,
    value: g.progress,
  }));

  const savingsAllocationData = dashboard.financial.goals.map(g => ({
    name: g.name,
    value: g.currentAmount,
  }));

  const savingsProgress = dashboard.financial.totalTarget > 0 
    ? Math.round((dashboard.financial.totalSaved / dashboard.financial.totalTarget) * 100)
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl p-6 lg:p-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-primary-100 text-sm mb-2">
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                {getGreeting()}, {dashboard.user?.name?.split(' ')[0] || 'User'}!
              </h1>
              <p className="text-primary-100 max-w-md">
                {dashboard.lifeScore >= 75 
                  ? "You're absolutely crushing your goals! Keep up the amazing work." 
                  : dashboard.lifeScore >= 50 
                  ? "You're making solid progress. A few more steps and you'll be flying!"
                  : "Every journey starts with a single step. Let's build momentum today!"}
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="relative">
                  <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-3xl lg:text-4xl font-bold">{dashboard.lifeScore}</div>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white text-primary-600 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    Life Score
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/goals/financial" className="group">
            <Card className="h-full hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="p-2.5 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/25">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Saved</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(dashboard.financial.totalSaved, currency)}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all"
                      style={{ width: `\${Math.min(savingsProgress, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-500">{savingsProgress}%</span>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/goals/financial" className="group">
            <Card className="h-full hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="p-2.5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg shadow-blue-500/25">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Financial Goals</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {dashboard.financial.totalGoals}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {dashboard.financial.goalsByStatus.onTrack} on track
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/habits" className="group">
            <Card className="h-full hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="p-2.5 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl shadow-lg shadow-orange-500/25">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Streaks</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {dashboard.habits.totalStreakDays} days
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {dashboard.habits.totalHabits} active habits
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/achievements" className="group">
            <Card className="h-full hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="p-2.5 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl shadow-lg shadow-amber-500/25">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Achievements</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  View All
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Unlock rewards
                </p>
              </div>
            </Card>
          </Link>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader title="Life Score Breakdown" subtitle="See how each area contributes to your overall score" />
            <ScoreBreakdown scores={dashboard.scores} weights={dashboard.weights} />
          </Card>

          <Card className="flex flex-col">
            <CardHeader title="Quick Actions" subtitle="Jump to frequently used features" />
            <div className="flex-1 grid grid-cols-2 gap-3">
              <Link
                href="/goals/financial"
                className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors group"
              >
                <div className="p-2 bg-primary-100 dark:bg-primary-500/20 rounded-lg group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-2">Add Goal</span>
              </Link>
              <Link
                href="/habits"
                className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors group"
              >
                <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-lg group-hover:scale-110 transition-transform">
                  <CheckSquare className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-2">Check In</span>
              </Link>
              <Link
                href="/journal"
                className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors group"
              >
                <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-2">Journal</span>
              </Link>
              <Link
                href="/projections"
                className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors group"
              >
                <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-2">Projections</span>
              </Link>
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Goal Progress" subtitle="Track each financial goal" />
            {financialChartData.length > 0 ? (
              <ProgressBarChart data={financialChartData} />
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                <Target className="w-12 h-12 mb-3 opacity-30" />
                <p>No financial goals yet</p>
                <Link href="/goals/financial" className="text-primary-500 text-sm mt-2 hover:underline">
                  Create your first goal
                </Link>
              </div>
            )}
          </Card>
          
          <Card>
            <CardHeader title="Savings Distribution" subtitle="How your savings are allocated" />
            {savingsAllocationData.length > 0 && savingsAllocationData.some(d => d.value > 0) ? (
              <DonutChart data={savingsAllocationData} />
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                <Wallet className="w-12 h-12 mb-3 opacity-30" />
                <p>No savings data yet</p>
                <Link href="/goals/financial" className="text-primary-500 text-sm mt-2 hover:underline">
                  Start saving
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Activity Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Habits */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardHeader title="Today's Habits" subtitle="Check in to maintain streaks" className="mb-0" />
              <Link href="/habits" className="text-sm text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {dashboard.habits.habits.length > 0 ? (
                dashboard.habits.habits.slice(0, 4).map((habit) => (
                  <div 
                    key={habit.id} 
                    className={`flex items-center justify-between p-3 rounded-xl transition-all \${
                      habit.checkedInToday 
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' 
                        : 'bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center \${
                        habit.checkedInToday 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                      }`}>
                        <CheckSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">{habit.name}</span>
                        {habit.checkedInToday && (
                          <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">Done</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{habit.currentStreak}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No habits yet</p>
                  <Link href="/habits" className="text-primary-500 text-sm mt-2 inline-block hover:underline">
                    Create your first habit
                  </Link>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Financial Goals Overview */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardHeader title="Financial Goals" subtitle="Your journey to financial freedom" className="mb-0" />
            <Link href="/goals/financial" className="text-sm text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1">
              Manage goals <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {dashboard.financial.goals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboard.financial.goals.slice(0, 6).map((goal) => (
                <div 
                  key={goal.id} 
                  className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:border-primary-300 dark:hover:border-primary-700 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{goal.name}</h4>
                    <StatusBadge status={goal.status} />
                  </div>
                  <div className="relative pt-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-primary-600 dark:text-primary-400">
                        {Math.round(goal.progress)}%
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {formatCurrency(goal.targetAmount, currency)}
                      </span>
                    </div>
                    <ProgressBar value={goal.progress} size="sm" showLabel={false} />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                    Saved: <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(goal.currentAmount, currency)}</span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No financial goals yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
                Start your journey to financial freedom by creating your first savings goal.
              </p>
              <Link
                href="/goals/financial"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Goal
              </Link>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
