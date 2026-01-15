'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import api from '@/lib/api';
import { ArrowLeft, Settings2, Lightbulb } from 'lucide-react';
import Link from 'next/link';

const systemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string(),
  adherenceTarget: z.number().min(0).max(100),
});

type SystemForm = z.infer<typeof systemSchema>;

const categories = [
  { value: 'FINANCE', label: '💰 Finance' },
  { value: 'HEALTH', label: '🏃 Health' },
  { value: 'PRODUCTIVITY', label: '⚡ Productivity' },
  { value: 'RELATIONSHIPS', label: '❤️ Relationships' },
  { value: 'LEARNING', label: '📚 Learning' },
  { value: 'OTHER', label: '📌 Other' },
];

export default function NewSystemPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SystemForm>({
    resolver: zodResolver(systemSchema),
    defaultValues: {
      category: 'FINANCE',
      adherenceTarget: 80,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: SystemForm) => api.post('/life-systems', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-systems'] });
      toast.success('Life system created successfully!');
      router.push('/systems');
    },
    onError: () => toast.error('Failed to create system'),
  });

  const onSubmit = (data: SystemForm) => {
    createMutation.mutate(data);
  };

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Life System</h1>
            <p className="text-gray-500 dark:text-gray-400">Build systems that work for you</p>
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
                <p className="text-white/80 text-sm">Define your life operating principles</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="space-y-4">
              <Input
                label="System Name"
                placeholder="e.g., Pay yourself first, 80/20 Rule"
                error={errors.name?.message}
                {...register('name')}
              />

              <Input
                label="Description (optional)"
                placeholder="e.g., Save 20% of income before any spending"
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

            {/* Examples Section */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-300">Example Systems</h4>
                  <ul className="mt-1 text-sm text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• <strong>Pay yourself first</strong> - Save before spending</li>
                    <li>• <strong>Two-minute rule</strong> - Do it now if it takes less than 2 mins</li>
                    <li>• <strong>No zero days</strong> - Do something productive every day</li>
                  </ul>
                </div>
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
                isLoading={createMutation.isPending}
              >
                Create System
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
