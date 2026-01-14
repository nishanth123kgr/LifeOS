'use client';

import { useState, useEffect } from 'react';
import { Trophy, Lock, Star, Zap, Target, Dumbbell, CheckSquare, Settings2, Award } from 'lucide-react';
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
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
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

  const categories = ['GENERAL', 'FINANCE', 'FITNESS', 'HABITS', 'SYSTEMS'];

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
      <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          Achievements
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Earn rewards for reaching your goals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-500/20">
            <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Unlocked</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.unlocked} / {stats.total}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-500/20">
            <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Points</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.points}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-100 dark:bg-green-500/20">
            <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Completion</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total > 0 ? Math.round((stats.unlocked / stats.total) * 100) : 0}%
            </p>
          </div>
        </Card>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedCategory === null
              ? 'bg-primary-600 text-white'
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
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                selectedCategory === cat
                  ? 'bg-primary-600 text-white'
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

        return (
          <div key={category} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Icon className="w-5 h-5" />
              {category.charAt(0) + category.slice(1).toLowerCase()}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categoryAchievements.map(achievement => (
                <Card
                  key={achievement.id}
                  className={`relative overflow-hidden transition-all ${
                    achievement.unlocked
                      ? 'ring-2 ring-yellow-400 dark:ring-yellow-500'
                      : 'opacity-60'
                  }`}
                >
                  {/* Unlocked badge */}
                  {achievement.unlocked && (
                    <div className="absolute top-2 right-2">
                      <div className="p-1 bg-yellow-400 rounded-full">
                        <Star className="w-3 h-3 text-white" fill="white" />
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`p-3 rounded-xl text-2xl ${categoryColors[category]}`}>
                      {achievement.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {achievement.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {achievement.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
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
        <Card className="text-center py-12">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No achievements yet. Start reaching your goals!</p>
        </Card>
      )}
      </div>
    </DashboardLayout>
  );
}
