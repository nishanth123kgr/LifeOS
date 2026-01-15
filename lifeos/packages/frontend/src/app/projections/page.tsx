'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Target, Zap, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';

interface Projection {
  goalId: string;
  goalName: string;
  goalType: string;
  currentAmount: number;
  targetAmount: number;
  monthlyContribution: number;
  projectedCompletionDate: string;
  originalTargetDate: string;
  isOnTrack: boolean;
  monthsAhead: number;
  projectedData: Array<{ month: string; projected: number; target: number }>;
}

interface ProjectionSummary {
  totalGoals: number;
  onTrackGoals: number;
  behindScheduleGoals: number;
  averageProgress: number;
}

export default function ProjectionsPage() {
  const { user } = useAuthStore();
  const currency = user?.currency || 'INR';
  const [projections, setProjections] = useState<Projection[]>([]);
  const [summary, setSummary] = useState<ProjectionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  useEffect(() => {
    fetchProjections();
  }, []);

  const fetchProjections = async () => {
    setLoading(true);
    try {
      const response = await api.get('/projections');
      setProjections(response.data.projections || []);
      setSummary(response.data.summary || null);
    } catch (error) {
      console.error('Failed to fetch projections:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedProjection = projections.find(p => p.goalId === selectedGoal);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary-500" />
              Financial Projections
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              See when you'll reach your financial goals
            </p>
          </div>
          <Button onClick={fetchProjections} variant="secondary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Goals</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{summary.totalGoals}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500 dark:text-gray-400">On Track</p>
              <p className="text-3xl font-bold text-success-600 dark:text-success-500">{summary.onTrackGoals}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500 dark:text-gray-400">Behind Schedule</p>
              <p className="text-3xl font-bold text-warning-600 dark:text-warning-500">{summary.behindScheduleGoals}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg Progress</p>
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-500">{summary.averageProgress}%</p>
            </Card>
          </div>
        )}

        {/* Projections List */}
        {projections.length === 0 ? (
          <Card className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">No projections available</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Create some financial goals to see projections
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Goals List */}
            <Card>
              <CardHeader title="Your Goals" />
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {projections.map(projection => (
                  <button
                    key={projection.goalId}
                    onClick={() => setSelectedGoal(projection.goalId)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedGoal === projection.goalId
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {projection.goalName}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        projection.isOnTrack
                          ? 'bg-success-100 dark:bg-success-500/20 text-success-600 dark:text-success-400'
                          : 'bg-warning-100 dark:bg-warning-500/20 text-warning-600 dark:text-warning-400'
                      }`}>
                        {projection.isOnTrack ? 'On Track' : 'Behind'}
                      </span>
                    </div>
                    
                    <ProgressBar 
                      value={Math.round((projection.currentAmount / projection.targetAmount) * 100)} 
                      size="sm" 
                      showLabel={false}
                      className="mb-2"
                    />
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {formatCurrency(projection.currentAmount, currency)}
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {formatCurrency(projection.targetAmount, currency)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Projection Details */}
            <Card>
              <CardHeader title="Projection Details" />
              {selectedProjection ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Target Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatDate(selectedProjection.originalTargetDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Projected Date</p>
                      <p className={`font-medium ${
                        selectedProjection.isOnTrack 
                          ? 'text-success-600 dark:text-success-500' 
                          : 'text-warning-600 dark:text-warning-500'
                      }`}>
                        {formatDate(selectedProjection.projectedCompletionDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Contribution</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(selectedProjection.monthlyContribution, currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                      <p className={`font-medium ${
                        selectedProjection.monthsAhead >= 0
                          ? 'text-success-600 dark:text-success-500'
                          : 'text-warning-600 dark:text-warning-500'
                      }`}>
                        {selectedProjection.monthsAhead >= 0
                          ? `${selectedProjection.monthsAhead} months ahead`
                          : `${Math.abs(selectedProjection.monthsAhead)} months behind`
                        }
                      </p>
                    </div>
                  </div>

                  {/* Chart Placeholder */}
                  {selectedProjection.projectedData && selectedProjection.projectedData.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Projected Growth
                      </h4>
                      <div className="h-[200px] bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          Chart visualization coming soon
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Select a goal to see its projection</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Tips Card */}
        <Card className="bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
          <h3 className="font-semibold text-primary-900 dark:text-primary-300 mb-2 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Improve Your Projections
          </h3>
          <ul className="text-sm text-primary-800 dark:text-primary-400 space-y-1">
            <li>• Increase your monthly contributions to reach goals faster</li>
            <li>• Review and adjust goals that are behind schedule</li>
            <li>• Set up automatic transfers to stay consistent</li>
            <li>• Consider extending deadlines for ambitious goals</li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  );
}
