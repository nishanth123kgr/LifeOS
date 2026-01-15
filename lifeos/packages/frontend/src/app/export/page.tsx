'use client';

import { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, Calendar, Check, Loader2, Package } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';
import toast from 'react-hot-toast';

type ExportFormat = 'json' | 'csv';
type DataType = 'all' | 'financial_goals' | 'fitness_goals' | 'habits' | 'life_systems' | 'journal' | 'budget';

interface ExportOption {
  id: DataType;
  label: string;
  description: string;
}

const exportOptions: ExportOption[] = [
  { id: 'all', label: 'All Data', description: 'Export everything in one file' },
  { id: 'financial_goals', label: 'Financial Goals', description: 'Your savings and investment goals' },
  { id: 'fitness_goals', label: 'Fitness Goals', description: 'Health and fitness targets' },
  { id: 'habits', label: 'Habits', description: 'Habit tracking data and check-ins' },
  { id: 'life_systems', label: 'Life Systems', description: 'Your behavioral systems and adherence' },
  { id: 'journal', label: 'Journal Entries', description: 'Personal journal and mood data' },
  { id: 'budget', label: 'Budget', description: 'Monthly budgets and expenses' },
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

      // Create download link
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Download className="w-8 h-8 text-primary-500" />
            Export Data
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Download your data for backup or analysis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Data Selection */}
          <Card className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Select Data to Export
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {exportOptions.map(option => {
                const isSelected = selectedData.includes(option.id) || 
                  (option.id !== 'all' && selectedData.includes('all'));
                return (
                  <button
                    key={option.id}
                    onClick={() => toggleDataType(option.id)}
                    disabled={option.id !== 'all' && selectedData.includes('all')}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    } ${option.id !== 'all' && selectedData.includes('all') ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {option.label}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {option.description}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-5 h-5 text-primary-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Export Options */}
          <div className="space-y-6">
            {/* Format */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Format
              </h2>
              <div className="space-y-2">
                <button
                  onClick={() => setFormat('json')}
                  className={`w-full p-3 rounded-lg border flex items-center gap-3 transition-all ${
                    format === 'json'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <FileJson className={`w-5 h-5 ${format === 'json' ? 'text-primary-500' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">JSON</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Best for backups</p>
                  </div>
                </button>
                <button
                  onClick={() => setFormat('csv')}
                  className={`w-full p-3 rounded-lg border flex items-center gap-3 transition-all ${
                    format === 'csv'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <FileSpreadsheet className={`w-5 h-5 ${format === 'csv' ? 'text-primary-500' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">CSV</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">For spreadsheets</p>
                  </div>
                </button>
              </div>
            </Card>

            {/* Date Range */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Date Range
              </h2>
              <div className="space-y-2">
                {[
                  { id: 'all', label: 'All Time' },
                  { id: '30days', label: 'Last 30 Days' },
                  { id: '90days', label: 'Last 90 Days' },
                  { id: '1year', label: 'Last Year' },
                ].map(option => (
                  <button
                    key={option.id}
                    onClick={() => setDateRange(option.id as typeof dateRange)}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      dateRange === option.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <span className="font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Export Button */}
            <Button
              onClick={handleExport}
              disabled={loading || selectedData.length === 0}
              className="w-full"
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
                  Export Data
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Your Data, Your Control
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
            <li>• Exports include all your personal data stored in LifeOS</li>
            <li>• JSON format preserves all data structure for complete backups</li>
            <li>• CSV format works with Excel, Google Sheets, and other tools</li>
            <li>• Regular exports are recommended for data safety</li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  );
}
