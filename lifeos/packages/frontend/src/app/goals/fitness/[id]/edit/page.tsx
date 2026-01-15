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
import { ArrowLeft, Dumbbell } from 'lucide-react';
import Link from 'next/link';

const goalSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  metricType: z.string(),
  unit: z.string().min(1, 'Unit is required'),
  startValue: z.number(),
  currentValue: z.number(),
  targetValue: z.number(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
});

type GoalForm = z.infer<typeof goalSchema>;

interface FitnessGoal {
  id: string;
  name: string;
  metricType: string;
  unit: string;
  startValue: number;
  currentValue: number;
  targetValue: number;
  startDate: string;
  targetDate: string;
}

const metricTypes = [
  { value: 'WEIGHT', label: '⚖️ Weight' },
  { value: 'BODY_FAT', label: '📊 Body Fat %' },
  { value: 'MUSCLE_MASS', label: '💪 Muscle Mass' },
  { value: 'STEPS', label: '👟 Steps' },
  { value: 'DISTANCE', label: '🏃 Distance' },
  { value: 'STRENGTH', label: '🏋️ Strength' },
  { value: 'ENDURANCE', label: '❤️ Endurance' },
  { value: 'FLEXIBILITY', label: '🧘 Flexibility' },
  { value: 'OTHER', label: '📌 Other' },
];

export default function EditFitnessGoalPage() {
  const router = useRouter();
  const params = useParams();
  const goalId = params.id as string;
  const queryClient = useQueryClient();

  const { data: goalData, isLoading } = useQuery<{ data: { goal: FitnessGoal } }>({
    queryKey: ['fitness-goal', goalId],
    queryFn: async () => {
      const response = await api.get(`/fitness-goals/${goalId}`);
      return response.data;
    },
  });

  const goal = goalData?.data?.goal;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GoalForm>({
    resolver: zodResolver(goalSchema),
  });

  useEffect(() => {
    if (goal) {
      reset({
        name: goal.name,
        metricType: goal.metricType,
        unit: goal.unit,
        startValue: goal.startValue,
        currentValue: goal.currentValue,
        targetValue: goal.targetValue,
        startDate: goal.startDate?.split('T')[0],
        targetDate: goal.targetDate?.split('T')[0],
      });
    }
  }, [goal, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: GoalForm) => api.patch(`/fitness-goals/${goalId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fitness-goals'] });
      queryClient.invalidateQueries({ queryKey: ['fitness-goal', goalId] });
      toast.success('Goal updated successfully!');
      router.push('/goals/fitness');
    },
    onError: () => toast.error('Failed to update goal'),
  });

  const onSubmit = (data: GoalForm) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
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
            href="/goals/fitness"
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Fitness Goal</h1>
            <p className="text-gray-500 dark:text-gray-400">Update your goal details</p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Goal Details</h2>
                <p className="text-white/80 text-sm">Keep crushing it!</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="space-y-4">
              <Input
                label="Goal Name"
                placeholder="e.g., Lose Weight"
                error={errors.name?.message}
                {...register('name')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/goals/fitness')}
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
