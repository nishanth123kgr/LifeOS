'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Target,
  Wallet,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  RefreshCw,
  Receipt,
  Building2,
  CreditCard,
  Coins,
  Smartphone,
  TrendingUp,
  FileText,
  X,
} from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  type: 'EXPENSE' | 'GOAL_CONTRIBUTION' | 'INCOME' | 'TRANSFER';
  description: string | null;
  source: string | null;
  destination: string | null;
  date: string;
  budgetItem: {
    id: string;
    category: string;
    name: string | null;
    budget: {
      month: number;
      year: number;
    };
  } | null;
  financialGoal: {
    id: string;
    name: string;
    type: string;
  } | null;
  fromAccount: {
    id: string;
    name: string;
    type: string;
  } | null;
  toAccount: {
    id: string;
    name: string;
    type: string;
  } | null;
}

const transactionTypeConfig = {
  EXPENSE: {
    label: 'Expense',
    icon: ArrowDownRight,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-500/20',
    borderColor: 'border-red-200 dark:border-red-500/30',
  },
  GOAL_CONTRIBUTION: {
    label: 'Goal Contribution',
    icon: Target,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-500/20',
    borderColor: 'border-emerald-200 dark:border-emerald-500/30',
  },
  INCOME: {
    label: 'Income',
    icon: ArrowUpRight,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-500/20',
    borderColor: 'border-green-200 dark:border-green-500/30',
  },
  TRANSFER: {
    label: 'Transfer',
    icon: ArrowLeftRight,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-500/20',
    borderColor: 'border-blue-200 dark:border-blue-500/30',
  },
};

const accountTypeIcons: Record<string, React.ReactNode> = {
  CASH: <Coins className="w-4 h-4" />,
  BANK_ACCOUNT: <Building2 className="w-4 h-4" />,
  CREDIT_CARD: <CreditCard className="w-4 h-4" />,
  WALLET: <Smartphone className="w-4 h-4" />,
  INVESTMENT: <TrendingUp className="w-4 h-4" />,
  LOAN: <FileText className="w-4 h-4" />,
  OTHER: <Wallet className="w-4 h-4" />,
};

export default function TransactionsPage() {
  const { user } = useAuthStore();
  const currency = user?.currency || 'INR';

  const [page, setPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const limit = 20;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['transactions', page, typeFilter, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', (page * limit).toString());
      if (typeFilter) params.append('type', typeFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`/transactions?${params.toString()}`);
      return response.data;
    },
  });

  const transactions: Transaction[] = data?.data?.transactions || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  // Filter by search query locally
  const filteredTransactions = transactions.filter((t) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      t.description?.toLowerCase().includes(query) ||
      t.source?.toLowerCase().includes(query) ||
      t.destination?.toLowerCase().includes(query) ||
      t.budgetItem?.category.toLowerCase().includes(query) ||
      t.financialGoal?.name.toLowerCase().includes(query) ||
      t.fromAccount?.name.toLowerCase().includes(query) ||
      t.toAccount?.name.toLowerCase().includes(query)
    );
  });

  // Calculate summary
  const summary = transactions.reduce(
    (acc, t) => {
      if (t.type === 'EXPENSE') acc.expenses += t.amount;
      else if (t.type === 'INCOME') acc.income += t.amount;
      else if (t.type === 'GOAL_CONTRIBUTION') acc.goalContributions += t.amount;
      else if (t.type === 'TRANSFER') acc.transfers += t.amount;
      return acc;
    },
    { expenses: 0, income: 0, goalContributions: 0, transfers: 0 }
  );

  const clearFilters = () => {
    setTypeFilter('');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setPage(0);
  };

  const hasActiveFilters = typeFilter || startDate || endDate || searchQuery;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-500 via-violet-600 to-purple-700 rounded-2xl p-6 lg:p-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">Transactions</h1>
              <p className="text-violet-100 max-w-md">
                View and manage all your financial transactions in one place.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                className={`${showFilters ? 'bg-white text-violet-600' : 'bg-white/20 text-white border-white/30'} hover:bg-white/90 hover:text-violet-600`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 w-2 h-2 bg-violet-400 rounded-full" />
                )}
              </Button>
              <Button
                onClick={() => refetch()}
                className="bg-white/20 text-white border-white/30 hover:bg-white/30"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search transactions..."
                    className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
              </div>

              <div className="min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setPage(0);
                  }}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Types</option>
                  <option value="EXPENSE">Expenses</option>
                  <option value="INCOME">Income</option>
                  <option value="GOAL_CONTRIBUTION">Goal Contributions</option>
                  <option value="TRANSFER">Transfers</option>
                </select>
              </div>

              <div className="min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(0);
                  }}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(0);
                  }}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="text-gray-600"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 font-medium">Income</span>
            </div>
            <p className="text-xl font-bold text-green-800">
              {formatCurrency(summary.income, currency)}
            </p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownRight className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700 font-medium">Expenses</span>
            </div>
            <p className="text-xl font-bold text-red-800">
              {formatCurrency(summary.expenses, currency)}
            </p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-emerald-700 font-medium">Savings</span>
            </div>
            <p className="text-xl font-bold text-emerald-800">
              {formatCurrency(summary.goalContributions, currency)}
            </p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <ArrowLeftRight className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700 font-medium">Transfers</span>
            </div>
            <p className="text-xl font-bold text-blue-800">
              {formatCurrency(summary.transfers, currency)}
            </p>
          </Card>
        </div>

        {/* Transactions List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <RefreshCw className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <Card className="p-12 text-center">
            <Receipt className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">No transactions found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {hasActiveFilters
                ? 'Try adjusting your filters to see more results.'
                : 'Start by adding transactions in your budget or financial goals.'}
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category / Goal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredTransactions.map((transaction) => {
                    const config = transactionTypeConfig[transaction.type];
                    const Icon = config.icon;

                    return (
                      <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {formatDate(transaction.date)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color} ${config.borderColor} border`}
                          >
                            <Icon className="w-3 h-3" />
                            {config.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-800 dark:text-white font-medium">
                            {transaction.description || '-'}
                          </p>
                          {(transaction.source || transaction.destination) && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {transaction.source && `From: ${transaction.source}`}
                              {transaction.source && transaction.destination && ' → '}
                              {transaction.destination && `To: ${transaction.destination}`}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {transaction.budgetItem ? (
                            <div>
                              <p className="text-sm text-gray-800 dark:text-white">
                                {transaction.budgetItem.name || transaction.budgetItem.category.replace(/_/g, ' ')}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Budget • {transaction.budgetItem.budget.month}/{transaction.budgetItem.budget.year}
                              </p>
                            </div>
                          ) : transaction.financialGoal ? (
                            <div>
                              <p className="text-sm text-gray-800 dark:text-white">{transaction.financialGoal.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Goal • {transaction.financialGoal.type.replace(/_/g, ' ')}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {transaction.fromAccount || transaction.toAccount ? (
                            <div className="flex items-center gap-2 text-sm">
                              {transaction.fromAccount && (
                                <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300">
                                  {accountTypeIcons[transaction.fromAccount.type]}
                                  {transaction.fromAccount.name}
                                </span>
                              )}
                              {transaction.fromAccount && transaction.toAccount && (
                                <ArrowLeftRight className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                              )}
                              {transaction.toAccount && !transaction.fromAccount && (
                                <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300">
                                  {accountTypeIcons[transaction.toAccount.type]}
                                  {transaction.toAccount.name}
                                </span>
                              )}
                              {transaction.toAccount && transaction.fromAccount && (
                                <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300">
                                  {accountTypeIcons[transaction.toAccount.type]}
                                  {transaction.toAccount.name}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span
                            className={`text-sm font-semibold ${
                              transaction.type === 'EXPENSE'
                                ? 'text-red-600'
                                : transaction.type === 'INCOME'
                                ? 'text-green-600'
                                : transaction.type === 'GOAL_CONTRIBUTION'
                                ? 'text-emerald-600'
                                : 'text-blue-600'
                            }`}
                          >
                            {transaction.type === 'EXPENSE' ? '-' : '+'}
                            {formatCurrency(transaction.amount, currency)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <p className="text-sm text-gray-600">
                  Showing {page * limit + 1} - {Math.min((page + 1) * limit, total)} of {total} transactions
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
