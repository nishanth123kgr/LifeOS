'use client';

import { useState, useEffect } from 'react';
import { 
  Trophy, Lock, Star, Zap, Target, Dumbbell, CheckSquare, Settings2, Award,
  Flame, CheckCircle, ClipboardList, PiggyBank, Landmark, Gem, PartyPopper,
  BarChart3, Footprints, Medal, Settings, TrendingUp, Sparkles, Crown, Percent
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';

interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  unlocked: boolean;
  unlockedAt?: string;
}

// Map icon names to Lucide components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  target: Target,
  trophy: Trophy,
  flame: Flame,
  dumbbell: Dumbbell,
  award: Award,
  'check-circle': CheckCircle,
  'clipboard-list': ClipboardList,
  'piggy-bank': PiggyBank,
  landmark: Landmark,
  gem: Gem,
  'party-popper': PartyPopper,
  'bar-chart-3': BarChart3,
  footprints: Footprints,
  medal: Medal,
  settings: Settings,
  'trending-up': TrendingUp,
  star: Star,
  sparkles: Sparkles,
  crown: Crown,
};

const categoryIcons: Record<string, any> = {
  GENERAL: Star,
  FINANCE: Target,
  FITNESS: Dumbbell,
  HABITS: CheckSquare,
  SYSTEMS: Settings2,
};

const categoryColors: Record<string, string> = {
  GENERAL: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400',
  FINANCE: 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400',
  FITNESS: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
  HABITS: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400',
  SYSTEMS: 'bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400',
};

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [stats, setStats] = useState({ unlocked: 0, total: 0, points: 0 });

  useEffect(() => {
    checkAndFetchAchievements();
  }, []);

  const checkAndFetchAchievements = async () => {
    try {
      // First, trigger achievement check to unlock any new achievements
      await api.post('/achievements/check');
      
      // Then fetch all achievements with updated unlock status
      const response = await api.get('/achievements');
      const data = response.data.achievements || [];
      setAchievements(data);
      
      const unlocked = data.filter((a: Achievement) => a.unlocked);
      setStats({
        unlocked: unlocked.length,
        total: data.length,
        points: unlocked.reduce((sum: number, a: Achievement) => sum + a.points, 0),
      });
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['GENERAL', 'FINANCE', 'FITNESS', 'HABITS'];

  const filteredAchievements = selectedCategory
    ? achievements.filter(a => a.category === selectedCategory)
    : achievements;

  const groupedAchievements = categories.reduce((acc, cat) => {
    acc[cat] = filteredAchievements.filter(a => a.category === cat);
    return acc;
  }, {} as Record<string, Achievement[]>);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 p-8">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Achievements</h1>
            </div>
            <p className="text-white/80 max-w-md">
              Earn rewards and unlock badges for reaching your goals. Keep pushing forward!
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-bl-full" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Unlocked</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                <span className="text-yellow-600 dark:text-yellow-400">{stats.unlocked}</span>
                <span className="text-lg text-gray-400"> / {stats.total}</span>
              </p>
            </div>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-bl-full" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Points</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.points}</p>
            </div>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-bl-full" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Completion</span>
              </div>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.total > 0 ? Math.round((stats.unlocked / stats.total) * 100) : 0}%
              </p>
            </div>
          </Card>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedCategory === null
                ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg shadow-amber-500/25'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All
          </button>
          {categories.map(cat => {
            const Icon = categoryIcons[cat];
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg shadow-amber-500/25'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.charAt(0) + cat.slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>

        {/* Achievement Grid */}
        {categories.map(category => {
          const categoryAchievements = groupedAchievements[category];
          if (!categoryAchievements || categoryAchievements.length === 0) return null;

          const Icon = categoryIcons[category];
          const unlockedCount = categoryAchievements.filter(a => a.unlocked).length;

          return (
            <div key={category}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${categoryColors[category]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {category.charAt(0) + category.slice(1).toLowerCase()}
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {unlockedCount} / {categoryAchievements.length} unlocked
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryAchievements.map(achievement => (
                  <Card
                    key={achievement.id}
                    className={`relative overflow-hidden transition-all hover:shadow-lg group ${
                      achievement.unlocked
                        ? 'ring-2 ring-yellow-400/50 dark:ring-yellow-500/50'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {/* Unlocked glow effect */}
                    {achievement.unlocked && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400" />
                    )}

                    {/* Unlocked badge */}
                    {achievement.unlocked && (
                      <div className="absolute top-3 right-3">
                        <div className="p-1.5 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full shadow-lg shadow-amber-500/30">
                          <Star className="w-3 h-3 text-white" fill="white" />
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3 pt-1">
                      {/* Icon */}
                      <div className={`p-3 rounded-xl ${categoryColors[category]} ${
                        !achievement.unlocked && 'grayscale'
                      }`}>
                        {(() => {
                          const AchievementIcon = iconMap[achievement.icon] || Star;
                          return <AchievementIcon className="w-6 h-6" />;
                        })()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate pr-6">
                          {achievement.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">
                          {achievement.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            achievement.unlocked 
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}>
                            {achievement.points} pts
                          </span>
                          {!achievement.unlocked && (
                            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <Lock className="w-3 h-3" />
                              Locked
                            </span>
                          )}
                          {achievement.unlocked && achievement.unlockedAt && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(achievement.unlockedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        {achievements.length === 0 && (
          <Card className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-4">
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No achievements yet</h3>
            <p className="text-gray-500 dark:text-gray-400">Start reaching your goals to unlock achievements!</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
