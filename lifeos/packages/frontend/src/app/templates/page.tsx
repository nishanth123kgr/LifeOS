'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, Star, Target, Dumbbell, CheckSquare, Copy, Check, Lightbulb } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface GoalTemplate {
  id?: string;
  name: string;
  description: string;
  category: string;
  type: string;
  defaultTarget?: number;
  defaultTargetAmount?: number;
  defaultDuration?: number;
  defaultMonthlyContribution?: number;
  defaultDurationMonths?: number;
  isPublic?: boolean;
  usageCount?: number;
  icon?: string;
}

const categoryIcons: Record<string, any> = {
  FINANCIAL: Target,
  FITNESS: Dumbbell,
  HABIT: CheckSquare,
};

const categoryColors: Record<string, string> = {
  FINANCIAL: 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400',
  FITNESS: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
  HABIT: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400',
};

export default function TemplatesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [templates, setTemplates] = useState<GoalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/templates');
      const data = response.data.templates || { predefined: [], custom: [] };
      // Combine predefined and custom templates
      const allTemplates = [
        ...(data.predefined || []).map((t: GoalTemplate, idx: number) => ({ 
          ...t, 
          id: t.id || `predefined-${idx}`,
          usageCount: t.usageCount || 0,
          isPublic: true
        })),
        ...(data.custom || [])
      ];
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const useTemplate = async (template: GoalTemplate) => {
    try {
      const response = await api.post(`/templates/${template.id}/use`);
      setCopiedId(template.id || null);
      toast.success(`Created goal from "${template.name}" template!`);
      
      // Invalidate relevant queries so fresh data is fetched
      const category = template.category.toUpperCase();
      if (category === 'FINANCIAL') {
        queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      } else if (category === 'FITNESS') {
        queryClient.invalidateQueries({ queryKey: ['fitness-goals'] });
      } else if (category === 'HABIT') {
        queryClient.invalidateQueries({ queryKey: ['habits'] });
      }
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      // Navigate to the appropriate page based on category
      setTimeout(() => {
        setCopiedId(null);
        if (category === 'FINANCIAL') {
          router.push('/goals/financial');
        } else if (category === 'FITNESS') {
          router.push('/goals/fitness');
        } else if (category === 'HABIT') {
          router.push('/habits');
        } else {
          router.push('/dashboard');
        }
      }, 1000);
    } catch (error) {
      toast.error('Failed to use template');
    }
  };

  const categories = ['FINANCIAL', 'FITNESS', 'HABIT'];

  const filteredTemplates = selectedCategory
    ? templates.filter(t => t.category === selectedCategory)
    : templates;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary-500" />
              Goal Templates
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Quick-start your goals with pre-made templates
            </p>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map(cat => {
            const Icon = categoryIcons[cat] || Star;
            return (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                <Icon className="w-4 h-4 mr-1" />
                {cat.charAt(0) + cat.slice(1).toLowerCase()}
              </Button>
            );
          })}
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <Card className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No templates available yet.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => {
              const Icon = categoryIcons[template.category] || Star;
              const colorClass = categoryColors[template.category] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
              
              return (
                <Card key={template.id} className="flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Used {template.usageCount} times
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">
                    {template.description}
                  </p>
                  
                  {(template.defaultTarget || template.defaultTargetAmount) && template.category === 'FINANCIAL' && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Target: ₹{(template.defaultTarget || template.defaultTargetAmount || 0).toLocaleString()}
                    </div>
                  )}
                  
                  {(template.defaultDuration || template.defaultDurationMonths) && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Duration: {template.defaultDuration 
                        ? `${template.defaultDuration} days` 
                        : `${template.defaultDurationMonths} months`}
                    </div>
                  )}
                  
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => useTemplate(template)}
                  >
                    {copiedId === template.id ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-green-500" />
                        Created!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Use Template
                      </>
                    )}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}

        {/* Info Card */}
        <Card className="bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
          <h3 className="font-semibold text-primary-900 dark:text-primary-300 mb-2 flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            How Templates Work
          </h3>
          <ul className="text-sm text-primary-800 dark:text-primary-400 space-y-1">
            <li>• Choose a template that matches your goal</li>
            <li>• Click "Use Template" to create a goal with pre-filled values</li>
            <li>• Customize the goal to fit your specific needs</li>
            <li>• Track your progress on the respective goals page</li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  );
}
