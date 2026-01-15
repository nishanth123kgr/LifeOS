'use client';

import { useState } from 'react';
import {
  Download,
  FileJson,
  FileSpreadsheet,
  Calendar,
  Check,
  Loader2,
  Package,
  HardDrive,
  Shield,
  Clock,
  Target,
  Dumbbell,
  CheckSquare,
  Settings2,
  BookOpen,
  Wallet,
  Database,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

type ExportFormat = 'json' | 'csv';
type DataType = 'all' | 'financial_goals' | 'fitness_goals' | 'habits' | 'life_systems' | 'journal' | 'budget';

interface ExportOption {
  id: DataType;
  label: string;
  description: string;
  icon: any;
  color: string;
  lightBg: string;
}

const exportOptions: ExportOption[] = [
  { id: 'all', label: 'All Data', description: 'Export everything in one file', icon: Database, color: 'text-primary-600 dark:text-primary-400', lightBg: 'bg-primary-50 dark:bg-primary-500/10' },
  { id: 'financial_goals', label: 'Financial Goals', description: 'Savings and investment goals', icon: Target, color: 'text-emerald-600 dark:text-emerald-400', lightBg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  { id: 'fitness_goals', label: 'Fitness Goals', description: 'Health and fitness targets', icon: Dumbbell, color: 'text-blue-600 dark:text-blue-400', lightBg: 'bg-blue-50 dark:bg-blue-500/10' },
  { id: 'habits', label: 'Habits', description: 'Habit tracking and check-ins', icon: CheckSquare, color: 'text-orange-600 dark:text-orange-400', lightBg: 'bg-orange-50 dark:bg-orange-500/10' },
  { id: 'life_systems', label: 'Life Systems', description: 'Behavioral systems data', icon: Settings2, color: 'text-purple-600 dark:text-purple-400', lightBg: 'bg-purple-50 dark:bg-purple-500/10' },
  { id: 'journal', label: 'Journal Entries', description: 'Personal journal and mood', icon: BookOpen, color: 'text-pink-600 dark:text-pink-400', lightBg: 'bg-pink-50 dark:bg-pink-500/10' },
  { id: 'budget', label: 'Budget', description: 'Monthly budgets and expenses', icon: Wallet, color: 'text-cyan-600 dark:text-cyan-400', lightBg: 'bg-cyan-50 dark:bg-cyan-500/10' },
];

const dateRangeOptions = [
  { id: 'all', label: 'All Time', description: 'Complete history' },
  { id: '30days', label: 'Last 30 Days', description: 'Recent month' },
  { id: '90days', label: 'Last 90 Days', description: 'Recent quarter' },
  { id: '1year', label: 'Last Year', description: 'Past 12 months' },
];

export default function ExportPage() {
  const [selectedData, setSelectedData] = useState<DataType[]>(['all']);
  const [format, setFormat] = useState<ExportFormat>('json');
  const [dateRange, setDateRange] = useState<'all' | '30days' | '90days' | '1year'>('all');
  const [loading, setLoading] = useState(false);

  const toggleDataType = (type: DataType) => {
    if (type === 'all') {
      setSelectedData(['all']);
    } else {
      setSelectedData(prev => {
        const filtered = prev.filter(t => t !== 'all');
        if (filtered.includes(type)) {
          return filtered.filter(t => t !== type);
        }
        return [...filtered, type];
      });
    }
  };

  const handleExport = async () => {
    if (selectedData.length === 0) {
      toast.error('Please select at least one data type to export');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        format,
        dateRange,
        types: selectedData.join(','),
      });

      const response = await api.get(`/export?${params.toString()}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: format === 'json' ? 'application/json' : 'text/csv',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lifeos-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Export downloaded successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = selectedData.includes('all') ? exportOptions.length - 1 : selectedData.length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 p-8">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute right-20 top-20 w-20 h-20 bg-white/5 rounded-full blur-xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Download className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">Export Data</h1>
              </div>
              <p className="text-white/80 max-w-lg text-lg">
                Download your data for backup, analysis, or migration. Your data belongs to you.
              </p>
            </div>
            <Button
              onClick={handleExport}
              disabled={loading || selectedData.length === 0}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white shadow-lg"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Export Now
                </>
              )}
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="relative flex items-center gap-6 mt-6">
            <div className="flex items-center gap-2 text-white/90">
              <HardDrive className="w-5 h-5" />
              <span className="font-medium">{selectedCount} Categories Selected</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <Clock className="w-5 h-5" />
              <span className="font-medium">{dateRangeOptions.find(d => d.id === dateRange)?.label}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Data Selection */}
          <Card className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Select Data to Export
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Choose which categories of data to include in your export
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {exportOptions.map(option => {
                const isSelected = selectedData.includes(option.id) ||
                  (option.id !== 'all' && selectedData.includes('all'));
                const isDisabled = option.id !== 'all' && selectedData.includes('all');
                const Icon = option.icon;

                return (
                  <button
                    key={option.id}
                    onClick={() => toggleDataType(option.id)}
                    disabled={isDisabled}
                    className={cn(
                      'p-4 rounded-xl border-2 text-left transition-all duration-200 group',
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm',
                      isDisabled && 'opacity-60 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110',
                        option.lightBg
                      )}>
                        <Icon className={cn('w-5 h-5', option.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {option.label}
                          </h3>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Export Options */}
          <div className="space-y-6">
            {/* Format Selection */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Export Format
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => setFormat('json')}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all duration-200',
                    format === 'json'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    format === 'json' ? 'bg-primary-100 dark:bg-primary-900/50' : 'bg-gray-100 dark:bg-gray-800'
                  )}>
                    <FileJson className={cn('w-6 h-6', format === 'json' ? 'text-primary-600' : 'text-gray-400')} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">JSON</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Best for backups & imports</p>
                  </div>
                  {format === 'json' && (
                    <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
                <button
                  onClick={() => setFormat('csv')}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all duration-200',
                    format === 'csv'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    format === 'csv' ? 'bg-primary-100 dark:bg-primary-900/50' : 'bg-gray-100 dark:bg-gray-800'
                  )}>
                    <FileSpreadsheet className={cn('w-6 h-6', format === 'csv' ? 'text-primary-600' : 'text-gray-400')} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">CSV</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">For Excel & Google Sheets</p>
                  </div>
                  {format === 'csv' && (
                    <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              </div>
            </Card>

            {/* Date Range */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                Date Range
              </h2>
              <div className="space-y-2">
                {dateRangeOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => setDateRange(option.id as typeof dateRange)}
                    className={cn(
                      'w-full p-3 rounded-lg border-2 text-left transition-all flex items-center justify-between',
                      dateRange === option.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                  >
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {option.label}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                        {option.description}
                      </span>
                    </div>
                    {dateRange === option.id && (
                      <div className="w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-500/30">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl shrink-0">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 text-lg">
                Your Data, Your Control
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: Package, text: 'Exports include all your personal data stored in LifeOS' },
                  { icon: FileJson, text: 'JSON format preserves all data structure for complete backups' },
                  { icon: FileSpreadsheet, text: 'CSV format works with Excel, Google Sheets, and more' },
                  { icon: Shield, text: 'Regular exports are recommended for data safety' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <item.icon className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-blue-800 dark:text-blue-400">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
