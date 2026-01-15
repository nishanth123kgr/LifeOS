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
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency, cn } from '@/lib/utils';
import api from '@/lib/api';
import { 
  ArrowLeft, 
  ArrowRight,
  Target, 
  TrendingUp, 
  Calendar,
  Wallet,
  PiggyBank,
  Sparkles,
  CheckCircle2,
  Clock,
  Zap,
  Home,
  GraduationCap,
  Plane,
  Car,
  Shield,
  Briefcase,
  Heart,
  Gift
} from 'lucide-react';
import Link from 'next/link';

const goalSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string(),
  targetAmount: z.number().min(1, 'Target amount is required'),
  currentAmount: z.number().min(0).optional(),
  monthlyContribution: z.number().min(0).optional(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
});

type GoalForm = z.infer<typeof goalSchema>;

const goalTypes = [
  { value: 'EMERGENCY_FUND', label: 'Emergency Fund', icon: Shield, color: 'from-amber-500 to-orange-500', bgLight: 'bg-amber-50', bgDark: 'dark:bg-amber-900/20', iconColor: 'text-amber-600' },
  { value: 'HOME_DOWN_PAYMENT', label: 'Home', icon: Home, color: 'from-blue-500 to-cyan-500', bgLight: 'bg-blue-50', bgDark: 'dark:bg-blue-900/20', iconColor: 'text-blue-600' },
  { value: 'RETIREMENT', label: 'Retirement', icon: Briefcase, color: 'from-purple-500 to-indigo-500', bgLight: 'bg-purple-50', bgDark: 'dark:bg-purple-900/20', iconColor: 'text-purple-600' },
  { value: 'EDUCATION', label: 'Education', icon: GraduationCap, color: 'from-emerald-500 to-teal-500', bgLight: 'bg-emerald-50', bgDark: 'dark:bg-emerald-900/20', iconColor: 'text-emerald-600' },
  { value: 'VACATION', label: 'Vacation', icon: Plane, color: 'from-pink-500 to-rose-500', bgLight: 'bg-pink-50', bgDark: 'dark:bg-pink-900/20', iconColor: 'text-pink-600' },
  { value: 'CAR_FUND', label: 'Car', icon: Car, color: 'from-slate-500 to-gray-600', bgLight: 'bg-slate-50', bgDark: 'dark:bg-slate-900/20', iconColor: 'text-slate-600' },
  { value: 'MARRIAGE_FUND', label: 'Wedding', icon: Heart, color: 'from-red-400 to-pink-500', bgLight: 'bg-red-50', bgDark: 'dark:bg-red-900/20', iconColor: 'text-red-500' },
  { value: 'CUSTOM', label: 'Other', icon: Gift, color: 'from-gray-500 to-gray-600', bgLight: 'bg-gray-50', bgDark: 'dark:bg-gray-800/50', iconColor: 'text-gray-600' },
];

const suggestedAmounts = [
  { label: '₹50K', value: 50000 },
  { label: '₹1L', value: 100000 },
  { label: '₹5L', value: 500000 },
  { label: '₹10L', value: 1000000 },
  { label: '₹25L', value: 2500000 },
  { label: '₹50L', value: 5000000 },
];

export default function NewFinancialGoalPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const currency = user?.currency || 'INR';
  const [step, setStep] = useState(1);

  const today = new Date().toISOString().split('T')[0];
  const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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
      type: 'EMERGENCY_FUND',
      targetAmount: 100000,
      currentAmount: 0,
      monthlyContribution: 5000,
      startDate: today,
      targetDate: oneYearLater,
    },
  });

  // Watch form values for live preview
  const watchedValues = useWatch({ control });
  const targetAmount = watchedValues.targetAmount || 0;
  const currentAmount = watchedValues.currentAmount || 0;
  const monthlyContribution = watchedValues.monthlyContribution || 0;
  const goalName = watchedValues.name || '';
  const goalType = watchedValues.type || 'EMERGENCY_FUND';
  const targetDate = watchedValues.targetDate;

  // Calculate progress and projections
  const progress = targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;
  const remaining = Math.max(targetAmount - currentAmount, 0);
  const monthsToGoal = monthlyContribution > 0 ? Math.ceil(remaining / monthlyContribution) : 0;
  const projectedDate = monthlyContribution > 0 
    ? new Date(Date.now() + monthsToGoal * 30 * 24 * 60 * 60 * 1000)
    : null;

  // Check if goal is achievable by target date
  const targetDateObj = targetDate ? new Date(targetDate) : null;
  const monthsUntilTarget = targetDateObj 
    ? Math.ceil((targetDateObj.getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000))
    : 0;
  const requiredMonthly = monthsUntilTarget > 0 ? Math.ceil(remaining / monthsUntilTarget) : 0;
  const isOnTrack = monthlyContribution >= requiredMonthly;

  const selectedType = goalTypes.find(t => t.value === goalType) || goalTypes[0];

  const createMutation = useMutation({
    mutationFn: (data: GoalForm) => api.post('/financial-goals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Financial goal created successfully!');
      router.push('/goals/financial');
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
    if (step === 1) return goalType && goalName.length > 0;
    if (step === 2) return targetAmount > 0;
    return true;
  };

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/goals/financial"
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Financial Goal</h1>
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
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                  )}
                >
                  {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={cn(
                      "w-12 h-1 rounded-full transition-all",
                      step > s ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"
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
              {/* Step 1: Goal Type & Name */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      What are you saving for?
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      Choose a category that best describes your goal
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      {goalTypes.map((type) => {
                        const Icon = type.icon;
                        const isSelected = goalType === type.value;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setValue('type', type.value)}
                            className={cn(
                              "relative p-4 rounded-xl border-2 transition-all duration-200 text-center group",
                              isSelected
                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
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
                                ? "text-emerald-700 dark:text-emerald-300"
                                : "text-gray-700 dark:text-gray-300"
                            )}>
                              {type.label}
                            </span>
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
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
                          placeholder="e.g., Dream Home Fund, Emergency Savings..."
                          className={cn(
                            "w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all",
                            errors.name
                              ? "border-red-500 focus:border-red-500"
                              : "border-gray-200 dark:border-gray-700 focus:border-emerald-500"
                          )}
                          {...register('name')}
                        />
                        {errors.name && (
                          <p className="mt-1.5 text-sm text-red-500">{errors.name.message}</p>
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

              {/* Step 2: Amount */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      How much do you need?
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      Set your target amount and current savings
                    </p>

                    {/* Target Amount */}
                    <div className="mb-6">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                        Target Amount
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">₹</span>
                        <input
                          type="number"
                          className="w-full pl-10 pr-4 py-4 text-2xl font-bold rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-emerald-500 transition-all"
                          {...register('targetAmount', { valueAsNumber: true })}
                        />
                      </div>
                      
                      {/* Quick Amount Buttons */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {suggestedAmounts.map((amt) => (
                          <button
                            key={amt.value}
                            type="button"
                            onClick={() => setValue('targetAmount', amt.value)}
                            className={cn(
                              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                              targetAmount === amt.value
                                ? "bg-emerald-500 text-white"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                            )}
                          >
                            {amt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Current Amount */}
                    <div className="mb-6">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                        Already saved (optional)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-emerald-500 transition-all"
                          placeholder="0"
                          {...register('currentAmount', { valueAsNumber: true })}
                        />
                      </div>
                    </div>

                    {/* Monthly Contribution */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                        Monthly contribution
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-emerald-500 transition-all"
                          placeholder="5000"
                          {...register('monthlyContribution', { valueAsNumber: true })}
                        />
                      </div>
                      {monthlyContribution > 0 && (
                        <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
                          ✨ You'll save {formatCurrency(monthlyContribution * 12, currency)} per year
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

              {/* Step 3: Timeline & Review */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      When do you want to achieve this?
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      Set your timeline and we'll help you stay on track
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                          Start Date
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-emerald-500 transition-all"
                          {...register('startDate')}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                          Target Date
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-emerald-500 transition-all"
                          {...register('targetDate')}
                        />
                      </div>
                    </div>

                    {/* Quick Timeline Options */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {[
                        { label: '6 months', months: 6 },
                        { label: '1 year', months: 12 },
                        { label: '2 years', months: 24 },
                        { label: '5 years', months: 60 },
                      ].map((option) => (
                        <button
                          key={option.months}
                          type="button"
                          onClick={() => {
                            const date = new Date();
                            date.setMonth(date.getMonth() + option.months);
                            setValue('targetDate', date.toISOString().split('T')[0]);
                          }}
                          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    {/* Status Indicator */}
                    {monthlyContribution > 0 && targetDate && (
                      <div className={cn(
                        "p-4 rounded-xl flex items-start gap-3",
                        isOnTrack
                          ? "bg-emerald-50 dark:bg-emerald-900/20"
                          : "bg-amber-50 dark:bg-amber-900/20"
                      )}>
                        <div className={cn(
                          "p-2 rounded-lg",
                          isOnTrack ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-amber-100 dark:bg-amber-900/30"
                        )}>
                          {isOnTrack ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          )}
                        </div>
                        <div>
                          <p className={cn(
                            "font-medium",
                            isOnTrack
                              ? "text-emerald-800 dark:text-emerald-200"
                              : "text-amber-800 dark:text-amber-200"
                          )}>
                            {isOnTrack ? "You're on track! 🎉" : "Increase your contribution"}
                          </p>
                          <p className={cn(
                            "text-sm",
                            isOnTrack
                              ? "text-emerald-700 dark:text-emerald-300"
                              : "text-amber-700 dark:text-amber-300"
                          )}>
                            {isOnTrack
                              ? `At ${formatCurrency(monthlyContribution, currency)}/month, you'll reach your goal in ${monthsToGoal} months`
                              : `You need ${formatCurrency(requiredMonthly, currency)}/month to reach your goal by your target date`
                            }
                          </p>
                        </div>
                      </div>
                    )}
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
                
                {/* Large Target Display */}
                <div className="text-center py-6">
                  <p className="text-white/60 text-sm mb-1">Target Amount</p>
                  <p className="text-4xl font-bold">
                    {formatCurrency(targetAmount, currency)}
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
                      <Wallet className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Saved</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(currentAmount, currency)}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <PiggyBank className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Remaining</span>
                    </div>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(remaining, currency)}
                    </p>
                  </div>
                </div>

                {/* Timeline Info */}
                {monthlyContribution > 0 && (
                  <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Monthly</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(monthlyContribution, currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Time to goal</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {monthsToGoal} months
                      </span>
                    </div>
                    {projectedDate && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Expected</span>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {projectedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Tips Card */}
            <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50 dark:border-blue-800/50">
              <div className="flex gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg h-fit">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Quick Tips</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• Set up automatic monthly transfers</li>
                    <li>• Start with what you can afford</li>
                    <li>• Review your goals quarterly</li>
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
