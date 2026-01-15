'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import {
  ArrowLeft,
  ArrowRight,
  Repeat,
  Sparkles,
  CheckCircle2,
  Calendar,
  Target,
  Zap,
  Heart,
  BookOpen,
  Dumbbell,
  Coffee,
  Moon,
  Sun,
  Brain,
  Leaf,
  Music,
  Palette,
} from 'lucide-react';
import Link from 'next/link';

const habitSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  frequency: z.string(),
  targetCount: z.number().min(1).optional(),
});

type HabitForm = z.infer<typeof habitSchema>;

const habitCategories = [
  { value: 'fitness', label: 'Fitness', icon: Dumbbell, color: 'from-red-500 to-orange-500', bgLight: 'bg-red-50', bgDark: 'dark:bg-red-900/20', iconColor: 'text-red-600' },
  { value: 'health', label: 'Health', icon: Heart, color: 'from-pink-500 to-rose-500', bgLight: 'bg-pink-50', bgDark: 'dark:bg-pink-900/20', iconColor: 'text-pink-600' },
  { value: 'learning', label: 'Learning', icon: BookOpen, color: 'from-blue-500 to-cyan-500', bgLight: 'bg-blue-50', bgDark: 'dark:bg-blue-900/20', iconColor: 'text-blue-600' },
  { value: 'mindfulness', label: 'Mindfulness', icon: Brain, color: 'from-purple-500 to-indigo-500', bgLight: 'bg-purple-50', bgDark: 'dark:bg-purple-900/20', iconColor: 'text-purple-600' },
  { value: 'morning', label: 'Morning', icon: Sun, color: 'from-amber-500 to-yellow-500', bgLight: 'bg-amber-50', bgDark: 'dark:bg-amber-900/20', iconColor: 'text-amber-600' },
  { value: 'evening', label: 'Evening', icon: Moon, color: 'from-indigo-500 to-purple-500', bgLight: 'bg-indigo-50', bgDark: 'dark:bg-indigo-900/20', iconColor: 'text-indigo-600' },
  { value: 'nutrition', label: 'Nutrition', icon: Coffee, color: 'from-emerald-500 to-teal-500', bgLight: 'bg-emerald-50', bgDark: 'dark:bg-emerald-900/20', iconColor: 'text-emerald-600' },
  { value: 'creativity', label: 'Creativity', icon: Palette, color: 'from-fuchsia-500 to-pink-500', bgLight: 'bg-fuchsia-50', bgDark: 'dark:bg-fuchsia-900/20', iconColor: 'text-fuchsia-600' },
];

const frequencies = [
  { value: 'DAILY', label: 'Daily', description: 'Every day', icon: Calendar },
  { value: 'WEEKLY', label: 'Weekly', description: 'Once a week', icon: Calendar },
  { value: 'WEEKDAYS', label: 'Weekdays', description: 'Monday to Friday', icon: Calendar },
  { value: 'WEEKENDS', label: 'Weekends', description: 'Saturday & Sunday', icon: Calendar },
];

const habitPresets = [
  { name: 'Morning Workout', category: 'fitness', frequency: 'DAILY', targetCount: 1 },
  { name: 'Read for 30 minutes', category: 'learning', frequency: 'DAILY', targetCount: 1 },
  { name: 'Meditate', category: 'mindfulness', frequency: 'DAILY', targetCount: 1 },
  { name: 'Drink 8 glasses of water', category: 'health', frequency: 'DAILY', targetCount: 8 },
  { name: 'Take vitamins', category: 'nutrition', frequency: 'DAILY', targetCount: 1 },
  { name: 'Journal before bed', category: 'evening', frequency: 'DAILY', targetCount: 1 },
];

export default function NewHabitPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('fitness');

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<HabitForm>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      name: '',
      description: '',
      frequency: 'DAILY',
      targetCount: 1,
    },
  });

  const watchedValues = useWatch({ control });
  const habitName = watchedValues.name || '';
  const frequency = watchedValues.frequency || 'DAILY';
  const targetCount = watchedValues.targetCount || 1;
  const description = watchedValues.description || '';

  const selectedCategoryData = habitCategories.find(c => c.value === selectedCategory) || habitCategories[0];
  const selectedFrequency = frequencies.find(f => f.value === frequency) || frequencies[0];

  const createMutation = useMutation({
    mutationFn: (data: HabitForm) => api.post('/habits', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Habit created successfully!');
      router.push('/habits');
    },
    onError: () => toast.error('Failed to create habit'),
  });

  const onSubmit = (data: HabitForm) => {
    createMutation.mutate(data);
  };

  const nextStep = () => {
    if (step < 2) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const canProceed = () => {
    if (step === 1) return habitName.length > 0;
    return true;
  };

  const applyPreset = (preset: typeof habitPresets[0]) => {
    setValue('name', preset.name);
    setValue('frequency', preset.frequency);
    setValue('targetCount', preset.targetCount);
    setSelectedCategory(preset.category);
  };

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/habits"
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Habit</h1>
              <p className="text-gray-500 dark:text-gray-400">Step {step} of 2</p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="hidden sm:flex items-center gap-2">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={cn(
                  "flex items-center",
                  s < 2 && "gap-2"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                    step >= s
                      ? "bg-purple-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                  )}
                >
                  {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
                {s < 2 && (
                  <div
                    className={cn(
                      "w-12 h-1 rounded-full transition-all",
                      step > s ? "bg-purple-500" : "bg-gray-200 dark:bg-gray-700"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Form Steps */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Step 1: Habit Details */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* Category Selection */}
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Choose a category
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      This helps organize your habits
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      {habitCategories.map((category) => {
                        const Icon = category.icon;
                        const isSelected = selectedCategory === category.value;
                        return (
                          <button
                            key={category.value}
                            type="button"
                            onClick={() => setSelectedCategory(category.value)}
                            className={cn(
                              "relative p-4 rounded-xl border-2 transition-all duration-200 text-center group",
                              isSelected
                                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                            )}
                          >
                            <div className={cn(
                              "w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center transition-all",
                              isSelected
                                ? `bg-gradient-to-br ${category.color} text-white`
                                : `${category.bgLight} ${category.bgDark}`
                            )}>
                              <Icon className={cn(
                                "w-6 h-6",
                                isSelected ? "text-white" : category.iconColor
                              )} />
                            </div>
                            <span className={cn(
                              "text-sm font-medium",
                              isSelected
                                ? "text-purple-700 dark:text-purple-300"
                                : "text-gray-700 dark:text-gray-300"
                            )}>
                              {category.label}
                            </span>
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Habit Name */}
                    <div className="space-y-4">
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                          Habit name
                        </span>
                        <input
                          type="text"
                          placeholder="e.g., Morning Workout, Read 30 mins..."
                          className={cn(
                            "w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all",
                            errors.name
                              ? "border-red-500 focus:border-red-500"
                              : "border-gray-200 dark:border-gray-700 focus:border-purple-500"
                          )}
                          {...register('name')}
                        />
                        {errors.name && (
                          <p className="mt-1.5 text-sm text-red-500">{errors.name.message}</p>
                        )}
                      </label>

                      <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                          Description (optional)
                        </span>
                        <textarea
                          placeholder="Add more details about your habit..."
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-purple-500 transition-all resize-none"
                          {...register('description')}
                        />
                      </label>
                    </div>
                  </Card>

                  {/* Quick Presets */}
                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="w-5 h-5 text-amber-500" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">Quick Start</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {habitPresets.map((preset, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => applyPreset(preset)}
                          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300 transition-all"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </Card>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={!canProceed()}
                      className="px-8"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Schedule */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Set your schedule
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      How often will you do this habit?
                    </p>

                    {/* Frequency Selection */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {frequencies.map((freq) => {
                        const isSelected = frequency === freq.value;
                        return (
                          <button
                            key={freq.value}
                            type="button"
                            onClick={() => setValue('frequency', freq.value)}
                            className={cn(
                              "p-4 rounded-xl border-2 transition-all duration-200 text-left",
                              isSelected
                                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                isSelected
                                  ? "bg-purple-500 text-white"
                                  : "bg-gray-100 dark:bg-gray-800"
                              )}>
                                <Calendar className={cn(
                                  "w-5 h-5",
                                  isSelected ? "text-white" : "text-gray-500"
                                )} />
                              </div>
                              <div>
                                <p className={cn(
                                  "font-semibold",
                                  isSelected
                                    ? "text-purple-700 dark:text-purple-300"
                                    : "text-gray-900 dark:text-white"
                                )}>
                                  {freq.label}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {freq.description}
                                </p>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Target Count */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                        Times per {frequency === 'DAILY' ? 'day' : frequency === 'WEEKLY' ? 'week' : 'period'}
                      </label>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => setValue('targetCount', Math.max(1, targetCount - 1))}
                          className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-xl font-bold text-gray-600 dark:text-gray-400 transition-all"
                        >
                          -
                        </button>
                        <div className="flex-1 relative">
                          <input
                            type="number"
                            min="1"
                            className="w-full text-center text-3xl font-bold py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-purple-500 transition-all"
                            {...register('targetCount', { valueAsNumber: true })}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                            times
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setValue('targetCount', targetCount + 1)}
                          className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-xl font-bold text-gray-600 dark:text-gray-400 transition-all"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </Card>

                  {/* Tips */}
                  <Card className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200/50 dark:border-amber-800/50">
                    <div className="flex gap-3">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg h-fit">
                        <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-2">Tips for Success</h4>
                        <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
                          <li>• Start small and build up gradually</li>
                          <li>• Link new habits to existing routines</li>
                          <li>• Track your streaks for motivation</li>
                        </ul>
                      </div>
                    </div>
                  </Card>

                  <div className="flex justify-between">
                    <Button type="button" variant="secondary" onClick={prevStep}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button type="submit" isLoading={createMutation.isPending} className="px-8">
                      <Repeat className="w-4 h-4 mr-2" />
                      Create Habit
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Right Side - Live Preview */}
          <div className="lg:sticky lg:top-6 space-y-6 h-fit">
            {/* Main Preview Card */}
            <Card className="rounded-2xl pt-4 px-4">
              {/* Gradient Header */}
              <div className={cn(
                "bg-gradient-to-br p-6 text-white rounded-2xl",
                selectedCategoryData.color
              )}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    {(() => {
                      const Icon = selectedCategoryData.icon;
                      return <Icon className="w-6 h-6" />;
                    })()}
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">{selectedCategoryData.label}</p>
                    <h3 className="text-xl font-bold">
                      {habitName || 'Your Habit'}
                    </h3>
                  </div>
                </div>

                {/* Target Display */}
                <div className="text-center py-6">
                  <p className="text-white/60 text-sm mb-1">Daily Target</p>
                  <p className="text-4xl font-bold">
                    {targetCount} <span className="text-2xl">times</span>
                  </p>
                </div>
              </div>

              <div className="px-2 pb-6 pt-6 space-y-6">
                {/* Description */}
                {description && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
                  </div>
                )}

                {/* Schedule Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Frequency</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedFrequency.label}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Target</span>
                    </div>
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {targetCount}x
                    </p>
                  </div>
                </div>

                {/* Streak Preview */}
                <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Current Streak</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      0 days
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Repeat className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Best Streak</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      0 days
                    </span>
                  </div>
                </div>

                {/* Weekly Preview */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">This Week</p>
                  <div className="flex justify-between">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <span className="text-xs text-gray-400">{day}</span>
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          i < 3 ? "bg-gray-200 dark:bg-gray-700" : "bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600"
                        )}>
                          {i < 3 && <span className="text-gray-400 text-xs">-</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
