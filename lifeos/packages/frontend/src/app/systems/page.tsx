'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { isToday } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import api from '@/lib/api';
import { Plus, X, Edit2, Trash2, Check, Settings2, Link } from 'lucide-react';
import { cn } from '@/lib/utils';

const systemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string(),
  adherenceTarget: z.number().min(0).max(100).optional(),
});

type SystemForm = z.infer<typeof systemSchema>;

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSystem, setEditingSystem] = useState<LifeSystem | null>(null);

  const { data, isLoading } = useQuery<{ data: { systems: LifeSystem[] } }>({
    queryKey: ['life-systems'],
    queryFn: async () => {
      const response = await api.get('/life-systems');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: SystemForm) => api.post('/life-systems', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-systems'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('System created successfully!');
      setIsModalOpen(false);
      reset();
    },
    onError: () => toast.error('Failed to create system'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SystemForm> }) =>
      api.patch(`/life-systems/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-systems'] });
      toast.success('System updated successfully!');
      setIsModalOpen(false);
      setEditingSystem(null);
      reset();
    },
    onError: () => toast.error('Failed to update system'),
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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<SystemForm>({
    resolver: zodResolver(systemSchema),
    defaultValues: {
      category: 'PRODUCTIVITY',
      adherenceTarget: 80,
    },
  });

  const onSubmit = (data: SystemForm) => {
    if (editingSystem) {
      updateMutation.mutate({ id: editingSystem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditModal = (system: LifeSystem) => {
    setEditingSystem(system);
    setValue('name', system.name);
    setValue('description', system.description || '');
    setValue('category', system.category);
    setValue('adherenceTarget', system.adherenceTarget);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSystem(null);
    reset();
  };

  const isLoggedToday = (system: LifeSystem): boolean => {
    if (!system.adherenceLogs || system.adherenceLogs.length === 0) return false;
    return system.adherenceLogs.some(l => isToday(new Date(l.date)));
  };

  const getTodayAdherence = (system: LifeSystem): boolean | null => {
    const todayLog = system.adherenceLogs?.find(l => isToday(new Date(l.date)));
    return todayLog ? todayLog.adhered : null;
  };

  const systems = data?.data?.systems || [];
  const avgAdherence = systems.length > 0
    ? Math.round(systems.reduce((sum, s) => sum + s.currentAdherence, 0) / systems.length)
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Life Systems</h1>
            <p className="text-gray-600 dark:text-gray-400">Rules that govern your behavior, not just goals</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add System
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Systems</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{systems.filter(s => s.isActive).length}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500 dark:text-gray-400">Average Adherence</p>
            <p className={cn('text-3xl font-bold', avgAdherence >= 80 ? 'text-success-600 dark:text-success-500' : avgAdherence >= 50 ? 'text-warning-600 dark:text-warning-500' : 'text-danger-600 dark:text-danger-500')}>
              {avgAdherence}%
            </p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500 dark:text-gray-400">On Track Systems</p>
            <p className="text-3xl font-bold text-success-600 dark:text-success-500">
              {systems.filter(s => s.currentAdherence >= s.adherenceTarget).length}/{systems.length}
            </p>
          </Card>
        </div>

        {/* Example Systems */}
        {systems.length === 0 && !isLoading && (
          <Card className="bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
            <h3 className="font-semibold text-primary-900 dark:text-primary-300 mb-2">Example Life Systems</h3>
            <ul className="text-sm text-primary-800 dark:text-primary-400 space-y-1">
              <li>• "Pay yourself first" - Save before spending</li>
              <li>• "No phone for first 30 minutes" - Morning routine</li>
              <li>• "Train 5x per week" - Fitness commitment</li>
              <li>• "Read 30 minutes daily" - Learning habit</li>
              <li>• "Weekly review every Sunday" - Reflection practice</li>
            </ul>
          </Card>
        )}

        {/* Systems Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : systems.length === 0 ? (
          <Card className="text-center py-12">
            <Settings2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No life systems yet</p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First System
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {systems.map((system) => {
              const logged = isLoggedToday(system);
              const todayValue = getTodayAdherence(system);
              const isOnTrack = system.currentAdherence >= system.adherenceTarget;

              return (
                <Card key={system.id} className={cn(isOnTrack && 'border-success-300 dark:border-success-700')}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {categories.find(c => c.value === system.category)?.label.split(' ')[0]}
                        </span>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{system.name}</h3>
                      </div>
                      {system.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{system.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Adherence Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Adherence (30 days)</span>
                      <span className={cn('font-medium', isOnTrack ? 'text-success-600 dark:text-success-500' : 'text-warning-600 dark:text-warning-500')}>
                        {system.currentAdherence}% / {system.adherenceTarget}%
                      </span>
                    </div>
                    <ProgressBar value={system.currentAdherence} size="md" showLabel={false} />
                  </div>

                  {/* Today's Log */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => logAdherenceMutation.mutate({ id: system.id, adhered: true })}
                      className={cn(
                        'flex-1 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-all',
                        todayValue === true
                          ? 'bg-success-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-success-100 dark:hover:bg-success-900/30'
                      )}
                    >
                      <Check className="w-4 h-4" />
                      Yes
                    </button>
                    <button
                      onClick={() => logAdherenceMutation.mutate({ id: system.id, adhered: false })}
                      className={cn(
                        'flex-1 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-all',
                        todayValue === false
                          ? 'bg-danger-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-danger-100 dark:hover:bg-danger-900/30'
                      )}
                    >
                      <X className="w-4 h-4" />
                      No
                    </button>
                  </div>

                  {/* Linked items */}
                  {(system.linkedFinancialGoals.length > 0 ||
                    system.linkedFitnessGoals.length > 0 ||
                    system.linkedHabits.length > 0) && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                      <Link className="w-3 h-3" />
                      <span>
                        Linked to {system.linkedFinancialGoals.length + system.linkedFitnessGoals.length + system.linkedHabits.length} items
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(system)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this system?')) {
                          deleteMutation.mutate(system.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-danger-500" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingSystem ? 'Edit System' : 'Create Life System'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                <Input
                  label="System Name"
                  placeholder="e.g., Pay yourself first"
                  error={errors.name?.message}
                  {...register('name')}
                />

                <Input
                  label="Description (optional)"
                  placeholder="e.g., Save 20% of income before spending"
                  {...register('description')}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Category"
                    options={categories.map(c => ({ value: c.value, label: c.label }))}
                    {...register('category')}
                  />
                  <Input
                    label="Target Adherence %"
                    type="number"
                    min="0"
                    max="100"
                    {...register('adherenceTarget', { valueAsNumber: true })}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    isLoading={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingSystem ? 'Update System' : 'Create System'}
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
