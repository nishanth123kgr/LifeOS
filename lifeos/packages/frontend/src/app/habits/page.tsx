'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { format, isToday } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import api from '@/lib/api';
import { Plus, X, Edit2, Trash2, Flame, Check, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const habitSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  frequency: z.string(),
  targetCount: z.number().min(1).optional(),
});

type HabitForm = z.infer<typeof habitSchema>;

interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: string;
  targetCount: number;
  currentStreak: number;
  longestStreak: number;
  isActive: boolean;
  checkIns: Array<{ date: string; completed: boolean }>;
}

const frequencies = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'WEEKDAYS', label: 'Weekdays' },
  { value: 'WEEKENDS', label: 'Weekends' },
];

export default function HabitsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const { data, isLoading } = useQuery<{ data: { habits: Habit[] } }>({
    queryKey: ['habits'],
    queryFn: async () => {
      const response = await api.get('/habits');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: HabitForm) => api.post('/habits', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Habit created successfully!');
      setIsModalOpen(false);
      reset();
    },
    onError: () => toast.error('Failed to create habit'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HabitForm> }) =>
      api.patch(`/habits/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.success('Habit updated successfully!');
      setIsModalOpen(false);
      setEditingHabit(null);
      reset();
    },
    onError: () => toast.error('Failed to update habit'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/habits/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Habit deleted successfully!');
    },
    onError: () => toast.error('Failed to delete habit'),
  });

  const checkInMutation = useMutation({
    mutationFn: (id: string) => api.post(`/habits/${id}/check-in`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Check-in recorded!');
    },
    onError: () => toast.error('Failed to check in'),
  });

  const uncheckMutation = useMutation({
    mutationFn: (id: string) => api.post(`/habits/${id}/uncheck`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.success('Check-in removed');
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<HabitForm>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      frequency: 'DAILY',
      targetCount: 1,
    },
  });

  const onSubmit = (data: HabitForm) => {
    if (editingHabit) {
      updateMutation.mutate({ id: editingHabit.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditModal = (habit: Habit) => {
    setEditingHabit(habit);
    setValue('name', habit.name);
    setValue('description', habit.description || '');
    setValue('frequency', habit.frequency);
    setValue('targetCount', habit.targetCount);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingHabit(null);
    reset();
  };

  const isCheckedInToday = (habit: Habit): boolean => {
    if (!habit.checkIns || habit.checkIns.length === 0) return false;
    return habit.checkIns.some(c => {
      const checkInDate = new Date(c.date);
      return isToday(checkInDate) && c.completed;
    });
  };

  const habits = data?.data?.habits || [];
  const totalStreakDays = habits.reduce((sum, h) => sum + h.currentStreak, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Habit Tracker</h1>
            <p className="text-gray-600 dark:text-gray-400">Build consistency with daily habits</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Habit
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Habits</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{habits.filter(h => h.isActive).length}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Streak Days</p>
            <p className="text-3xl font-bold text-warning-600 dark:text-warning-500">{totalStreakDays}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completed Today</p>
            <p className="text-3xl font-bold text-success-600 dark:text-success-500">
              {habits.filter(h => isCheckedInToday(h)).length}/{habits.length}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500 dark:text-gray-400">Longest Streak</p>
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-500">
              {Math.max(...habits.map(h => h.longestStreak), 0)} days
            </p>
          </Card>
        </div>

        {/* Habits Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : habits.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-500 mb-4">No habits yet</p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Habit
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {habits.map((habit) => {
              const checkedToday = isCheckedInToday(habit);
              return (
                <Card
                  key={habit.id}
                  className={cn(
                    'transition-all',
                    checkedToday && 'border-success-300 bg-success-50 dark:bg-success-900/20'
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{habit.name}</h3>
                      {habit.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{habit.description}</p>
                      )}
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {frequencies.find(f => f.value === habit.frequency)?.label}
                    </span>
                  </div>

                  {/* Check-in button */}
                  <button
                    onClick={() => {
                      if (checkedToday) {
                        uncheckMutation.mutate(habit.id);
                      } else {
                        checkInMutation.mutate(habit.id);
                      }
                    }}
                    className={cn(
                      'w-full py-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-all',
                      checkedToday
                        ? 'bg-success-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-700 dark:hover:text-primary-400'
                    )}
                  >
                    {checkedToday ? (
                      <>
                        <Check className="w-5 h-5" />
                        Completed Today!
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-5 h-5" />
                        Mark Complete
                      </>
                    )}
                  </button>

                  {/* Streak info */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <Flame className={cn('w-5 h-5', habit.currentStreak > 0 ? 'text-warning-500' : 'text-gray-300 dark:text-gray-600')} />
                      <span className="text-sm font-medium dark:text-gray-200">
                        {habit.currentStreak} day streak
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Best: {habit.longestStreak} days
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(habit)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this habit?')) {
                          deleteMutation.mutate(habit.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-danger-500" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingHabit ? 'Edit Habit' : 'Create Habit'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                <Input
                  label="Habit Name"
                  placeholder="e.g., Morning Workout"
                  error={errors.name?.message}
                  {...register('name')}
                />

                <Input
                  label="Description (optional)"
                  placeholder="e.g., 30 minutes of exercise"
                  {...register('description')}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Frequency"
                    options={frequencies}
                    {...register('frequency')}
                  />
                  <Input
                    label="Target Count"
                    type="number"
                    min="1"
                    {...register('targetCount', { valueAsNumber: true })}
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
                    {editingHabit ? 'Update Habit' : 'Create Habit'}
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
