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
import { ArrowLeft, Wallet, Info } from 'lucide-react';
import Link from 'next/link';

const budgetSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
  income: z.number().min(0),
});

type BudgetForm = z.infer<typeof budgetSchema>;

const months = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export default function NewBudgetPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const currentDate = new Date();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
      income: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: BudgetForm) => api.post('/budgets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Budget created successfully!');
      router.push('/budget');
    },
    onError: () => toast.error('Failed to create budget'),
  });

  const onSubmit = (data: BudgetForm) => {
    createMutation.mutate(data);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/budget"
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Budget</h1>
            <p className="text-gray-500 dark:text-gray-400">Set up your monthly budget</p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Budget Details</h2>
                <p className="text-white/80 text-sm">Plan your spending wisely</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Month"
                  options={months}
                  {...register('month', { valueAsNumber: true })}
                />
                <Input
                  label="Year"
                  type="number"
                  min="2020"
                  max="2100"
                  {...register('year', { valueAsNumber: true })}
                />
              </div>

              <Input
                label="Monthly Income"
                type="number"
                placeholder="Enter your monthly income"
                error={errors.income?.message}
                {...register('income', { valueAsNumber: true })}
              />
            </div>

            {/* Info Section */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-emerald-800 dark:text-emerald-300">What happens next?</h4>
                  <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
                    After creating your budget, you can add spending categories and track your expenses throughout the month.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/budget')}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 sm:flex-none"
                isLoading={createMutation.isPending}
              >
                Create Budget
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
