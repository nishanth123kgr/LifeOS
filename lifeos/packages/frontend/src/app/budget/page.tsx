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
import { DonutChart } from '@/components/charts/Charts';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { Plus, X, Edit2, Wallet, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const budgetSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
  income: z.number().min(0),
});

type BudgetForm = z.infer<typeof budgetSchema>;

interface BudgetItem {
  id: string;
  category: string;
  planned: number;
  actual: number;
}

interface Budget {
  id: string;
  month: number;
  year: number;
  income: number;
  items: BudgetItem[];
  totalPlanned: number;
  totalActual: number;
  surplus: number;
  isOverBudget: boolean;
}

const budgetCategories = [
  { value: 'RENT', label: 'Rent/Housing' },
  { value: 'FOOD', label: 'Food' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'SUBSCRIPTIONS', label: 'Subscriptions' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'HEALTHCARE', label: 'Healthcare' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'SHOPPING', label: 'Shopping' },
  { value: 'SAVINGS', label: 'Savings' },
  { value: 'INVESTMENTS', label: 'Investments' },
  { value: 'MISCELLANEOUS', label: 'Miscellaneous' },
];

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

export default function BudgetPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const currency = user?.currency || 'INR';

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItems, setEditingItems] = useState<Record<string, { planned: number; actual: number }>>({});

  const { data, isLoading } = useQuery<{ data: { budget: Budget } }>({
    queryKey: ['budget', selectedYear, selectedMonth],
    queryFn: async () => {
      const response = await api.get(`/budgets/${selectedYear}/${selectedMonth}`);
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: BudgetForm) => api.post('/budgets', {
      ...data,
      items: budgetCategories.map(c => ({
        category: c.value,
        planned: 0,
        actual: 0,
      })),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      toast.success('Budget created successfully!');
      setIsModalOpen(false);
      reset();
    },
    onError: () => toast.error('Failed to create budget'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ items, income }: { items: any[]; income?: number }) =>
      api.patch(`/budgets/${selectedYear}/${selectedMonth}`, { items, income }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      toast.success('Budget updated!');
    },
    onError: () => toast.error('Failed to update budget'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
      income: 0,
    },
  });

  const onSubmit = (data: BudgetForm) => {
    createMutation.mutate(data);
  };

  const budget = data?.data?.budget;

  const handleItemUpdate = (category: string, field: 'planned' | 'actual', value: number) => {
    setEditingItems(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const saveItemChanges = () => {
    if (!budget) return;

    const updatedItems = budget.items.map(item => ({
      category: item.category,
      planned: editingItems[item.category]?.planned ?? item.planned,
      actual: editingItems[item.category]?.actual ?? item.actual,
    }));

    updateMutation.mutate({ items: updatedItems });
    setEditingItems({});
  };

  // Prepare chart data
  const chartData = budget?.items
    .filter(item => item.actual > 0)
    .map(item => ({
      name: budgetCategories.find(c => c.value === item.category)?.label.split(' ').slice(1).join(' ') || item.category,
      value: item.actual,
    })) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Monthly Budget</h1>
            <p className="text-gray-600 dark:text-gray-400">Track your income and expenses</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="input w-32"
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input w-24"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : !budget ? (
          <Card className="text-center py-12">
            <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              No budget for {months[selectedMonth - 1].label} {selectedYear}
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Budget
            </Button>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Income</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(budget.income, currency)}</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-warning-600 dark:text-warning-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Planned</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(budget.totalPlanned, currency)}</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    budget.isOverBudget ? 'bg-danger-100 dark:bg-danger-900/30' : 'bg-success-100 dark:bg-success-900/30'
                  )}>
                    <TrendingUp className={cn('w-5 h-5', budget.isOverBudget ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400')} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Actual</p>
                    <p className={cn('text-xl font-bold', budget.isOverBudget ? 'text-danger-600 dark:text-danger-400' : 'text-gray-900 dark:text-white')}>
                      {formatCurrency(budget.totalActual, currency)}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className={budget.surplus < 0 ? 'border-danger-300 bg-danger-50 dark:bg-danger-900/20' : ''}>
                <div className="flex items-center gap-3">
                  {budget.surplus < 0 && <AlertTriangle className="w-5 h-5 text-danger-500" />}
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Surplus</p>
                    <p className={cn('text-xl font-bold', budget.surplus >= 0 ? 'text-success-600 dark:text-success-500' : 'text-danger-600 dark:text-danger-500')}>
                      {formatCurrency(Math.abs(budget.surplus), currency)}
                      {budget.surplus < 0 && ' deficit'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Chart and Budget Items */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Spending Chart */}
              <Card className="lg:col-span-1">
                <CardHeader title="Spending Breakdown" />
                {chartData.length > 0 ? (
                  <DonutChart data={chartData} height={250} />
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    No spending data yet
                  </div>
                )}
              </Card>

              {/* Budget Items */}
              <Card className="lg:col-span-2">
                <CardHeader
                  title="Budget Categories"
                  action={
                    Object.keys(editingItems).length > 0 && (
                      <Button size="sm" onClick={saveItemChanges} isLoading={updateMutation.isPending}>
                        Save Changes
                      </Button>
                    )
                  }
                />
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {budget.items.map((item) => {
                    const category = budgetCategories.find(c => c.value === item.category);
                    const percentage = item.planned > 0 ? (item.actual / item.planned) * 100 : 0;
                    const isOver = percentage > 100;

                    return (
                      <div key={item.category} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">{category?.label || item.category}</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              className="w-24 text-right input py-1 text-sm"
                              value={editingItems[item.category]?.actual ?? item.actual}
                              onChange={(e) => handleItemUpdate(item.category, 'actual', parseFloat(e.target.value) || 0)}
                              placeholder="Actual"
                            />
                            <span className="text-gray-400">/</span>
                            <input
                              type="number"
                              className="w-24 text-right input py-1 text-sm"
                              value={editingItems[item.category]?.planned ?? item.planned}
                              onChange={(e) => handleItemUpdate(item.category, 'planned', parseFloat(e.target.value) || 0)}
                              placeholder="Planned"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                            <div
                              className={cn('h-2 rounded-full transition-all', isOver ? 'bg-danger-500' : 'bg-primary-500')}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <span className={cn('text-xs font-medium', isOver ? 'text-danger-600 dark:text-danger-400' : 'text-gray-600 dark:text-gray-400')}>
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Create Budget Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Budget</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Month"
                    options={months}
                    {...register('month', { valueAsNumber: true })}
                  />
                  <Input
                    label="Year"
                    type="number"
                    {...register('year', { valueAsNumber: true })}
                  />
                </div>

                <Input
                  label="Monthly Income"
                  type="number"
                  placeholder="50000"
                  error={errors.income?.message}
                  {...register('income', { valueAsNumber: true })}
                />

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" isLoading={createMutation.isPending}>
                    Create Budget
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
