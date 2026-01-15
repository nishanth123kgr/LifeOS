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
  Dumbbell, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Target,
  Sparkles,
  CheckCircle2,
  Clock,
  Zap,
  Scale,
  Percent,
  Footprints,
  Route,
  Heart,
  Activity,
  Flame,
  Medal
} from 'lucide-react';
import Link from 'next/link';

const goalSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  metricType: z.string(),
  unit: z.string().min(1, 'Unit is required'),
  startValue: z.number(),
  currentValue: z.number(),
  targetValue: z.number(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
});

type GoalForm = z.infer<typeof goalSchema>;

const metricTypes = [
  { value: 'WEIGHT', label: 'Weight', icon: Scale, color: 'from-blue-500 to-cyan-500', bgLight: 'bg-blue-50', bgDark: 'dark:bg-blue-900/20', iconColor: 'text-blue-600', defaultUnit: 'kg' },
  { value: 'BODY_FAT', label: 'Body Fat', icon: Percent, color: 'from-purple-500 to-pink-500', bgLight: 'bg-purple-50', bgDark: 'dark:bg-purple-900/20', iconColor: 'text-purple-600', defaultUnit: '%' },
  { value: 'MUSCLE_MASS', label: 'Muscle', icon: Dumbbell, color: 'from-red-500 to-orange-500', bgLight: 'bg-red-50', bgDark: 'dark:bg-red-900/20', iconColor: 'text-red-600', defaultUnit: 'kg' },
  { value: 'STEPS', label: 'Steps', icon: Footprints, color: 'from-green-500 to-emerald-500', bgLight: 'bg-green-50', bgDark: 'dark:bg-green-900/20', iconColor: 'text-green-600', defaultUnit: 'steps' },
  { value: 'DISTANCE', label: 'Distance', icon: Route, color: 'from-amber-500 to-yellow-500', bgLight: 'bg-amber-50', bgDark: 'dark:bg-amber-900/20', iconColor: 'text-amber-600', defaultUnit: 'km' },
  { value: 'STRENGTH', label: 'Strength', icon: Zap, color: 'from-indigo-500 to-purple-500', bgLight: 'bg-indigo-50', bgDark: 'dark:bg-indigo-900/20', iconColor: 'text-indigo-600', defaultUnit: 'kg' },
  { value: 'ENDURANCE', label: 'Endurance', icon: Heart, color: 'from-rose-500 to-red-500', bgLight: 'bg-rose-50', bgDark: 'dark:bg-rose-900/20', iconColor: 'text-rose-600', defaultUnit: 'min' },
  { value: 'OTHER', label: 'Other', icon: Activity, color: 'from-gray-500 to-slate-500', bgLight: 'bg-gray-50', bgDark: 'dark:bg-gray-800/50', iconColor: 'text-gray-600', defaultUnit: '' },
];

export default function NewFitnessGoalPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  const today = new Date().toISOString().split('T')[0];
  const threeMonthsLater = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<GoalForm>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: '',
      metricType: 'WEIGHT',
      unit: 'kg',
      startValue: 0,
      currentValue: 0,
      targetValue: 0,
      startDate: today,
      targetDate: threeMonthsLater,
    },
  });

  // Watch form values for live preview
  const watchedValues = useWatch({ control });
  const metricType = watchedValues.metricType || 'WEIGHT';
  const goalName = watchedValues.name || '';
  const unit = watchedValues.unit || '';
  const startValue = watchedValues.startValue || 0;
  const currentValue = watchedValues.currentValue || 0;
  const targetValue = watchedValues.targetValue || 0;
  const targetDate = watchedValues.targetDate;

  // Calculate progress
  const totalChange = Math.abs(targetValue - startValue);
  const currentChange = Math.abs(currentValue - startValue);
  const progress = totalChange > 0 ? Math.min((currentChange / totalChange) * 100, 100) : 0;
  const remaining = Math.abs(targetValue - currentValue);
  const isIncreasing = targetValue > startValue;

  // Calculate days remaining
  const targetDateObj = targetDate ? new Date(targetDate) : null;
  const daysRemaining = targetDateObj 
    ? Math.ceil((targetDateObj.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : 0;

  const selectedType = metricTypes.find(t => t.value === metricType) || metricTypes[0];

  const createMutation = useMutation({
    mutationFn: (data: GoalForm) => api.post('/fitness-goals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fitness-goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Fitness goal created successfully!');
      router.push('/goals/fitness');
    },
    onError: () => toast.error('Failed to create goal'),
  });

  const onSubmit = (data: GoalForm) => {
    createMutation.mutate(data);
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const canProceed = () => {
    if (step === 1) return metricType && goalName.length > 0 && unit.length > 0;
    if (step === 2) return targetValue !== 0;
    return true;
  };

  const handleMetricTypeChange = (value: string) => {
    setValue('metricType', value);
    const type = metricTypes.find(t => t.value === value);
    if (type?.defaultUnit) {
      setValue('unit', type.defaultUnit);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/goals/fitness"
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Fitness Goal</h1>
              <p className="text-gray-500 dark:text-gray-400">Step {step} of 3</p>
            </div>
          </div>
          
          {/* Progress Indicator */}
          <div className="hidden sm:flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "flex items-center",
                  s < 3 && "gap-2"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                    step >= s
                      ? "bg-orange-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                  )}
                >
                  {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={cn(
                      "w-12 h-1 rounded-full transition-all",
                      step > s ? "bg-orange-500" : "bg-gray-200 dark:bg-gray-700"
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
              {/* Step 1: Metric Type & Name */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      What do you want to track?
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      Choose a metric that aligns with your fitness journey
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      {metricTypes.map((type) => {
                        const Icon = type.icon;
                        const isSelected = metricType === type.value;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => handleMetricTypeChange(type.value)}
                            className={cn(
                              "relative p-4 rounded-xl border-2 transition-all duration-200 text-center group",
                              isSelected
                                ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                            )}
                          >
                            <div className={cn(
                              "w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center transition-all",
                              isSelected
                                ? `bg-gradient-to-br ${type.color} text-white`
                                : `${type.bgLight} ${type.bgDark}`
                            )}>
                              <Icon className={cn(
                                "w-6 h-6",
                                isSelected ? "text-white" : type.iconColor
                              )} />
                            </div>
                            <span className={cn(
                              "text-sm font-medium",
                              isSelected
                                ? "text-orange-700 dark:text-orange-300"
                                : "text-gray-700 dark:text-gray-300"
                            )}>
                              {type.label}
                            </span>
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="space-y-4">
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                          Give your goal a name
                        </span>
                        <input
                          type="text"
                          placeholder="e.g., Lose 10kg, Run a marathon, Build muscle..."
                          className={cn(
                            "w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all",
                            errors.name
                              ? "border-red-500 focus:border-red-500"
                              : "border-gray-200 dark:border-gray-700 focus:border-orange-500"
                          )}
                          {...register('name')}
                        />
                        {errors.name && (
                          <p className="mt-1.5 text-sm text-red-500">{errors.name.message}</p>
                        )}
                      </label>

                      <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                          Unit of measurement
                        </span>
                        <input
                          type="text"
                          placeholder="kg, %, steps, km, min..."
                          className={cn(
                            "w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all",
                            errors.unit
                              ? "border-red-500 focus:border-red-500"
                              : "border-gray-200 dark:border-gray-700 focus:border-orange-500"
                          )}
                          {...register('unit')}
                        />
                        {errors.unit && (
                          <p className="mt-1.5 text-sm text-red-500">{errors.unit.message}</p>
                        )}
                      </label>
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

              {/* Step 2: Values */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Set your targets
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      Where are you now and where do you want to be?
                    </p>

                    {/* Start Value */}
                    <div className="mb-6">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                        Starting point
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          className="w-full pr-16 pl-4 py-4 text-2xl font-bold rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-orange-500 transition-all"
                          {...register('startValue', { valueAsNumber: true })}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">{unit}</span>
                      </div>
                    </div>

                    {/* Current Value */}
                    <div className="mb-6">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                        Current value
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          className="w-full pr-16 pl-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-orange-500 transition-all"
                          {...register('currentValue', { valueAsNumber: true })}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">{unit}</span>
                      </div>
                    </div>

                    {/* Target Value */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                        Target value
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          className="w-full pr-16 pl-4 py-4 text-2xl font-bold rounded-xl border-2 border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 text-gray-900 dark:text-white focus:border-orange-500 transition-all"
                          {...register('targetValue', { valueAsNumber: true })}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-600 text-lg">{unit}</span>
                      </div>
                      {targetValue !== 0 && (
                        <p className="mt-2 text-sm text-orange-600 dark:text-orange-400">
                          {isIncreasing ? '📈' : '📉'} {isIncreasing ? 'Increase' : 'Decrease'} of {Math.abs(targetValue - startValue).toFixed(1)} {unit}
                        </p>
                      )}
                    </div>
                  </Card>

                  <div className="flex justify-between">
                    <Button type="button" variant="secondary" onClick={prevStep}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button type="button" onClick={nextStep} disabled={!canProceed()} className="px-8">
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Timeline */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Set your timeline
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      When do you want to achieve this goal?
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                          Start Date
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-orange-500 transition-all"
                          {...register('startDate')}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                          Target Date
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-orange-500 transition-all"
                          {...register('targetDate')}
                        />
                      </div>
                    </div>

                    {/* Quick Timeline Options */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {[
                        { label: '1 month', days: 30 },
                        { label: '3 months', days: 90 },
                        { label: '6 months', days: 180 },
                        { label: '1 year', days: 365 },
                      ].map((option) => (
                        <button
                          key={option.days}
                          type="button"
                          onClick={() => {
                            const date = new Date();
                            date.setDate(date.getDate() + option.days);
                            setValue('targetDate', date.toISOString().split('T')[0]);
                          }}
                          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-700 dark:hover:text-orange-300 transition-all"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    {/* Motivation Section */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                          <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="font-medium text-orange-800 dark:text-orange-200">Stay Motivated! 🔥</p>
                          <p className="text-sm text-orange-700 dark:text-orange-300">
                            Break down big goals into smaller milestones. Celebrate every win!
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <div className="flex justify-between">
                    <Button type="button" variant="secondary" onClick={prevStep}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button type="submit" isLoading={createMutation.isPending} className="px-8">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create Goal
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
                selectedType.color
              )}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    {(() => {
                      const Icon = selectedType.icon;
                      return <Icon className="w-6 h-6" />;
                    })()}
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">{selectedType.label}</p>
                    <h3 className="text-xl font-bold">
                      {goalName || 'Your Goal'}
                    </h3>
                  </div>
                </div>
                
                {/* Target Display */}
                <div className="text-center py-6">
                  <p className="text-white/60 text-sm mb-1">Target</p>
                  <p className="text-4xl font-bold">
                    {targetValue} <span className="text-2xl">{unit}</span>
                  </p>
                </div>
              </div>

              <div className="px-2 pb-6 pt-6 space-y-6">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500 dark:text-gray-400">Progress</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500 bg-gradient-to-r", selectedType.color)}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Current</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {currentValue} {unit}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      {isIncreasing ? (
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">Remaining</span>
                    </div>
                    <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {remaining.toFixed(1)} {unit}
                    </p>
                  </div>
                </div>

                {/* Timeline Info */}
                {daysRemaining > 0 && (
                  <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Days remaining</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {daysRemaining} days
                      </span>
                    </div>
                    {targetDateObj && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Target date</span>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {targetDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Tips Card */}
            <Card className="p-5 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200/50 dark:border-orange-800/50">
              <div className="flex gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg h-fit">
                  <Medal className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h4 className="font-medium text-orange-800 dark:text-orange-300 mb-2">Pro Tips</h4>
                  <ul className="text-sm text-orange-700 dark:text-orange-400 space-y-1">
                    <li>• Track progress consistently</li>
                    <li>• Set realistic timelines</li>
                    <li>• Celebrate small wins</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
