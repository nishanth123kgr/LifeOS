'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { isToday } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import api from '@/lib/api';
import Link from 'next/link';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  Settings2, 
  Target,
  TrendingUp,
  CheckCircle,
  MoreVertical,
  Wallet,
  Heart,
  Briefcase,
  Users,
  BookOpen,
  Puzzle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LifeSystem {
  id: string;
  name: string;
  description?: string;
  category: string;
  adherenceTarget: number;
  isActive: boolean;
  currentAdherence: number;
  adherenceLogs: Array<{ date: string; adhered: boolean }>;
  linkedFinancialGoals: Array<{ id: string; name: string }>;
  linkedFitnessGoals: Array<{ id: string; name: string }>;
  linkedHabits: Array<{ id: string; name: string }>;
}

const categories = [
  { value: 'FINANCE', label: 'Finance' },
  { value: 'HEALTH', label: 'Health' },
  { value: 'PRODUCTIVITY', label: 'Productivity' },
  { value: 'RELATIONSHIPS', label: 'Relationships' },
  { value: 'LEARNING', label: 'Learning' },
  { value: 'CUSTOM', label: 'Custom' },
];

export default function LifeSystemsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ data: { systems: LifeSystem[] } }>({
    queryKey: ['life-systems'],
    queryFn: async () => {
      const response = await api.get('/life-systems');
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/life-systems/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-systems'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('System deleted successfully!');
    },
    onError: () => toast.error('Failed to delete system'),
  });

  const logAdherenceMutation = useMutation({
    mutationFn: ({ id, adhered }: { id: string; adhered: boolean }) =>
      api.post(`/life-systems/${id}/adherence`, { adhered }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-systems'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Adherence logged!');
    },
    onError: () => toast.error('Failed to log adherence'),
  });

  const isLoggedToday = (system: LifeSystem): boolean => {
    if (!system.adherenceLogs || system.adherenceLogs.length === 0) return false;
    return system.adherenceLogs.some(l => isToday(new Date(l.date)));
  };

  const getTodayAdherence = (system: LifeSystem): boolean | null => {
    const todayLog = system.adherenceLogs?.find(l => isToday(new Date(l.date)));
    return todayLog ? todayLog.adhered : null;
  };

  const systems = data?.data?.systems || [];
  const activeSystems = systems.filter(s => s.isActive);
  const avgAdherence = systems.length > 0
    ? Math.round(systems.reduce((sum, s) => sum + s.currentAdherence, 0) / systems.length)
    : 0;
  const onTrackSystems = systems.filter(s => s.currentAdherence >= s.adherenceTarget);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'FINANCE': return Wallet;
      case 'HEALTH': return Heart;
      case 'PRODUCTIVITY': return Briefcase;
      case 'RELATIONSHIPS': return Users;
      case 'LEARNING': return BookOpen;
      default: return Puzzle;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'FINANCE': return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      case 'HEALTH': return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      case 'PRODUCTIVITY': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'RELATIONSHIPS': return 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400';
      case 'LEARNING': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    }
  };

  // System Card Component
  const SystemCard = ({ system }: { system: LifeSystem }) => {
    const logged = isLoggedToday(system);
    const todayValue = getTodayAdherence(system);
    const isOnTrack = system.currentAdherence >= system.adherenceTarget;
    const CategoryIcon = getCategoryIcon(system.category);

    return (
      <Card className={cn(
        'relative overflow-hidden group hover:shadow-lg transition-all duration-200',
        isOnTrack && 'ring-2 ring-green-500/30'
      )}>
        {/* Status indicator line */}
        <div className={cn(
          'absolute top-0 left-0 right-0 h-1',
          isOnTrack ? 'bg-green-500' : system.currentAdherence >= 50 ? 'bg-yellow-500' : 'bg-red-500'
        )} />

        <div className="pt-2">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', getCategoryColor(system.category))}>
                <CategoryIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{system.name}</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {categories.find(c => c.value === system.category)?.label}
                </span>
              </div>
            </div>

            {/* Dropdown menu */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === system.id ? null : system.id)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
              
              {openDropdown === system.id && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setOpenDropdown(null)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                    <Link
                      href={`/systems/${system.id}/edit`}
                      onClick={() => setOpenDropdown(null)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this system?')) {
                          deleteMutation.mutate(system.id);
                        }
                        setOpenDropdown(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {system.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{system.description}</p>
          )}

          {/* Adherence Progress */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">30-Day Adherence</span>
              <span className={cn(
                'font-semibold',
                isOnTrack ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
              )}>
                {system.currentAdherence}%
              </span>
            </div>
            <ProgressBar value={system.currentAdherence} size="md" showLabel={false} />
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-400">Target: {system.adherenceTarget}%</span>
              {isOnTrack && <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> On track
              </span>}
            </div>
          </div>

          {/* Today's Log */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Did you follow this system today?</p>
            <div className="flex gap-2">
              <button
                onClick={() => logAdherenceMutation.mutate({ id: system.id, adhered: true })}
                className={cn(
                  'flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 font-medium transition-all text-sm',
                  todayValue === true
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-700'
                )}
              >
                <Check className="w-4 h-4" />
                Yes
              </button>
              <button
                onClick={() => logAdherenceMutation.mutate({ id: system.id, adhered: false })}
                className={cn(
                  'flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 font-medium transition-all text-sm',
                  todayValue === false
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700'
                )}
              >
                <X className="w-4 h-4" />
                No
              </button>
            </div>
          </div>

          {/* Linked items */}
          {(system.linkedFinancialGoals.length > 0 ||
            system.linkedFitnessGoals.length > 0 ||
            system.linkedHabits.length > 0) && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
              <Link className="w-3 h-3" />
              <span>
                Linked to {system.linkedFinancialGoals.length + system.linkedFitnessGoals.length + system.linkedHabits.length} items
              </span>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 p-8">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Settings2 className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">Life Systems</h1>
              </div>
              <p className="text-white/80 max-w-md">
                Rules that govern your behavior, not just goals. Build lasting systems for success.
              </p>
            </div>
            <Link href="/systems/new">
              <Button 
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add System
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-100 dark:bg-cyan-900/20 rounded-bl-full" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-cyan-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Active Systems</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{activeSystems.length}</p>
            </div>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-teal-100 dark:bg-teal-900/20 rounded-bl-full" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-teal-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Avg Adherence</span>
              </div>
              <p className={cn(
                'text-3xl font-bold',
                avgAdherence >= 80 ? 'text-green-600 dark:text-green-400' : 
                avgAdherence >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 
                'text-red-600 dark:text-red-400'
              )}>
                {avgAdherence}%
              </p>
            </div>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-bl-full" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">On Track</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                <span className="text-green-600 dark:text-green-400">{onTrackSystems.length}</span>
                <span className="text-lg text-gray-400"> / {systems.length}</span>
              </p>
            </div>
          </Card>
        </div>

        {/* Example Systems */}
        {systems.length === 0 && !isLoading && (
          <Card className="bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 border-cyan-200 dark:border-cyan-800">
            <h3 className="font-semibold text-cyan-900 dark:text-cyan-300 mb-3 flex items-center gap-2">
              <Settings2 className="w-5 h-5" />
              Example Life Systems
            </h3>
            <ul className="text-sm text-cyan-800 dark:text-cyan-400 space-y-2">
              <li className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                "Pay yourself first" - Save before spending
              </li>
              <li className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                "No phone for first 30 minutes" - Morning routine
              </li>
              <li className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                "Train 5x per week" - Fitness commitment
              </li>
              <li className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                "Read 30 minutes daily" - Learning habit
              </li>
              <li className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                "Weekly review every Sunday" - Reflection practice
              </li>
            </ul>
          </Card>
        )}

        {/* Systems Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
          </div>
        ) : systems.length === 0 ? (
          <Card className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-100 dark:bg-cyan-900/30 mb-4">
              <Settings2 className="w-8 h-8 text-cyan-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No life systems yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Create systems to build lasting habits and behaviors</p>
            <Link href="/systems/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First System
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {systems.map((system) => (
              <SystemCard key={system.id} system={system} />
            ))}
          </div>
        )}


      </div>
    </DashboardLayout>
  );
}
