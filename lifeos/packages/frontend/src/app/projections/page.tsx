'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  Zap, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  DollarSign,
  PiggyBank,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';

interface Projection {
  goalId: string;
  goalName: string;
  currentAmount: number;
  targetAmount: number;
  monthlyRequired: number;
  weeklyRequired: number;
  dailyRequired: number;
  projectedCompletion: string | null;
  isOnTrack: boolean;
  progressPercentage: number;
  remainingAmount: number;
  daysRemaining: number;
  projectedFinalAmount?: number;
  scenarios: Array<{
    name: string;
    monthlyAmount: number;
    completionDate: string;
    finalAmount: number;
  }>;
}

interface ProjectionSummary {
  totalGoals: number;
  onTrack: number;
  offTrack: number;
  totalMonthlyRequired: number;
  overallProgress: number;
}

interface ProjectionResponse {
  projections: Projection[];
  summary: ProjectionSummary;
}

export default function ProjectionsPage() {
  const { user } = useAuthStore();
  const currency = user?.currency || 'INR';
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery<ProjectionResponse>({
    queryKey: ['projections'],
    queryFn: async () => {
      const response = await api.get('/projections/all');
      return response.data;
    },
  });

  const projections = data?.projections || [];
  const summary = data?.summary;
  const selectedProjection = projections.find(p => p.goalId === selectedGoal);

  // Auto-select first goal if none selected
  if (!selectedGoal && projections.length > 0 && !selectedProjection) {
    setSelectedGoal(projections[0].goalId);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-8">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">Financial Projections</h1>
              </div>
              <p className="text-white/80 max-w-md">
                See when you'll reach your goals and get personalized saving recommendations.
              </p>
            </div>
            <Button 
              onClick={() => refetch()} 
              disabled={isRefetching}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white"
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isRefetching && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
          </div>
        ) : projections.length === 0 ? (
          <Card className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
              <TrendingUp className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No projections available</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Create some financial goals to see projections on when you'll achieve them.
            </p>
            <Button onClick={() => window.location.href = '/goals/financial'}>
              <Target className="w-4 h-4 mr-2" />
              Create Financial Goals
            </Button>
          </Card>
        ) : (
          <>
            {/* Summary Stats */}
            {summary && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-bl-full" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-emerald-500" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">Active Goals</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{summary.totalGoals}</p>
                  </div>
                </Card>

                <Card className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-bl-full" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">On Track</span>
                    </div>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{summary.onTrack}</p>
                  </div>
                </Card>

                <Card className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-bl-full" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">Needs Attention</span>
                    </div>
                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{summary.offTrack}</p>
                  </div>
                </Card>

                <Card className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-bl-full" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <PiggyBank className="w-5 h-5 text-blue-500" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">Monthly Required</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(summary.totalMonthlyRequired, currency)}
                    </p>
                  </div>
                </Card>
              </div>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Goals List */}
              <Card className="lg:col-span-1">
                <CardHeader title="Your Goals" subtitle={`${projections.length} active goals`} />
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {projections.map(projection => {
                    const progress = Math.min(100, projection.progressPercentage);
                    
                    return (
                      <button
                        key={projection.goalId}
                        onClick={() => setSelectedGoal(projection.goalId)}
                        className={cn(
                          'w-full text-left p-4 rounded-xl border-2 transition-all duration-200 group',
                          selectedGoal === projection.goalId
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white dark:bg-gray-800'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {projection.goalName}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {projection.daysRemaining > 0 
                                ? `${projection.daysRemaining} days remaining`
                                : 'Past target date'
                              }
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={cn(
                              'text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1',
                              projection.isOnTrack
                                ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                                : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                            )}>
                              {projection.isOnTrack ? (
                                <ArrowUpRight className="w-3 h-3" />
                              ) : (
                                <ArrowDownRight className="w-3 h-3" />
                              )}
                              {projection.isOnTrack ? 'On Track' : 'Behind'}
                            </span>
                            <ChevronRight className={cn(
                              "w-4 h-4 text-gray-400 transition-transform",
                              selectedGoal === projection.goalId && "rotate-90"
                            )} />
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mb-2">
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                'h-full rounded-full transition-all duration-500',
                                projection.isOnTrack ? 'bg-emerald-500' : 'bg-amber-500'
                              )}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {formatCurrency(projection.currentAmount, currency)}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {progress.toFixed(0)}%
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {formatCurrency(projection.targetAmount, currency)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Projection Details */}
              <Card className="lg:col-span-2">
                <CardHeader title="Projection Details" />
                {selectedProjection ? (
                  <div className="space-y-6">
                    {/* Goal Header */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        selectedProjection.isOnTrack 
                          ? "bg-emerald-100 dark:bg-emerald-900/30" 
                          : "bg-amber-100 dark:bg-amber-900/30"
                      )}>
                        <Target className={cn(
                          "w-6 h-6",
                          selectedProjection.isOnTrack 
                            ? "text-emerald-600 dark:text-emerald-400" 
                            : "text-amber-600 dark:text-amber-400"
                        )} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {selectedProjection.goalName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatCurrency(selectedProjection.remainingAmount, currency)} remaining to save
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {selectedProjection.progressPercentage.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">complete</p>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-4 h-4 text-blue-500" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">Monthly</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency(selectedProjection.monthlyRequired, currency)}
                        </p>
                      </div>

                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-purple-500" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">Weekly</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency(selectedProjection.weeklyRequired, currency)}
                        </p>
                      </div>

                      <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-teal-500" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">Days Left</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {selectedProjection.daysRemaining}
                        </p>
                      </div>

                      <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-4 h-4 text-rose-500" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">Daily</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency(selectedProjection.dailyRequired, currency)}
                        </p>
                      </div>
                    </div>

                    {/* Scenarios */}
                    {selectedProjection.scenarios && selectedProjection.scenarios.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          Saving Scenarios
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {selectedProjection.scenarios.map((scenario, index) => (
                            <div 
                              key={scenario.name}
                              className={cn(
                                "p-4 rounded-xl border-2 transition-all",
                                index === 1 
                                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" 
                                  : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
                              )}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className={cn(
                                  "text-xs font-medium px-2 py-0.5 rounded-full",
                                  index === 0 && "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
                                  index === 1 && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400",
                                  index === 2 && "bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400"
                                )}>
                                  {scenario.name}
                                </span>
                                {index === 1 && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                )}
                              </div>
                              <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                {formatCurrency(scenario.monthlyAmount, currency)}<span className="text-sm font-normal text-gray-500">/mo</span>
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Complete by {formatDate(scenario.completionDate)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Projected Completion */}
                    {selectedProjection.projectedCompletion && (
                      <div className={cn(
                        "p-4 rounded-xl border-2",
                        selectedProjection.isOnTrack 
                          ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20"
                      )}>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            selectedProjection.isOnTrack 
                              ? "bg-emerald-100 dark:bg-emerald-900/50" 
                              : "bg-amber-100 dark:bg-amber-900/50"
                          )}>
                            <Calendar className={cn(
                              "w-5 h-5",
                              selectedProjection.isOnTrack 
                                ? "text-emerald-600 dark:text-emerald-400" 
                                : "text-amber-600 dark:text-amber-400"
                            )} />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Projected Completion Date
                            </p>
                            <p className={cn(
                              "text-lg font-semibold",
                              selectedProjection.isOnTrack 
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-amber-600 dark:text-amber-400"
                            )}>
                              {formatDate(selectedProjection.projectedCompletion)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Target className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">Select a goal to see its projection</p>
                    <p className="text-sm mt-1">Choose from the list on the left</p>
                  </div>
                )}
              </Card>
            </div>

            {/* Tips Card */}
            <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
                  <Zap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-300 mb-2">
                    Tips to Improve Your Projections
                  </h3>
                  <ul className="text-sm text-emerald-800 dark:text-emerald-400 space-y-1.5">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      Increase your monthly contributions to reach goals faster
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      Review and adjust goals that are behind schedule
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      Set up automatic transfers to stay consistent
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      Consider extending deadlines for ambitious goals
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
