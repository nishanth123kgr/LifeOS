'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Target, 
  Wallet,
  GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FinancialGoal {
  id: string;
  name: string;
  type: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
}

interface BudgetTemplateItem {
  id: string;
  category: string;
  plannedAmount: number;
  linkedGoalId?: string;
  notes?: string;
  order: number;
}

interface BudgetTemplate {
  id: string;
  name: string;
  items: BudgetTemplateItem[];
}

const budgetCategories = [
  { value: 'RENT', label: 'Rent/Housing', icon: '🏠' },
  { value: 'FOOD', label: 'Food & Groceries', icon: '🍔' },
  { value: 'TRANSPORT', label: 'Transport', icon: '🚗' },
  { value: 'SUBSCRIPTIONS', label: 'Subscriptions', icon: '📱' },
  { value: 'UTILITIES', label: 'Utilities', icon: '💡' },
  { value: 'HEALTHCARE', label: 'Healthcare', icon: '🏥' },
  { value: 'ENTERTAINMENT', label: 'Entertainment', icon: '🎬' },
  { value: 'SHOPPING', label: 'Shopping', icon: '🛍️' },
  { value: 'MISCELLANEOUS', label: 'Miscellaneous', icon: '📦' },
];

export default function BudgetTemplatePage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const currency = user?.currency || 'INR';

  const [editedItems, setEditedItems] = useState<Record<string, number>>({});
  const [showAddGoal, setShowAddGoal] = useState(false);

  // Fetch budget template
  const { data, isLoading } = useQuery<{ data: { template: BudgetTemplate; financialGoals: FinancialGoal[] } }>({
    queryKey: ['budget-template'],
    queryFn: async () => {
      const response = await api.get('/budget-template');
      return response.data;
    },
  });

  const template = data?.data?.template;
  const financialGoals = data?.data?.financialGoals || [];

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: (items: any[]) => api.put('/budget-template', { items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-template'] });
      toast.success('Template saved!');
      setEditedItems({});
    },
    onError: () => toast.error('Failed to save template'),
  });

  // Add goal to template mutation
  const addGoalMutation = useMutation({
    mutationFn: ({ goalId, plannedAmount }: { goalId: string; plannedAmount: number }) =>
      api.post('/budget-template/goals', { goalId, plannedAmount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-template'] });
      toast.success('Goal added to template!');
      setShowAddGoal(false);
    },
    onError: () => toast.error('Failed to add goal'),
  });

  // Remove goal from template mutation
  const removeGoalMutation = useMutation({
    mutationFn: (goalId: string) => api.delete(`/budget-template/goals/${goalId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-template'] });
      toast.success('Goal removed from template');
    },
    onError: () => toast.error('Failed to remove goal'),
  });

  const handleAmountChange = (itemId: string, amount: number) => {
    setEditedItems(prev => ({ ...prev, [itemId]: amount }));
  };

  const handleSave = () => {
    if (!template) return;

    const updatedItems = template.items.map(item => ({
      category: item.category,
      plannedAmount: editedItems[item.id] ?? item.plannedAmount,
      linkedGoalId: item.linkedGoalId,
      notes: item.notes,
    }));

    updateMutation.mutate(updatedItems);
  };

  const getCategoryInfo = (category: string) => {
    return budgetCategories.find(c => c.value === category) || { value: category, label: category, icon: '📦' };
  };

  // Get goals not already in template
  const availableGoals = financialGoals.filter(
    goal => !template?.items.some(item => item.linkedGoalId === goal.id)
  );

  // Separate regular items and goal items
  const regularItems = template?.items.filter(item => item.category !== 'FINANCIAL_GOAL') || [];
  const goalItems = template?.items.filter(item => item.category === 'FINANCIAL_GOAL') || [];

  // Calculate totals
  const totalPlanned = template?.items.reduce((sum, item) => sum + (editedItems[item.id] ?? item.plannedAmount), 0) || 0;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/budget"
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budget Template</h1>
              <p className="text-gray-500 dark:text-gray-400">Set your default monthly budget plan</p>
            </div>
          </div>
          {Object.keys(editedItems).length > 0 && (
            <Button onClick={handleSave} isLoading={updateMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          )}
        </div>

        {/* Summary Card */}
        <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-white/80">Total Monthly Budget</p>
                <p className="text-3xl font-bold">{formatCurrency(totalPlanned, currency)}</p>
              </div>
            </div>
            <p className="text-white/70 text-sm">
              {template?.items.length || 0} categories
            </p>
          </div>
        </Card>

        {/* Regular Categories */}
        <Card>
          <CardHeader title="Budget Categories" subtitle="Set planned amounts for each category" />
          <div className="space-y-3">
            {regularItems.map(item => {
              const category = getCategoryInfo(item.category);
              const currentAmount = editedItems[item.id] ?? item.plannedAmount;

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <span className="text-2xl">{category.icon}</span>
                  <span className="flex-1 font-medium text-gray-900 dark:text-white">
                    {category.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">₹</span>
                    <Input
                      type="number"
                      min={0}
                      value={currentAmount}
                      onChange={(e) => handleAmountChange(item.id, parseFloat(e.target.value) || 0)}
                      className="w-32 text-right"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Financial Goals Section */}
        <Card>
          <CardHeader
            title="Financial Goals"
            subtitle="Goals that will be automatically added to each month's budget"
            action={
              <Button size="sm" variant="outline" onClick={() => setShowAddGoal(!showAddGoal)}>
                <Plus className="w-4 h-4 mr-1" />
                Add Goal
              </Button>
            }
          />

          {/* Add Goal Dropdown */}
          {showAddGoal && availableGoals.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-200 dark:border-blue-500/30">
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">Select a goal to add:</p>
              <div className="space-y-2">
                {availableGoals.map(goal => (
                  <button
                    key={goal.id}
                    onClick={() => addGoalMutation.mutate({ goalId: goal.id, plannedAmount: goal.monthlyContribution })}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-emerald-600" />
                      <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-white">{goal.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatCurrency(goal.currentAmount, currency)} / {formatCurrency(goal.targetAmount, currency)}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      +{formatCurrency(goal.monthlyContribution, currency)}/mo
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {showAddGoal && availableGoals.length === 0 && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
              <p className="text-gray-500 dark:text-gray-400">All your goals are already in the template</p>
            </div>
          )}

          {/* Goal Items */}
          <div className="space-y-3">
            {goalItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No financial goals in your template yet</p>
                <p className="text-sm">Add goals to automatically include them in new budgets</p>
              </div>
            ) : (
              goalItems.map(item => {
                const goal = financialGoals.find(g => g.id === item.linkedGoalId);
                const currentAmount = editedItems[item.id] ?? item.plannedAmount;

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-200 dark:border-emerald-500/30"
                  >
                    <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {goal?.name || 'Unknown Goal'}
                      </span>
                      {goal && (
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">
                          {Math.round((goal.currentAmount / goal.targetAmount) * 100)}% funded
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400">₹</span>
                      <Input
                        type="number"
                        min={0}
                        value={currentAmount}
                        onChange={(e) => handleAmountChange(item.id, parseFloat(e.target.value) || 0)}
                        className="w-32 text-right"
                      />
                      <button
                        onClick={() => item.linkedGoalId && removeGoalMutation.mutate(item.linkedGoalId)}
                        className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Remove from template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
              <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">How it works</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                When you create a new monthly budget, these categories and amounts will be used as defaults.
                Financial goals added here will automatically appear in your budget, and any money you allocate
                to them will be tracked towards the goal.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
