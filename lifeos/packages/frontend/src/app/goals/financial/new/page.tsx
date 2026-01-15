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
import { ArrowLeft, Target, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const goalSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string(),
  targetAmount: z.number().min(1, 'Target amount is required'),
  currentAmount: z.number().min(0).optional(),
  monthlyContribution: z.number().min(0).optional(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
});

type GoalForm = z.infer<typeof goalSchema>;

const goalTypes = [
  { value: 'SAVINGS', label: '💰 Savings' },
  { value: 'INVESTMENT', label: '📈 Investment' },
  { value: 'DEBT_PAYOFF', label: '💳 Debt Payoff' },
  { value: 'EMERGENCY_FUND', label: '🛡️ Emergency Fund' },
  { value: 'RETIREMENT', label: '🏖️ Retirement' },
  { value: 'PURCHASE', label: '🛒 Major Purchase' },
  { value: 'OTHER', label: '📌 Other' },
];

export default function NewFinancialGoalPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GoalForm>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      type: 'SAVINGS',
      currentAmount: 0,
      monthlyContribution: 0,
      startDate: today,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: GoalForm) => api.post('/financial-goals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Financial goal created successfully!');
      router.push('/goals/financial');
    },
    onError: () => toast.error('Failed to create goal'),
  });

  const onSubmit = (data: GoalForm) => {
    createMutation.mutate(data);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/goals/financial"
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Financial Goal</h1>
            <p className="text-gray-500 dark:text-gray-400">Set a new financial target</p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Goal Details</h2>
                <p className="text-white/80 text-sm">Define your financial target</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="space-y-4">
              <Input
                label="Goal Name"
                placeholder="e.g., Emergency Fund, House Down Payment"
                error={errors.name?.message}
                {...register('name')}
              />

              <Select
                label="Goal Type"
                options={goalTypes}
                {...register('type')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {/* Tips Section */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-300">Pro Tip</h4>
                  <p className="mt-1 text-sm text-green-700 dark:text-green-400">
                    Setting a monthly contribution helps you stay on track. We'll show you projections based on your contribution plan.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/goals/financial')}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 sm:flex-none"
                isLoading={createMutation.isPending}
              >
                Create Goal
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
