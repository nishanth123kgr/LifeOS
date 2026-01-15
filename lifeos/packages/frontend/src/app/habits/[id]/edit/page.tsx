'use client';

import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import api from '@/lib/api';
import { ArrowLeft, Repeat } from 'lucide-react';
import Link from 'next/link';

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
}

const frequencies = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'WEEKDAYS', label: 'Weekdays' },
  { value: 'WEEKENDS', label: 'Weekends' },
];

export default function EditHabitPage() {
  const router = useRouter();
  const params = useParams();
  const habitId = params.id as string;
  const queryClient = useQueryClient();

  const { data: habitData, isLoading } = useQuery<{ data: { habit: Habit } }>({
    queryKey: ['habit', habitId],
    queryFn: async () => {
      const response = await api.get(`/habits/${habitId}`);
      return response.data;
    },
  });

  const habit = habitData?.data?.habit;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HabitForm>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      frequency: 'DAILY',
      targetCount: 1,
    },
  });

  useEffect(() => {
    if (habit) {
      reset({
        name: habit.name,
        description: habit.description || '',
        frequency: habit.frequency,
        targetCount: habit.targetCount,
      });
    }
  }, [habit, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: HabitForm) => api.patch(`/habits/${habitId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habit', habitId] });
      toast.success('Habit updated successfully!');
      router.push('/habits');
    },
    onError: () => toast.error('Failed to update habit'),
  });

  const onSubmit = (data: HabitForm) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/habits"
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Habit</h1>
            <p className="text-gray-500 dark:text-gray-400">Update your habit details</p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Repeat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Habit Details</h2>
                <p className="text-white/80 text-sm">Keep up the great work!</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="space-y-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/habits')}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 sm:flex-none"
                isLoading={updateMutation.isPending}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
