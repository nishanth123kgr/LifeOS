'use client';

import { useQuery } from '@tanstack/react-query';
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
  Settings2,
  TrendingUp,
  Flame
} from 'lucide-react';

interface DashboardData {
  user: { name: string; currency: string };
  lifeScore: number;
  scores: { finance: number; fitness: number; habits: number; systems: number };
  weights: { finance: number; fitness: number; habits: number; systems: number };
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
  systems: {
    totalSystems: number;
    systems: Array<{ id: string; name: string; adherence: number; isOnTrack: boolean }>;
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

  // Prepare chart data
  const financialChartData = dashboard.financial.goals.map(g => ({
    name: g.name,
    value: g.progress,
  }));

  const savingsAllocationData = dashboard.financial.goals.map(g => ({
    name: g.name,
    value: g.currentAmount,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {dashboard.user?.name || 'User'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Here's how your life goals are progressing</p>
        </div>

        {/* Life Score Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 flex flex-col items-center justify-center py-8">
            <LifeScoreCircle score={dashboard.lifeScore} size="lg" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              {dashboard.lifeScore >= 75 ? "You're crushing it!" :
               dashboard.lifeScore >= 50 ? 'Good progress, keep going!' :
               'Time to focus on your goals'}
            </p>
          </Card>
          
          <Card className="lg:col-span-2">
            <CardHeader title="Score Breakdown" subtitle="How each area contributes to your Life Score" />
            <ScoreBreakdown scores={dashboard.scores} weights={dashboard.weights} />
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-500/20 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Financial Goals</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboard.financial.totalGoals}</p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-success-100 dark:bg-success-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success-600 dark:text-success-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Saved</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(dashboard.financial.totalSaved, currency)}
                </p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-warning-100 dark:bg-warning-500/20 rounded-xl flex items-center justify-center">
                <Flame className="w-6 h-6 text-warning-600 dark:text-warning-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Habits</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboard.habits.totalHabits}</p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-danger-100 dark:bg-danger-500/20 rounded-xl flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-danger-600 dark:text-danger-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Streak Days</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboard.habits.totalStreakDays}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Financial Goals Progress" subtitle="Progress towards each goal" />
            {financialChartData.length > 0 ? (
              <ProgressBarChart data={financialChartData} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                No financial goals yet
              </div>
            )}
          </Card>
          
          <Card>
            <CardHeader title="Savings Allocation" subtitle="How your savings are distributed" />
            {savingsAllocationData.length > 0 && savingsAllocationData.some(d => d.value > 0) ? (
              <DonutChart data={savingsAllocationData} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                No savings data yet
              </div>
            )}
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Habits */}
          <Card>
            <CardHeader title="Today's Habits" subtitle="Check in to maintain your streaks" />
            <div className="space-y-3">
              {dashboard.habits.habits.length > 0 ? (
                dashboard.habits.habits.slice(0, 5).map((habit) => (
                  <div key={habit.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        habit.checkedInToday ? 'bg-success-100 dark:bg-success-500/20 text-success-600 dark:text-success-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                      }`}>
                        <CheckSquare className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{habit.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-warning-500" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{habit.currentStreak} day streak</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No habits created yet</p>
              )}
            </div>
          </Card>

          {/* Systems */}
          <Card>
            <CardHeader title="Life Systems" subtitle="Your behavioral rules and adherence" />
            <div className="space-y-3">
              {dashboard.systems.systems.length > 0 ? (
                dashboard.systems.systems.slice(0, 5).map((system) => (
                  <div key={system.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        system.isOnTrack ? 'bg-success-100 dark:bg-success-500/20 text-success-600 dark:text-success-400' : 'bg-warning-100 dark:bg-warning-500/20 text-warning-600 dark:text-warning-400'
                      }`}>
                        <Settings2 className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{system.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ProgressBar value={system.adherence} size="sm" showLabel={false} className="w-20" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{system.adherence}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No life systems created yet</p>
              )}
            </div>
          </Card>
        </div>

        {/* Financial Goals List */}
        <Card>
          <CardHeader title="Financial Goals" subtitle="Track your progress towards financial freedom" />
          <div className="space-y-4">
            {dashboard.financial.goals.length > 0 ? (
              dashboard.financial.goals.map((goal) => (
                <div key={goal.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{goal.name}</h4>
                    <StatusBadge status={goal.status} />
                  </div>
                  <ProgressBar value={goal.progress} size="md" showLabel={false} />
                  <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>{formatCurrency(goal.currentAmount, currency)}</span>
                    <span>{formatCurrency(goal.targetAmount, currency)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No financial goals yet. Create one to get started!</p>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
