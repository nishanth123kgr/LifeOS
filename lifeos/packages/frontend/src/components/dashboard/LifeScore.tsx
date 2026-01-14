'use client';

import { cn } from '@/lib/utils';
import { Wallet, Dumbbell, CheckSquare, Settings2 } from 'lucide-react';

interface LifeScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function LifeScoreCircle({ score, size = 'md', showLabel = true }: LifeScoreProps) {
  const sizes = {
    sm: { container: 'w-24 h-24', text: 'text-2xl', label: 'text-xs' },
    md: { container: 'w-40 h-40', text: 'text-4xl', label: 'text-sm' },
    lg: { container: 'w-56 h-56', text: 'text-6xl', label: 'text-base' },
  };

  const getColor = (value: number) => {
    if (value >= 75) return { stroke: '#22c55e', bg: 'bg-success-50' };
    if (value >= 50) return { stroke: '#f59e0b', bg: 'bg-warning-50' };
    return { stroke: '#ef4444', bg: 'bg-danger-50' };
  };

  const color = getColor(score);
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  // Use CSS variable for dark mode track color
  const trackColor = 'rgba(75, 85, 99, 0.3)'; // gray-600 with opacity for dark mode

  return (
    <div className={cn('relative', sizes[size].container)}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          className="stroke-gray-200 dark:stroke-gray-700"
          strokeWidth="5"
        />
        {score > 0 && (
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-bold text-gray-900 dark:text-white', sizes[size].text)}>{score}</span>
        {showLabel && (
          <span className={cn('text-gray-500 dark:text-gray-400', sizes[size].label)}>Life Score</span>
        )}
      </div>
    </div>
  );
}

interface ScoreBreakdownProps {
  scores: {
    finance: number;
    fitness: number;
    habits: number;
    systems: number;
  };
  weights: {
    finance: number;
    fitness: number;
    habits: number;
    systems: number;
  };
}

export function ScoreBreakdown({ scores, weights }: ScoreBreakdownProps) {
  const categories = [
    { key: 'finance', label: 'Finance', icon: Wallet, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20' },
    { key: 'fitness', label: 'Fitness', icon: Dumbbell, color: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/20' },
    { key: 'habits', label: 'Habits', icon: CheckSquare, color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20' },
    { key: 'systems', label: 'Systems', icon: Settings2, color: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/20' },
  ] as const;

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const Icon = category.icon;
        return (
          <div key={category.key} className="flex items-center gap-4">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', category.color)}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {category.label}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {scores[category.key]}% ({(weights[category.key] * 100).toFixed(0)}% weight)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    scores[category.key] >= 75 ? 'bg-success-500' :
                    scores[category.key] >= 50 ? 'bg-warning-500' : 'bg-danger-500'
                  )}
                  style={{ width: `${scores[category.key]}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
