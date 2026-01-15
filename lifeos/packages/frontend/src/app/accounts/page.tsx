'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import {
  Plus,
  Edit2,
  Trash2,
  Wallet,
  Building2,
  CreditCard,
  Smartphone,
  TrendingUp,
  FileText,
  MoreVertical,
  Eye,
  EyeOff,
  Coins,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  initialBalance: number;
  institution?: string;
  accountNumber?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  includeInTotal: boolean;
  notes?: string;
  createdAt: string;
}

interface AccountSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  byType: Record<string, { count: number; total: number }>;
}

interface AccountsResponse {
  accounts: Account[];
  summary: AccountSummary;
}

const accountTypeIcons: Record<string, React.ReactNode> = {
  CASH: <Coins className="w-5 h-5" />,
  BANK_ACCOUNT: <Building2 className="w-5 h-5" />,
  CREDIT_CARD: <CreditCard className="w-5 h-5" />,
  WALLET: <Smartphone className="w-5 h-5" />,
  INVESTMENT: <TrendingUp className="w-5 h-5" />,
  LOAN: <FileText className="w-5 h-5" />,
  OTHER: <Wallet className="w-5 h-5" />,
};

const accountTypeLabels: Record<string, string> = {
  CASH: 'Cash',
  BANK_ACCOUNT: 'Bank Account',
  CREDIT_CARD: 'Credit Card',
  WALLET: 'Digital Wallet',
  INVESTMENT: 'Investment',
  LOAN: 'Loan',
  OTHER: 'Other',
};

const accountTypeColors: Record<string, string> = {
  CASH: 'bg-green-100 text-green-700 border-green-200',
  BANK_ACCOUNT: 'bg-blue-100 text-blue-700 border-blue-200',
  CREDIT_CARD: 'bg-purple-100 text-purple-700 border-purple-200',
  WALLET: 'bg-amber-100 text-amber-700 border-amber-200',
  INVESTMENT: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  LOAN: 'bg-red-100 text-red-700 border-red-200',
  OTHER: 'bg-gray-100 text-gray-700 border-gray-200',
};

export default function AccountsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const currency = user?.currency || 'INR';
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const { data, isLoading } = useQuery<AccountsResponse>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await api.get('/accounts');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Account>) => api.post('/accounts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Account created successfully!');
      setShowAddModal(false);
    },
    onError: () => toast.error('Failed to create account'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Account> }) =>
      api.put(`/accounts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Account updated successfully!');
      setEditingAccount(null);
    },
    onError: () => toast.error('Failed to update account'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Account deactivated!');
    },
    onError: () => toast.error('Failed to deactivate account'),
  });

  const accounts = data?.accounts || [];
  const summary = data?.summary || { totalAssets: 0, totalLiabilities: 0, netWorth: 0, byType: {} };

  // Group accounts by type
  const groupedAccounts = accounts.reduce((acc, account) => {
    if (!acc[account.type]) {
      acc[account.type] = [];
    }
    acc[account.type].push(account);
    return acc;
  }, {} as Record<string, Account[]>);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 rounded-2xl p-6 lg:p-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">Chart of Accounts</h1>
              <p className="text-indigo-100 max-w-md">
                Manage your financial accounts and track your net worth. You have {accounts.length} active account{accounts.length !== 1 ? 's' : ''}.
              </p>
            </div>

            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          </div>
        </div>

        {/* Net Worth Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500 rounded-lg">
                <ArrowUpRight className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-green-700 font-medium">Total Assets</span>
            </div>
            <p className="text-2xl font-bold text-green-800">
              {formatCurrency(summary.totalAssets, currency)}
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500 rounded-lg">
                <ArrowDownRight className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-red-700 font-medium">Total Liabilities</span>
            </div>
            <p className="text-2xl font-bold text-red-800">
              {formatCurrency(summary.totalLiabilities, currency)}
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-500 rounded-lg">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-indigo-700 font-medium">Net Worth</span>
            </div>
            <p className={`text-2xl font-bold ${summary.netWorth >= 0 ? 'text-indigo-800' : 'text-red-800'}`}>
              {formatCurrency(summary.netWorth, currency)}
            </p>
          </Card>
        </div>

        {/* Accounts by Type */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : accounts.length === 0 ? (
          <Card className="p-12 text-center">
            <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">No accounts yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Start tracking your finances by adding your first account.
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Account
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedAccounts).map(([type, typeAccounts]) => (
              <div key={type}>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <span className={`p-2 rounded-lg border ${accountTypeColors[type]}`}>
                    {accountTypeIcons[type]}
                  </span>
                  {accountTypeLabels[type] || type}
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    ({typeAccounts.length})
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeAccounts.map((account) => (
                    <Card
                      key={account.id}
                      className={`p-5 relative ${!account.isActive ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-white">{account.name}</h3>
                          {account.institution && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{account.institution}</p>
                          )}
                          {account.accountNumber && (
                            <p className="text-xs text-gray-400 dark:text-gray-500">•••• {account.accountNumber}</p>
                          )}
                        </div>
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === account.id ? null : account.id)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </button>
                          {openDropdown === account.id && (
                            <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg z-10 py-1">
                              <button
                                onClick={() => {
                                  setEditingAccount(account);
                                  setOpenDropdown(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                              >
                                <Edit2 className="w-4 h-4" /> Edit
                              </button>
                              <button
                                onClick={() => {
                                  updateMutation.mutate({
                                    id: account.id,
                                    data: { includeInTotal: !account.includeInTotal },
                                  });
                                  setOpenDropdown(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                              >
                                {account.includeInTotal ? (
                                  <>
                                    <EyeOff className="w-4 h-4" /> Exclude
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-4 h-4" /> Include
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Deactivate this account?')) {
                                    deleteMutation.mutate(account.id);
                                  }
                                  setOpenDropdown(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" /> Deactivate
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Balance</p>
                        <p
                          className={`text-2xl font-bold ${
                            account.balance >= 0 ? 'text-gray-800 dark:text-white' : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {formatCurrency(account.balance, currency)}
                        </p>
                      </div>

                      {!account.includeInTotal && (
                        <div className="mt-3">
                          <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
                            Excluded from net worth
                          </span>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Account Modal */}
      {(showAddModal || editingAccount) && (
        <AccountModal
          account={editingAccount}
          onClose={() => {
            setShowAddModal(false);
            setEditingAccount(null);
          }}
          onSubmit={(data) => {
            if (editingAccount) {
              updateMutation.mutate({ id: editingAccount.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
          currency={currency}
        />
      )}
    </DashboardLayout>
  );
}

// Account Modal Component
function AccountModal({
  account,
  onClose,
  onSubmit,
  isLoading,
  currency,
}: {
  account: Account | null;
  onClose: () => void;
  onSubmit: (data: Partial<Account>) => void;
  isLoading: boolean;
  currency: string;
}) {
  const [name, setName] = useState(account?.name || '');
  const [type, setType] = useState(account?.type || 'BANK_ACCOUNT');
  const [balance, setBalance] = useState(account?.balance?.toString() || '0');
  const [institution, setInstitution] = useState(account?.institution || '');
  const [accountNumber, setAccountNumber] = useState(account?.accountNumber || '');
  const [notes, setNotes] = useState(account?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      type,
      balance: parseFloat(balance) || 0,
      institution: institution || undefined,
      accountNumber: accountNumber || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md max-h-[90vh] overflow-auto">
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {account ? 'Edit Account' : 'Add New Account'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Account Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., HDFC Savings"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Account Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="CASH">Cash</option>
              <option value="BANK_ACCOUNT">Bank Account</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="WALLET">Digital Wallet</option>
              <option value="INVESTMENT">Investment</option>
              <option value="LOAN">Loan</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Balance ({currency})
            </label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              step="0.01"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              For credit cards/loans, enter the amount owed as a positive number.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Institution (optional)
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., HDFC Bank, PayTM, Zerodha"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Account Number (last 4 digits)
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., 1234"
              maxLength={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={2}
              placeholder="Any additional notes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? 'Saving...' : account ? 'Update Account' : 'Add Account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
