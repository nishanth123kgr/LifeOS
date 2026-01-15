'use client';

import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import api from '@/lib/api';
import { ArrowLeft, Settings2 } from 'lucide-react';
import Link from 'next/link';

const systemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string(),
  adherenceTarget: z.number().min(0).max(100),
});

type SystemForm = z.infer<typeof systemSchema>;

interface LifeSystem {
  id: string;
  name: string;
  description?: string;
  category: string;
  adherenceTarget: number;
}

const categories = [
  { value: 'FINANCE', label: '💰 Finance' },
  { value: 'HEALTH', label: '🏃 Health' },
  { value: 'PRODUCTIVITY', label: '⚡ Productivity' },
  { value: 'RELATIONSHIPS', label: '❤️ Relationships' },
  { value: 'LEARNING', label: '📚 Learning' },
  { value: 'OTHER', label: '📌 Other' },
];

export default function EditSystemPage() {
  const router = useRouter();
  const params = useParams();
  const systemId = params.id as string;
  const queryClient = useQueryClient();

  const { data: systemData, isLoading } = useQuery<{ data: { system: LifeSystem } }>({
    queryKey: ['life-system', systemId],
    queryFn: async () => {
      const response = await api.get(`/life-systems/${systemId}`);
      return response.data;
    },
  });

  const system = systemData?.data?.system;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SystemForm>({
    resolver: zodResolver(systemSchema),
    defaultValues: {
      category: 'FINANCE',
      adherenceTarget: 80,
    },
  });

  useEffect(() => {
    if (system) {
      reset({
        name: system.name,
        description: system.description || '',
        category: system.category,
        adherenceTarget: system.adherenceTarget,
      });
    }
  }, [system, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: SystemForm) => api.patch(`/life-systems/${systemId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-systems'] });
      queryClient.invalidateQueries({ queryKey: ['life-system', systemId] });
      toast.success('System updated successfully!');
      router.push('/systems');
    },
    onError: () => toast.error('Failed to update system'),
  });

  const onSubmit = (data: SystemForm) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/systems"
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Life System</h1>
            <p className="text-gray-500 dark:text-gray-400">Update your system details</p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Settings2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">System Details</h2>
                <p className="text-white/80 text-sm">Keep optimizing your systems</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="space-y-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Category"
                  options={categories}
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
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/systems')}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 sm:flex-none"
                isLoading={updateMutation.isPending}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
