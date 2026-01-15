'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusBadge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import Link from 'next/link';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Pause, 
  Play,
  Target, 
  Wallet, 
  TrendingUp,
  Calendar,
  PiggyBank,
  ChevronRight,
  MoreVertical,
  DollarSign
} from 'lucide-react';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface FinancialGoal {
  id: string;
  name: string;
  type: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  startDate: string;
  targetDate: string;
  status: string;
  progress: number;
  isPaused: boolean;
  isArchived: boolean;
  notes?: string;
}

const goalTypes = [
  { value: 'EMERGENCY_FUND', label: 'Emergency Fund' },
  { value: 'MARRIAGE_FUND', label: 'Marriage Fund' },
  { value: 'CAR_FUND', label: 'Car Fund' },
  { value: 'HOME_DOWN_PAYMENT', label: 'Home Down Payment' },
  { value: 'INVESTMENTS', label: 'Investments' },
  { value: 'RETIREMENT', label: 'Retirement' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'VACATION', label: 'Vacation' },
  { value: 'CUSTOM', label: 'Custom' },
];

export default function FinancialGoalsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const currency = user?.currency || 'INR';
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [contributingGoalId, setContributingGoalId] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionAccountId, setContributionAccountId] = useState('');
  const [contributionDescription, setContributionDescription] = useState('');

  const { data, isLoading } = useQuery<{ data: { goals: FinancialGoal[] } }>({
    queryKey: ['financial-goals'],
    queryFn: async () => {
      const response = await api.get('/financial-goals');
      return response.data;
    },
  });

  // Fetch accounts for contributions
  const { data: accountsData } = useQuery<{ accounts: Account[] }>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await api.get('/accounts');
      return response.data;
    },
  });

  const accounts = accountsData?.accounts || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/financial-goals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Goal deleted successfully!');
    },
    onError: () => toast.error('Failed to delete goal'),
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => api.post(`/financial-goals/${id}/pause`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      toast.success('Goal status updated!');
    },
  });

  const contributionMutation = useMutation({
    mutationFn: (data: { amount: number; financialGoalId: string; fromAccountId: string; description?: string }) => 
      api.post('/transactions', {
        ...data,
        type: 'GOAL_CONTRIBUTION',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Contribution added!');
      setContributingGoalId(null);
      setContributionAmount('');
      setContributionAccountId('');
      setContributionDescription('');
    },
    onError: () => toast.error('Failed to add contribution'),
  });

  const handleAddContribution = (goalId: string) => {
    const amount = parseFloat(contributionAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!contributionAccountId) {
      toast.error('Please select an account');
      return;
    }
    contributionMutation.mutate({
      amount,
      financialGoalId: goalId,
      fromAccountId: contributionAccountId,
      description: contributionDescription || undefined,
    });
  };

  const goals = data?.data?.goals || [];
  const activeGoals = goals.filter(g => !g.isPaused && !g.isArchived);
  const pausedGoals = goals.filter(g => g.isPaused);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-2xl p-6 lg:p-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">Financial Goals</h1>
              <p className="text-emerald-100 max-w-md">
                Track your progress towards financial freedom. You have {activeGoals.length} active goal{activeGoals.length !== 1 ? 's' : ''}.
              </p>
            </div>
            
            <Link href="/goals/financial/new">
              <Button className="bg-white text-emerald-600 hover:bg-emerald-50 shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                Add Goal
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="p-2.5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg shadow-blue-500/25">
                <Target className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Goals</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{goals.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {activeGoals.length} active
              </p>
            </div>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="p-2.5 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl shadow-lg shadow-purple-500/25">
                <PiggyBank className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Target</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(totalTarget, currency)}
              </p>
            </div>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="p-2.5 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/25">
                <Wallet className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Saved</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(totalSaved, currency)}
              </p>
            </div>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg shadow-orange-500/25">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Overall Progress</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{overallProgress}%</p>
              <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all"
                  style={{ width: `${Math.min(overallProgress, 100)}%` }}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Goals List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : goals.length === 0 ? (
          <Card className="text-center py-16">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No financial goals yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Start your journey to financial freedom by creating your first savings goal.
            </p>
            <Link href="/goals/financial/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Goal
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Active Goals */}
            {activeGoals.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Goals</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {activeGoals.map((goal) => (
                    <GoalCard 
                      key={goal.id} 
                      goal={goal} 
                      currency={currency}
                      accounts={accounts}
                      isContributing={contributingGoalId === goal.id}
                      contributionAmount={contributionAmount}
                      contributionAccountId={contributionAccountId}
                      contributionDescription={contributionDescription}
                      onContributionToggle={() => {
                        setContributingGoalId(contributingGoalId === goal.id ? null : goal.id);
                        setContributionAmount('');
                        setContributionAccountId('');
                        setContributionDescription('');
                      }}
                      onContributionAmountChange={setContributionAmount}
                      onContributionAccountChange={setContributionAccountId}
                      onContributionDescriptionChange={setContributionDescription}
                      onContributionSubmit={() => handleAddContribution(goal.id)}
                      isSubmitting={contributionMutation.isPending}
                      onPause={() => pauseMutation.mutate(goal.id)}
                      onDelete={() => {
                        if (confirm('Are you sure you want to delete this goal?')) {
                          deleteMutation.mutate(goal.id);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Paused Goals */}
            {pausedGoals.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-4">Paused Goals</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {pausedGoals.map((goal) => (
                    <GoalCard 
                      key={goal.id} 
                      goal={goal} 
                      currency={currency}
                      accounts={accounts}
                      isContributing={false}
                      contributionAmount=""
                      contributionAccountId=""
                      contributionDescription=""
                      onContributionToggle={() => {}}
                      onContributionAmountChange={() => {}}
                      onContributionAccountChange={() => {}}
                      onContributionDescriptionChange={() => {}}
                      onContributionSubmit={() => {}}
                      isSubmitting={false}
                      onPause={() => pauseMutation.mutate(goal.id)}
                      onDelete={() => {
                        if (confirm('Are you sure you want to delete this goal?')) {
                          deleteMutation.mutate(goal.id);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Goal Card Component
interface GoalCardProps {
  goal: FinancialGoal;
  currency: string;
  accounts: Account[];
  isContributing: boolean;
  contributionAmount: string;
  contributionAccountId: string;
  contributionDescription: string;
  onContributionToggle: () => void;
  onContributionAmountChange: (value: string) => void;
  onContributionAccountChange: (value: string) => void;
  onContributionDescriptionChange: (value: string) => void;
  onContributionSubmit: () => void;
  isSubmitting: boolean;
  onPause: () => void;
  onDelete: () => void;
}

function GoalCard({ 
  goal, 
  currency, 
  accounts,
  isContributing,
  contributionAmount,
  contributionAccountId,
  contributionDescription,
  onContributionToggle,
  onContributionAmountChange,
  onContributionAccountChange,
  onContributionDescriptionChange,
  onContributionSubmit,
  isSubmitting,
  onPause, 
  onDelete 
}: GoalCardProps) {
  const [showActions, setShowActions] = useState(false);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ON_TRACK': return 'from-emerald-400 to-emerald-600';
      case 'NEEDS_FOCUS': return 'from-amber-400 to-amber-600';
      case 'BEHIND': return 'from-red-400 to-red-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const progressColor = goal.progress >= 75 
    ? 'from-emerald-400 to-emerald-600' 
    : goal.progress >= 50 
    ? 'from-blue-400 to-blue-600'
    : goal.progress >= 25 
    ? 'from-amber-400 to-amber-600'
    : 'from-gray-400 to-gray-500';

  return (
    <Card className={`relative group transition-all hover:shadow-lg ${goal.isPaused ? 'opacity-60' : ''}`}>
      {/* Status indicator line */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getStatusColor(goal.status)} rounded-t-xl`} />
      
      <div className="pt-2">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">{goal.name}</h3>
              {goal.isPaused && (
                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                  Paused
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {goalTypes.find(t => t.value === goal.type)?.label || goal.type}
            </p>
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowActions(!showActions)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
            {showActions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20 min-w-[120px]">
                  <Link 
                    href={`/goals/financial/${goal.id}/edit`}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setShowActions(false)}
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </Link>
                  <button 
                    onClick={() => { onPause(); setShowActions(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {goal.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    {goal.isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button 
                    onClick={() => { onDelete(); setShowActions(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Progress Section */}
        <div className="mb-4">
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(goal.currentAmount, currency)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                of {formatCurrency(goal.targetAmount, currency)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900 dark:text-white">{Math.round(goal.progress)}%</p>
              <StatusBadge status={goal.status} />
            </div>
          </div>
          
          <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${progressColor} rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(goal.progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Monthly</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatCurrency(goal.monthlyContribution, currency)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
              <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Target Date</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(goal.targetDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Add Contribution Button & Form */}
        {!goal.isPaused && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            {!isContributing ? (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={onContributionToggle}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Add Contribution
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Add Contribution</p>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={contributionAmount}
                    onChange={(e) => onContributionAmountChange(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="text"
                    placeholder="Note (optional)"
                    value={contributionDescription}
                    onChange={(e) => onContributionDescriptionChange(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <select
                  value={contributionAccountId}
                  onChange={(e) => onContributionAccountChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-800 dark:border-gray-600"
                >
                  <option value="">Select account (debit from)</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.balance, currency)})
                    </option>
                  ))}
                </select>
                {accounts.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    No accounts found. <Link href="/accounts" className="underline">Create an account</Link> first.
                  </p>
                )}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={onContributionToggle}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={onContributionSubmit}
                    isLoading={isSubmitting}
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
