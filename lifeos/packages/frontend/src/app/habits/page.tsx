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
import { 
  Plus, 
  X, 
  Edit2, 
  Trash2, 
  Flame, 
  Check, 
  CheckSquare, 
  Calendar,
  Target,
  Trophy,
  Zap,
  MoreVertical,
  Repeat
} from 'lucide-react';
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
  const activeHabits = habits.filter(h => h.isActive);
  const totalStreakDays = habits.reduce((sum, h) => sum + h.currentStreak, 0);
  const completedToday = habits.filter(h => isCheckedInToday(h)).length;
  const longestStreak = Math.max(...habits.map(h => h.longestStreak), 0);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'DAILY':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'WEEKLY':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'WEEKDAYS':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'WEEKENDS':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  // Habit Card Component
  const HabitCard = ({ habit }: { habit: Habit }) => {
    const checkedToday = isCheckedInToday(habit);
    
    return (
      <Card className={cn(
        'relative overflow-hidden group hover:shadow-lg transition-all duration-200',
        checkedToday && 'ring-2 ring-green-500/30'
      )}>
        {/* Streak indicator line */}
        <div className={cn(
          'absolute top-0 left-0 right-0 h-1',
          habit.currentStreak > 0 ? 'bg-gradient-to-r from-orange-400 to-red-500' : 'bg-gray-200 dark:bg-gray-700'
        )} />
        
        <div className="pt-2">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                checkedToday 
                  ? 'bg-green-100 dark:bg-green-900/30' 
                  : 'bg-purple-100 dark:bg-purple-900/30'
              )}>
                {checkedToday 
                  ? <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                  : <Repeat className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                }
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{habit.name}</h3>
                {habit.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{habit.description}</p>
                )}
              </div>
            </div>
            
            {/* Dropdown menu */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === habit.id ? null : habit.id)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
              
              {openDropdown === habit.id && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setOpenDropdown(null)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                    <button
                      onClick={() => {
                        openEditModal(habit);
                        setOpenDropdown(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this habit?')) {
                          deleteMutation.mutate(habit.id);
                        }
                        setOpenDropdown(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Frequency badge */}
          <div className="mb-4">
            <span className={cn(
              'text-xs font-medium px-2.5 py-1 rounded-full',
              getFrequencyColor(habit.frequency)
            )}>
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
              'w-full py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-all',
              checkedToday
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-400'
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
              <Flame className={cn(
                'w-5 h-5',
                habit.currentStreak > 0 ? 'text-orange-500' : 'text-gray-300 dark:text-gray-600'
              )} />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {habit.currentStreak} day streak
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Trophy className="w-3.5 h-3.5" />
              Best: {habit.longestStreak}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-500 p-8">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Repeat className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">Habit Tracker</h1>
              </div>
              <p className="text-white/80 max-w-md">
                Build consistency with daily habits. Small steps lead to big changes!
              </p>
            </div>
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Habit
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-bl-full" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Active Habits</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{activeHabits.length}</p>
            </div>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-bl-full" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Streak Days</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalStreakDays}</p>
            </div>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-bl-full" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Completed Today</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                <span className="text-green-600 dark:text-green-400">{completedToday}</span>
                <span className="text-lg text-gray-400">/{habits.length}</span>
              </p>
            </div>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-bl-full" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Longest Streak</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{longestStreak} <span className="text-sm font-normal text-gray-500">days</span></p>
            </div>
          </Card>
        </div>

        {/* Habits Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : habits.length === 0 ? (
          <Card className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
              <Repeat className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No habits yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Start building positive habits today!</p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Habit
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {habits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} />
            ))}
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
