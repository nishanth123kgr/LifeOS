'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import api from '@/lib/api';
import { ArrowLeft, Repeat, Sparkles } from 'lucide-react';
import Link from 'next/link';

const habitSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  frequency: z.string(),
  targetCount: z.number().min(1).optional(),
});

type HabitForm = z.infer<typeof habitSchema>;

const frequencies = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'WEEKDAYS', label: 'Weekdays' },
  { value: 'WEEKENDS', label: 'Weekends' },
];

export default function NewHabitPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HabitForm>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      frequency: 'DAILY',
      targetCount: 1,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: HabitForm) => api.post('/habits', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Habit created successfully!');
      router.push('/habits');
    },
    onError: () => toast.error('Failed to create habit'),
  });

  const onSubmit = (data: HabitForm) => {
    createMutation.mutate(data);
  };

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Habit</h1>
            <p className="text-gray-500 dark:text-gray-400">Build consistency with daily habits</p>
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
                <p className="text-white/80 text-sm">Small steps lead to big changes</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="space-y-4">
              <Input
                label="Habit Name"
                placeholder="e.g., Morning Workout, Read 30 mins, Meditate"
                error={errors.name?.message}
                {...register('name')}
              />

              <Input
                label="Description (optional)"
                placeholder="e.g., 30 minutes of exercise every morning"
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

            {/* Tips Section */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-300">Tips for Success</h4>
                  <ul className="mt-1 text-sm text-amber-700 dark:text-amber-400 space-y-1">
                    <li>• Start with small, achievable goals</li>
                    <li>• Attach new habits to existing routines</li>
                    <li>• Track your progress daily</li>
                  </ul>
                </div>
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
                isLoading={createMutation.isPending}
              >
                Create Habit
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
