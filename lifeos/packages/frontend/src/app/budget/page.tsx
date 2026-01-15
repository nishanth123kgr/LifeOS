'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { DonutChart } from '@/components/charts/Charts';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import Link from 'next/link';
import { 
  Plus, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Calendar,
  ChevronRight,
  ArrowLeft,
  PiggyBank,
  Receipt,
  BarChart3,
  Link2,
  Target,
  X,
  Settings,
  DollarSign,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LinkedGoal {
  id: string;
  name: string;
  type: string;
  targetAmount: number;
  currentAmount: number;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description?: string;
  source?: string;
  destination?: string;
  date: string;
  fromAccountId?: string;
  toAccountId?: string;
}

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface BudgetItem {
  id: string;
  category: string;
  name?: string;
  planned: number;
  actual: number;
  linkedGoalId?: string;
  linkedGoal?: LinkedGoal;
  transactions?: Transaction[];
}

interface FinancialGoal {
  id: string;
  name: string;
  type: string;
  targetAmount: number;
  currentAmount: number;
  status: string;
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
  { value: 'MISCELLANEOUS', label: 'Miscellaneous' },
  { value: 'FINANCIAL_GOAL', label: 'Financial Goal' },
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

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function BudgetPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const currency = user?.currency || 'INR';

  const currentDate = new Date();
  const [selectedBudget, setSelectedBudget] = useState<{ month: number; year: number } | null>(null);
  const [editingItems, setEditingItems] = useState<Record<string, { planned: number; actual: number }>>({});
  const [linkingItemId, setLinkingItemId] = useState<string | null>(null);
  const [addingExpenseItemId, setAddingExpenseItemId] = useState<string | null>(null);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseFromAccountId, setExpenseFromAccountId] = useState('');

  // Fetch all budgets
  const { data: allBudgetsData, isLoading: isLoadingAll } = useQuery<{ data: { budgets: Budget[] } }>({
    queryKey: ['budgets'],
    queryFn: async () => {
      const response = await api.get('/budgets');
      return response.data;
    },
  });

  // Fetch selected budget details
  const { data: budgetData, isLoading: isLoadingBudget } = useQuery<{ data: { budget: Budget } }>({
    queryKey: ['budget', selectedBudget?.year, selectedBudget?.month],
    queryFn: async () => {
      const response = await api.get(`/budgets/${selectedBudget?.year}/${selectedBudget?.month}`);
      return response.data;
    },
    enabled: !!selectedBudget,
  });

  // Fetch financial goals for linking
  const { data: goalsData } = useQuery<{ data: { goals: FinancialGoal[] } }>({
    queryKey: ['financial-goals'],
    queryFn: async () => {
      const response = await api.get('/financial-goals');
      return response.data;
    },
  });

  // Fetch user accounts for expense tracking
  const { data: accountsData } = useQuery<{ accounts: Account[] }>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await api.get('/accounts');
      return response.data;
    },
  });

  const accounts = accountsData?.accounts || [];
  const financialGoals = goalsData?.data?.goals?.filter(g => g.status !== 'COMPLETED' && g.status !== 'ARCHIVED') || [];

  const updateMutation = useMutation({
    mutationFn: ({ items, income }: { items: any[]; income?: number }) =>
      api.patch(`/budgets/${selectedBudget?.year}/${selectedBudget?.month}`, { items, income }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Budget updated!');
    },
    onError: () => toast.error('Failed to update budget'),
  });

  const linkMutation = useMutation({
    mutationFn: ({ itemId, goalId }: { itemId: string; goalId: string | null }) =>
      api.patch(`/budgets/items/${itemId}/link`, { goalId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setLinkingItemId(null);
      toast.success('Goal linked successfully!');
    },
    onError: () => toast.error('Failed to link goal'),
  });

  const initializeMutation = useMutation({
    mutationFn: () => api.post(`/budgets/${selectedBudget?.year}/${selectedBudget?.month}/initialize`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Budget categories initialized!');
    },
    onError: () => toast.error('Failed to initialize categories'),
  });

  // Transaction mutation
  const addTransactionMutation = useMutation({
    mutationFn: (data: { 
      amount: number; 
      type: string; 
      description?: string; 
      budgetItemId: string;
      financialGoalId?: string;
      fromAccountId?: string;
      toAccountId?: string;
    }) => api.post('/transactions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaction added!');
      setAddingExpenseItemId(null);
      setExpenseAmount('');
      setExpenseDescription('');
      setExpenseFromAccountId('');
    },
    onError: () => toast.error('Failed to add transaction'),
  });

  const handleAddExpense = (item: BudgetItem) => {
    const amount = parseFloat(expenseAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!expenseFromAccountId) {
      toast.error('Please select an account');
      return;
    }

    const isGoalContribution = item.category === 'FINANCIAL_GOAL' && item.linkedGoalId;
    
    addTransactionMutation.mutate({
      amount,
      type: isGoalContribution ? 'GOAL_CONTRIBUTION' : 'EXPENSE',
      description: expenseDescription || undefined,
      budgetItemId: item.id,
      financialGoalId: isGoalContribution ? item.linkedGoalId : undefined,
      fromAccountId: expenseFromAccountId,
    });
  };

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
    const budget = budgetData?.data?.budget;
    if (!budget) return;

    const updatedItems = budget.items.map(item => ({
      category: item.category,
      planned: editingItems[item.category]?.planned ?? item.planned,
      actual: editingItems[item.category]?.actual ?? item.actual,
    }));

    updateMutation.mutate({ items: updatedItems });
    setEditingItems({});
  };

  const allBudgets = allBudgetsData?.data?.budgets || [];
  const budget = budgetData?.data?.budget;

  // Group budgets by year
  const budgetsByYear = allBudgets.reduce((acc, b) => {
    if (!acc[b.year]) acc[b.year] = [];
    acc[b.year].push(b);
    return acc;
  }, {} as Record<number, Budget[]>);

  // Sort years descending
  const sortedYears = Object.keys(budgetsByYear).map(Number).sort((a, b) => b - a);

  // Calculate totals
  const totalIncome = allBudgets.reduce((sum, b) => sum + b.income, 0);
  const totalSpent = allBudgets.reduce((sum, b) => sum + b.totalActual, 0);
  const totalSurplus = allBudgets.reduce((sum, b) => sum + b.surplus, 0);

  // Chart data for selected budget
  const chartData = budget?.items
    .filter(item => item.actual > 0)
    .map(item => ({
      name: budgetCategories.find(c => c.value === item.category)?.label || item.category,
      value: item.actual,
    })) || [];

  return (
    <DashboardLayout>
      {selectedBudget ? (
        /* Budget Detail View */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => {
                setSelectedBudget(null);
                setEditingItems({});
              }}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {monthNames[selectedBudget.month - 1]} {selectedBudget.year}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Budget Details</p>
            </div>
          </div>

          {isLoadingBudget ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !budget ? (
            <Card className="text-center py-12">
              <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Budget not found</p>
              <Button onClick={() => setSelectedBudget(null)}>
                Go Back
              </Button>
            </Card>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-bl-full" />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Income</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(budget.income, currency)}</p>
                    </div>
                  </div>
                </Card>

                <Card className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-bl-full" />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Planned</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(budget.totalPlanned, currency)}</p>
                    </div>
                  </div>
                </Card>

                <Card className="relative overflow-hidden">
                  <div className={cn(
                    'absolute top-0 right-0 w-12 h-12 rounded-bl-full',
                    budget.isOverBudget ? 'bg-red-100 dark:bg-red-900/20' : 'bg-green-100 dark:bg-green-900/20'
                  )} />
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      budget.isOverBudget ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'
                    )}>
                      <TrendingUp className={cn('w-5 h-5', budget.isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400')} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Actual</p>
                      <p className={cn('text-xl font-bold', budget.isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white')}>
                        {formatCurrency(budget.totalActual, currency)}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className={cn(
                  'relative overflow-hidden',
                  budget.surplus < 0 && 'ring-2 ring-red-500/30'
                )}>
                  <div className={cn(
                    'absolute top-0 right-0 w-12 h-12 rounded-bl-full',
                    budget.surplus >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                  )} />
                  <div className="flex items-center gap-3">
                    {budget.surplus < 0 && <AlertTriangle className="w-5 h-5 text-red-500" />}
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Surplus</p>
                      <p className={cn('text-xl font-bold', budget.surplus >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500')}>
                        {formatCurrency(Math.abs(budget.surplus), currency)}
                        {budget.surplus < 0 && <span className="text-sm font-normal"> deficit</span>}
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
                    {budget.items.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">No budget categories yet</p>
                        <Button onClick={() => initializeMutation.mutate()} isLoading={initializeMutation.isPending}>
                          <Plus className="w-4 h-4 mr-2" />
                          Initialize Categories
                        </Button>
                      </div>
                    ) : budget.items.map((item) => {
                      const category = budgetCategories.find(c => c.value === item.category);
                      const percentage = item.planned > 0 ? (item.actual / item.planned) * 100 : 0;
                      const isOver = percentage > 100;
                      const isFinancialGoal = item.category === 'FINANCIAL_GOAL';
                      const displayName = isFinancialGoal && item.linkedGoal 
                        ? item.linkedGoal.name 
                        : (item.name || category?.label || item.category);

                      return (
                        <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {isFinancialGoal && (
                                <Target className="w-4 h-4 text-emerald-500" />
                              )}
                              <span className="font-medium text-gray-900 dark:text-white">{displayName}</span>
                              {isFinancialGoal && item.linkedGoal && (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full">
                                  Goal
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-24 text-right py-1 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md px-2">
                                {item.actual.toLocaleString()}
                              </div>
                              <span className="text-gray-400">/</span>
                              <input
                                type="text"
                                inputMode="decimal"
                                className="w-24 text-right input py-1 text-sm"
                                defaultValue={item.planned}
                                onBlur={(e) => {
                                  const val = e.target.value.replace(/[^0-9.]/g, '');
                                  handleItemUpdate(item.category, 'planned', parseFloat(val) || 0);
                                }}
                                placeholder="Planned"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                              <div
                                className={cn('h-2 rounded-full transition-all', isOver ? 'bg-red-500' : 'bg-blue-500')}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                            <span className={cn('text-xs font-medium w-12 text-right', isOver ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400')}>
                              {percentage.toFixed(0)}%
                            </span>
                            <button
                              onClick={() => setAddingExpenseItemId(addingExpenseItemId === item.id ? null : item.id)}
                              className={cn(
                                'p-1.5 rounded-md transition-colors',
                                addingExpenseItemId === item.id
                                  ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600'
                                  : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500'
                              )}
                              title="Add expense"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Add Expense Form */}
                          {addingExpenseItemId === item.id && (
                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-200 dark:border-blue-500/30">
                              <p className="text-xs text-blue-600 dark:text-blue-400 mb-2 font-medium">
                                {item.category === 'FINANCIAL_GOAL' ? 'Add Contribution' : 'Add Expense'}
                              </p>
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <div className="flex-1">
                                    <Input
                                      type="number"
                                      placeholder="Amount"
                                      value={expenseAmount}
                                      onChange={(e) => setExpenseAmount(e.target.value)}
                                      className="text-sm"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <Input
                                      type="text"
                                      placeholder="Description (optional)"
                                      value={expenseDescription}
                                      onChange={(e) => setExpenseDescription(e.target.value)}
                                      className="text-sm"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <select
                                    value={expenseFromAccountId}
                                    onChange={(e) => setExpenseFromAccountId(e.target.value)}
                                    className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:border-gray-600"
                                  >
                                    <option value="">Select account (debit from)</option>
                                    {accounts.map(account => (
                                      <option key={account.id} value={account.id}>
                                        {account.name} ({formatCurrency(account.balance, currency)})
                                      </option>
                                    ))}
                                  </select>
                                  <Button
                                    size="sm"
                                    onClick={() => handleAddExpense(item)}
                                    isLoading={addTransactionMutation.isPending}
                                  >
                                    Add
                                  </Button>
                                </div>
                                {accounts.length === 0 && (
                                  <p className="text-xs text-amber-600 dark:text-amber-400">
                                    No accounts found. <Link href="/accounts" className="underline">Create an account</Link> first.
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Budget List View */
        <div className="space-y-8">
          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 p-8">
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            
            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-white">Monthly Budgets</h1>
                </div>
                <p className="text-white/80 max-w-md">
                  Track your income and expenses. Create and manage budgets for each month.
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/budget/template">
                  <Button variant="outline" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/30 text-white">
                    <Settings className="w-4 h-4 mr-2" />
                    Template
                  </Button>
                </Link>
                <Link href="/budget/new">
                  <Button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    New Budget
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-bl-full" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <PiggyBank className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total Income</span>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalIncome, currency)}</p>
              </div>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-bl-full" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="w-5 h-5 text-orange-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total Spent</span>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalSpent, currency)}</p>
              </div>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-bl-full" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total Surplus</span>
                </div>
                <p className={cn(
                  'text-3xl font-bold',
                  totalSurplus >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}>
                  {formatCurrency(Math.abs(totalSurplus), currency)}
                  {totalSurplus < 0 && <span className="text-lg font-normal"> deficit</span>}
                </p>
              </div>
            </Card>
          </div>

          {/* Budget List */}
          {isLoadingAll ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : allBudgets.length === 0 ? (
            <Card className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                <Wallet className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No budgets yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Create your first monthly budget to start tracking</p>
              <Link href="/budget/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Budget
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-6">
              {sortedYears.map(year => (
                <div key={year}>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    {year}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {budgetsByYear[year]
                      .sort((a, b) => b.month - a.month)
                      .map(b => {
                        const isCurrentMonth = b.month === currentDate.getMonth() + 1 && b.year === currentDate.getFullYear();
                        const spendingPercentage = b.income > 0 ? (b.totalActual / b.income) * 100 : 0;
                        
                        return (
                          <Card 
                            key={b.id}
                            className={cn(
                              'cursor-pointer hover:shadow-lg transition-all duration-200 group relative overflow-hidden',
                              isCurrentMonth && 'ring-2 ring-blue-500/50',
                              b.isOverBudget && 'ring-2 ring-red-500/30'
                            )}
                            onClick={() => setSelectedBudget({ month: b.month, year: b.year })}
                          >
                            {/* Status indicator */}
                            <div className={cn(
                              'absolute top-0 left-0 right-0 h-1',
                              b.surplus >= 0 ? 'bg-green-500' : 'bg-red-500'
                            )} />

                            <div className="pt-1">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className={cn(
                                    'p-2 rounded-lg',
                                    isCurrentMonth 
                                      ? 'bg-blue-100 dark:bg-blue-900/30' 
                                      : 'bg-gray-100 dark:bg-gray-700'
                                  )}>
                                    <Calendar className={cn(
                                      'w-4 h-4',
                                      isCurrentMonth ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'
                                    )} />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                      {monthNames[b.month - 1]}
                                    </h3>
                                    {isCurrentMonth && (
                                      <span className="text-xs text-blue-600 dark:text-blue-400">Current</span>
                                    )}
                                  </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                              </div>

                              <div className="space-y-2 mb-3">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500 dark:text-gray-400">Income</span>
                                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(b.income, currency)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500 dark:text-gray-400">Spent</span>
                                  <span className={cn(
                                    'font-medium',
                                    b.isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                                  )}>
                                    {formatCurrency(b.totalActual, currency)}
                                  </span>
                                </div>
                              </div>

                              <div className="mb-2">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-400">Spending</span>
                                  <span className={cn(
                                    'font-medium',
                                    spendingPercentage > 100 ? 'text-red-500' : 'text-gray-500'
                                  )}>
                                    {spendingPercentage.toFixed(0)}%
                                  </span>
                                </div>
                                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div 
                                    className={cn(
                                      'h-full rounded-full transition-all',
                                      spendingPercentage > 100 ? 'bg-red-500' : 
                                      spendingPercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                                    )}
                                    style={{ width: `${Math.min(spendingPercentage, 100)}%` }}
                                  />
                                </div>
                              </div>

                              <div className={cn(
                                'text-sm font-medium pt-2 border-t border-gray-100 dark:border-gray-700',
                                b.surplus >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                              )}>
                                {b.surplus >= 0 ? '+' : ''}{formatCurrency(b.surplus, currency)} {b.surplus < 0 ? 'deficit' : 'surplus'}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
