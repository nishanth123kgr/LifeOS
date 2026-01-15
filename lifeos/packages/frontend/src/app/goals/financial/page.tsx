'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusBadge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { 
  Plus, 
  X, 
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
  MoreVertical
} from 'lucide-react';

const goalSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string(),
  targetAmount: z.number().positive('Target amount must be positive'),
  currentAmount: z.number().min(0).optional(),
  monthlyContribution: z.number().min(0).optional(),
  startDate: z.string(),
  targetDate: z.string(),
  notes: z.string().optional(),
});

type GoalForm = z.infer<typeof goalSchema>;

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);

  const { data, isLoading } = useQuery<{ data: { goals: FinancialGoal[] } }>({
    queryKey: ['financial-goals'],
    queryFn: async () => {
      const response = await api.get('/financial-goals');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: GoalForm) => api.post('/financial-goals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Goal created successfully!');
      setIsModalOpen(false);
      reset();
    },
    onError: () => toast.error('Failed to create goal'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GoalForm> }) =>
      api.patch(`/financial-goals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Goal updated successfully!');
      setIsModalOpen(false);
      setEditingGoal(null);
      reset();
    },
    onError: () => toast.error('Failed to update goal'),
  });

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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<GoalForm>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      type: 'CUSTOM',
      startDate: new Date().toISOString().split('T')[0],
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  const onSubmit = (data: GoalForm) => {
    if (editingGoal) {
      updateMutation.mutate({ id: editingGoal.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditModal = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setValue('name', goal.name);
    setValue('type', goal.type);
    setValue('targetAmount', goal.targetAmount);
    setValue('currentAmount', goal.currentAmount);
    setValue('monthlyContribution', goal.monthlyContribution);
    setValue('startDate', goal.startDate.split('T')[0]);
    setValue('targetDate', goal.targetDate.split('T')[0]);
    setValue('notes', goal.notes || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
    reset();
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
            
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-emerald-600 hover:bg-emerald-50 shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Goal
            </Button>
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
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Goal
            </Button>
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
                      onEdit={() => openEditModal(goal)}
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
                      onEdit={() => openEditModal(goal)}
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

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingGoal ? 'Edit Goal' : 'Create Financial Goal'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                <Input
                  label="Goal Name"
                  placeholder="e.g., Emergency Fund"
                  error={errors.name?.message}
                  {...register('name')}
                />

                <Select
                  label="Goal Type"
                  options={goalTypes}
                  {...register('type')}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Target Amount"
                    type="number"
                    placeholder="100000"
                    error={errors.targetAmount?.message}
                    {...register('targetAmount', { valueAsNumber: true })}
                  />
                  <Input
                    label="Current Amount"
                    type="number"
                    placeholder="0"
                    {...register('currentAmount', { valueAsNumber: true })}
                  />
                </div>

                <Input
                  label="Monthly Contribution"
                  type="number"
                  placeholder="5000"
                  {...register('monthlyContribution', { valueAsNumber: true })}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Start Date"
                    type="date"
                    {...register('startDate')}
                  />
                  <Input
                    label="Target Date"
                    type="date"
                    {...register('targetDate')}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    isLoading={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingGoal ? 'Update Goal' : 'Create Goal'}
                  </Button>
                </div>
              </form>
            </div>
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
  onEdit: () => void;
  onPause: () => void;
  onDelete: () => void;
}

function GoalCard({ goal, currency, onEdit, onPause, onDelete }: GoalCardProps) {
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
                  <button 
                    onClick={() => { onEdit(); setShowActions(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
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
      </div>
    </Card>
  );
}
