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
import { formatDate } from '@/lib/utils';
import api from '@/lib/api';
import { 
  Plus, 
  X, 
  Edit2, 
  Trash2, 
  RotateCcw, 
  Trophy,
  Dumbbell,
  Target,
  TrendingUp,
  Calendar,
  Activity,
  MoreVertical,
  Flame
} from 'lucide-react';

const goalSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  metricType: z.string(),
  startValue: z.number(),
  currentValue: z.number(),
  targetValue: z.number(),
  unit: z.string().min(1, 'Unit is required'),
  startDate: z.string(),
  targetDate: z.string(),
  notes: z.string().optional(),
});

type GoalForm = z.infer<typeof goalSchema>;

interface FitnessGoal {
  id: string;
  name: string;
  metricType: string;
  startValue: number;
  currentValue: number;
  targetValue: number;
  unit: string;
  startDate: string;
  targetDate: string;
  status: string;
  progress: number;
  isAchieved: boolean;
  notes?: string;
}

const metricTypes = [
  { value: 'WEIGHT', label: 'Weight' },
  { value: 'BODY_FAT', label: 'Body Fat %' },
  { value: 'STEPS', label: 'Steps' },
  { value: 'STRENGTH', label: 'Strength' },
  { value: 'CARDIO', label: 'Cardio' },
  { value: 'FLEXIBILITY', label: 'Flexibility' },
  { value: 'CUSTOM', label: 'Custom' },
];

export default function FitnessGoalsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FitnessGoal | null>(null);

  const { data, isLoading } = useQuery<{ data: { goals: FitnessGoal[] } }>({
    queryKey: ['fitness-goals'],
    queryFn: async () => {
      const response = await api.get('/fitness-goals');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: GoalForm) => api.post('/fitness-goals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fitness-goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Goal created successfully!');
      setIsModalOpen(false);
      reset();
    },
    onError: () => toast.error('Failed to create goal'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GoalForm> }) =>
      api.patch(`/fitness-goals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fitness-goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Goal updated successfully!');
      setIsModalOpen(false);
      setEditingGoal(null);
      reset();
    },
    onError: () => toast.error('Failed to update goal'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/fitness-goals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fitness-goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Goal deleted successfully!');
    },
    onError: () => toast.error('Failed to delete goal'),
  });

  const resetMutation = useMutation({
    mutationFn: (id: string) => api.post(`/fitness-goals/${id}/reset`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fitness-goals'] });
      toast.success('Goal reset successfully!');
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
      metricType: 'WEIGHT',
      unit: 'kg',
      startDate: new Date().toISOString().split('T')[0],
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  const onSubmit = (data: GoalForm) => {
    if (editingGoal) {
      updateMutation.mutate({ id: editingGoal.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditModal = (goal: FitnessGoal) => {
    setEditingGoal(goal);
    setValue('name', goal.name);
    setValue('metricType', goal.metricType);
    setValue('startValue', goal.startValue);
    setValue('currentValue', goal.currentValue);
    setValue('targetValue', goal.targetValue);
    setValue('unit', goal.unit);
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
  const activeGoals = goals.filter(g => !g.isAchieved);
  const achievedGoals = goals.filter(g => g.isAchieved);
  const avgProgress = goals.length > 0 
    ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length) 
    : 0;
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const getMetricIcon = (metricType: string) => {
    switch (metricType) {
      case 'WEIGHT':
      case 'BODY_FAT':
        return <Activity className="w-4 h-4" />;
      case 'STEPS':
        return <TrendingUp className="w-4 h-4" />;
      case 'STRENGTH':
        return <Dumbbell className="w-4 h-4" />;
      case 'CARDIO':
        return <Flame className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track':
        return 'bg-success-500';
      case 'ahead':
        return 'bg-primary-500';
      case 'behind':
        return 'bg-warning-500';
      case 'at_risk':
        return 'bg-danger-500';
      default:
        return 'bg-gray-400';
    }
  };

  // Goal Card Component
  const GoalCard = ({ goal }: { goal: FitnessGoal }) => (
    <Card className={`relative overflow-hidden group hover:shadow-lg transition-all duration-200 ${
      goal.isAchieved ? 'ring-2 ring-success-500/30' : ''
    }`}>
      {/* Status indicator line */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${getStatusColor(goal.status)}`} />
      
      <div className="pt-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              goal.isAchieved 
                ? 'bg-success-100 dark:bg-success-900/30' 
                : 'bg-orange-100 dark:bg-orange-900/30'
            }`}>
              {goal.isAchieved 
                ? <Trophy className="w-5 h-5 text-success-600 dark:text-success-400" />
                : getMetricIcon(goal.metricType)
              }
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{goal.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {metricTypes.find(t => t.value === goal.metricType)?.label || goal.metricType}
              </p>
            </div>
          </div>
          
          {/* Dropdown menu */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === goal.id ? null : goal.id)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
            
            {openDropdown === goal.id && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setOpenDropdown(null)}
                />
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                  <button
                    onClick={() => {
                      openEditModal(goal);
                      setOpenDropdown(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Goal
                  </button>
                  <button
                    onClick={() => {
                      resetMutation.mutate(goal.id);
                      setOpenDropdown(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset Progress
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this goal?')) {
                        deleteMutation.mutate(goal.id);
                      }
                      setOpenDropdown(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Values display */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Start</p>
              <p className="font-semibold text-gray-900 dark:text-white">{goal.startValue}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Current</p>
              <p className="font-semibold text-orange-600 dark:text-orange-400">{goal.currentValue}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Target</p>
              <p className="font-semibold text-gray-900 dark:text-white">{goal.targetValue}</p>
            </div>
          </div>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-1">{goal.unit}</p>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Progress</span>
            <span className="font-medium text-gray-900 dark:text-white">{goal.progress}%</span>
          </div>
          <ProgressBar value={goal.progress} size="lg" showLabel={false} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Due {formatDate(goal.targetDate)}</span>
          </div>
          <StatusBadge status={goal.status} />
        </div>
      </div>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-8">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Dumbbell className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">Fitness Goals</h1>
              </div>
              <p className="text-white/80 max-w-md">
                Track your health and fitness progress. Stay consistent and crush your goals!
              </p>
            </div>
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Goal
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-bl-full" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Goals</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{goals.length}</p>
            </div>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-bl-full" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-primary-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Active</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{activeGoals.length}</p>
            </div>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-bl-full" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-success-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Achieved</span>
              </div>
              <p className="text-3xl font-bold text-success-600 dark:text-success-400">{achievedGoals.length}</p>
            </div>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-bl-full" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Avg Progress</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{avgProgress}%</p>
            </div>
          </Card>
        </div>

        {/* Goals List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : goals.length === 0 ? (
          <Card className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-4">
              <Dumbbell className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No fitness goals yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Start tracking your fitness journey today!</p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Goal
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Achieved Goals Section */}
            {achievedGoals.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-success-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Achieved Goals ({achievedGoals.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {achievedGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} />
                  ))}
                </div>
              </div>
            )}

            {/* Active Goals Section */}
            {activeGoals.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Active Goals ({activeGoals.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {activeGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} />
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
                  {editingGoal ? 'Edit Goal' : 'Create Fitness Goal'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                <Input
                  label="Goal Name"
                  placeholder="e.g., Lose Weight"
                  error={errors.name?.message}
                  {...register('name')}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Metric Type"
                    options={metricTypes}
                    {...register('metricType')}
                  />
                  <Input
                    label="Unit"
                    placeholder="kg, %, steps"
                    error={errors.unit?.message}
                    {...register('unit')}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Start Value"
                    type="number"
                    step="0.1"
                    error={errors.startValue?.message}
                    {...register('startValue', { valueAsNumber: true })}
                  />
                  <Input
                    label="Current Value"
                    type="number"
                    step="0.1"
                    error={errors.currentValue?.message}
                    {...register('currentValue', { valueAsNumber: true })}
                  />
                  <Input
                    label="Target Value"
                    type="number"
                    step="0.1"
                    error={errors.targetValue?.message}
                    {...register('targetValue', { valueAsNumber: true })}
                  />
                </div>

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
