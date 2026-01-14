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
import { Plus, X, Edit2, Trash2, Pause, Archive } from 'lucide-react';

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Goals</h1>
            <p className="text-gray-600 dark:text-gray-400">Track your progress towards financial freedom</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Goal
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Goals</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{goals.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Target</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(goals.reduce((sum, g) => sum + g.targetAmount, 0), currency)}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Saved</p>
            <p className="text-3xl font-bold text-success-600 dark:text-success-500">
              {formatCurrency(goals.reduce((sum, g) => sum + g.currentAmount, 0), currency)}
            </p>
          </Card>
        </div>

        {/* Goals List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : goals.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-500 mb-4">No financial goals yet</p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Goal
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {goals.map((goal) => (
              <Card key={goal.id} className={goal.isPaused ? 'opacity-60' : ''}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{goal.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {goalTypes.find(t => t.value === goal.type)?.label || goal.type}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={goal.status} />
                  </div>
                </div>

                <ProgressBar value={goal.progress} size="lg" showLabel={false} className="mb-2" />
                
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatCurrency(goal.currentAmount, currency)} saved
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formatCurrency(goal.targetAmount, currency)} goal
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span>Monthly: {formatCurrency(goal.monthlyContribution, currency)}</span>
                  <span>Due: {formatDate(goal.targetDate)}</span>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(goal)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => pauseMutation.mutate(goal.id)}>
                    <Pause className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this goal?')) {
                        deleteMutation.mutate(goal.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-danger-500" />
                  </Button>
                </div>
              </Card>
            ))}
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
