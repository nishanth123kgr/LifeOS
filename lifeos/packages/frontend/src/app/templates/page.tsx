'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Star,
  Target,
  Dumbbell,
  CheckSquare,
  Check,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Zap,
  Clock,
  Users,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

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

const categoryConfig: Record<string, {
  icon: any;
  label: string;
  color: string;
  bg: string;
  border: string;
  gradient: string;
  lightBg: string;
}> = {
  FINANCIAL: {
    icon: Target,
    label: 'Financial',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500',
    border: 'border-emerald-200 dark:border-emerald-500/30',
    gradient: 'from-emerald-500 to-teal-500',
    lightBg: 'bg-emerald-50 dark:bg-emerald-500/10',
  },
  FITNESS: {
    icon: Dumbbell,
    label: 'Fitness',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500',
    border: 'border-blue-200 dark:border-blue-500/30',
    gradient: 'from-blue-500 to-cyan-500',
    lightBg: 'bg-blue-50 dark:bg-blue-500/10',
  },
  HABIT: {
    icon: CheckSquare,
    label: 'Habits',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-500',
    border: 'border-orange-200 dark:border-orange-500/30',
    gradient: 'from-orange-500 to-amber-500',
    lightBg: 'bg-orange-50 dark:bg-orange-500/10',
  },
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
      const allTemplates = [
        ...(data.predefined || []).map((t: GoalTemplate, idx: number) => ({
          ...t,
          id: t.id || `predefined-${idx}`,
          usageCount: t.usageCount || 0,
          isPublic: true,
        })),
        ...(data.custom || []),
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
      await api.post(`/templates/${template.id}/use`);
      setCopiedId(template.id || null);
      toast.success(`Created goal from "${template.name}" template!`);

      const category = template.category.toUpperCase();
      if (category === 'FINANCIAL') {
        queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      } else if (category === 'FITNESS') {
        queryClient.invalidateQueries({ queryKey: ['fitness-goals'] });
      } else if (category === 'HABIT') {
        queryClient.invalidateQueries({ queryKey: ['habits'] });
      }
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

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
    ? templates.filter((t) => t.category === selectedCategory)
    : templates;

  // Count templates by category
  const templateCounts = categories.reduce((acc, cat) => {
    acc[cat] = templates.filter((t) => t.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  // Total usage across all templates
  const totalUsage = templates.reduce((sum, t) => sum + (t.usageCount || 0), 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute right-20 bottom-0 w-24 h-24 bg-white/5 rounded-full blur-xl" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Goal Templates</h1>
            </div>
            <p className="text-white/80 max-w-lg text-lg">
              Quick-start your journey with expertly crafted templates. Choose a template and customize it to fit your goals.
            </p>

            <div className="flex items-center gap-6 mt-6">
              <div className="flex items-center gap-2 text-white/90">
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">{templates.length} Templates</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <Users className="w-5 h-5" />
                <span className="font-medium">{totalUsage.toLocaleString()} Uses</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const config = categoryConfig[cat];
            const Icon = config.icon;
            const count = templateCounts[cat] || 0;
            const isActive = selectedCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(isActive ? null : cat)}
                className={cn(
                  'relative overflow-hidden rounded-xl p-5 text-left transition-all duration-200 border-2',
                  isActive
                    ? `${config.lightBg} ${config.border} shadow-lg scale-[1.02]`
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                )}
              >
                <div className={cn(
                  'absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-30',
                  `bg-gradient-to-bl ${config.gradient}`
                )} />
                
                <div className="relative flex items-center gap-4">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    config.lightBg
                  )}>
                    <Icon className={cn('w-6 h-6', config.color)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                    <p className={cn(
                      'text-sm font-medium',
                      isActive ? config.color : 'text-gray-500 dark:text-gray-400'
                    )}>
                      {config.label} Templates
                    </p>
                  </div>
                </div>

                {isActive && (
                  <div className={cn('absolute bottom-2 right-3 w-2 h-2 rounded-full', config.bg)} />
                )}
              </button>
            );
          })}
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredTemplates.length} of {templates.length} templates
            </span>
          </div>
          {selectedCategory && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              Clear Filter
            </Button>
          )}
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <Card className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No templates found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              {selectedCategory
                ? `No ${categoryConfig[selectedCategory]?.label.toLowerCase()} templates available yet.`
                : 'No templates available yet.'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTemplates.map((template) => {
              const config = categoryConfig[template.category] || {
                icon: Star,
                label: 'Other',
                color: 'text-gray-600 dark:text-gray-400',
                bg: 'bg-gray-500',
                border: 'border-gray-200 dark:border-gray-700',
                gradient: 'from-gray-500 to-gray-600',
                lightBg: 'bg-gray-50 dark:bg-gray-800',
              };
              const Icon = config.icon;
              const isCopied = copiedId === template.id;

              return (
                <Card
                  key={template.id}
                  className={cn(
                    'group flex flex-col relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
                    config.border
                  )}
                >
                  {/* Top gradient accent */}
                  <div className={cn(
                    'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r',
                    config.gradient
                  )} />

                  <div className="flex items-start justify-between mb-4 pt-2">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
                      config.lightBg
                    )}>
                      <Icon className={cn('w-6 h-6', config.color)} />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{template.usageCount || 0} uses</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {template.name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow line-clamp-2">
                    {template.description}
                  </p>

                  {/* Template details */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(template.defaultTarget || template.defaultTargetAmount) && template.category === 'FINANCIAL' && (
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                        config.lightBg, config.color
                      )}>
                        <Target className="w-3 h-3" />
                        ₹{(template.defaultTarget || template.defaultTargetAmount || 0).toLocaleString()}
                      </span>
                    )}
                    
                    {(template.defaultDuration || template.defaultDurationMonths) && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        <Clock className="w-3 h-3" />
                        {template.defaultDuration
                          ? `${template.defaultDuration} days`
                          : `${template.defaultDurationMonths} months`}
                      </span>
                    )}

                    <span className={cn(
                      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                      config.lightBg, config.color
                    )}>
                      {config.label}
                    </span>
                  </div>

                  <Button
                    variant={isCopied ? 'primary' : 'secondary'}
                    className={cn(
                      'w-full group/btn',
                      isCopied && 'bg-green-500 hover:bg-green-600 border-green-500'
                    )}
                    onClick={() => useTemplate(template)}
                    disabled={isCopied}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Goal Created!
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2 group-hover/btn:text-yellow-500 transition-colors" />
                        Use Template
                        <ArrowRight className="w-4 h-4 ml-2 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all" />
                      </>
                    )}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}

        {/* How it Works Card */}
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-500/30">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-xl shrink-0">
              <Lightbulb className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-3 text-lg">
                How Templates Work
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { step: '1', text: 'Browse templates that match your goals' },
                  { step: '2', text: 'Click "Use Template" to create your goal' },
                  { step: '3', text: 'Customize values to fit your needs' },
                  { step: '4', text: 'Track progress on your goals page' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{item.step}</span>
                    </div>
                    <p className="text-sm text-amber-800 dark:text-amber-400">{item.text}</p>
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
