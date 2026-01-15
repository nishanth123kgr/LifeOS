'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search as SearchIcon,
  Target,
  Dumbbell,
  CheckSquare,
  Settings2,
  BookOpen,
  FileText,
  X,
  Sparkles,
  ArrowRight,
  Filter,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import Link from 'next/link';
import { debounce, cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'financial_goal' | 'fitness_goal' | 'habit' | 'life_system' | 'journal' | 'achievement';
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}

const typeConfig: Record<string, {
  icon: any;
  label: string;
  color: string;
  bg: string;
  lightBg: string;
  border: string;
  link: string;
}> = {
  financial_goal: {
    icon: Target,
    label: 'Financial Goal',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500',
    lightBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    border: 'border-emerald-200 dark:border-emerald-500/30',
    link: '/goals/financial',
  },
  fitness_goal: {
    icon: Dumbbell,
    label: 'Fitness Goal',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500',
    lightBg: 'bg-blue-50 dark:bg-blue-500/10',
    border: 'border-blue-200 dark:border-blue-500/30',
    link: '/goals/fitness',
  },
  habit: {
    icon: CheckSquare,
    label: 'Habit',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-500',
    lightBg: 'bg-orange-50 dark:bg-orange-500/10',
    border: 'border-orange-200 dark:border-orange-500/30',
    link: '/habits',
  },
  life_system: {
    icon: Settings2,
    label: 'Life System',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-500',
    lightBg: 'bg-purple-50 dark:bg-purple-500/10',
    border: 'border-purple-200 dark:border-purple-500/30',
    link: '/systems',
  },
  journal: {
    icon: BookOpen,
    label: 'Journal Entry',
    color: 'text-pink-600 dark:text-pink-400',
    bg: 'bg-pink-500',
    lightBg: 'bg-pink-50 dark:bg-pink-500/10',
    border: 'border-pink-200 dark:border-pink-500/30',
    link: '/journal',
  },
  achievement: {
    icon: FileText,
    label: 'Achievement',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500',
    lightBg: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-200 dark:border-amber-500/30',
    link: '/achievements',
  },
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const performSearch = useCallback(
    debounce(async (searchQuery: string, types: string[]) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setSearched(false);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({ q: searchQuery });
        if (types.length > 0) {
          params.append('types', types.join(','));
        }
        const response = await api.get(`/search?${params.toString()}`);
        setResults(response.data.results || []);
        setSearched(true);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    performSearch(query, selectedTypes);
  }, [query, selectedTypes, performSearch]);

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
  };

  const clearFilters = () => {
    setSelectedTypes([]);
  };

  const allTypes = Object.keys(typeConfig);

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 p-8">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute right-1/4 bottom-0 w-24 h-24 bg-white/5 rounded-full blur-xl" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                <SearchIcon className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Search</h1>
            </div>
            <p className="text-white/80 max-w-lg text-lg mb-6">
              Find anything across your goals, habits, journal entries, and more.
            </p>

            {/* Search Input */}
            <div className="relative max-w-2xl">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for goals, habits, journal entries..."
                className="w-full pl-12 pr-12 py-4 text-lg border-0 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-4 focus:ring-white/30 outline-none shadow-xl"
              />
              {query && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Type Filters */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Filter by Type</h2>
            </div>
            {selectedTypes.length > 0 && (
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {allTypes.map(type => {
              const config = typeConfig[type];
              const Icon = config.icon;
              const isSelected = selectedTypes.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border-2',
                    isSelected
                      ? `${config.lightBg} ${config.border} ${config.color} shadow-sm`
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  <Icon className={cn('w-4 h-4', isSelected ? config.color : 'text-gray-400')} />
                  {config.label}
                  {isSelected && (
                    <X className="w-3.5 h-3.5 ml-1" />
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary-200 dark:border-primary-800"></div>
              <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Searching...</p>
          </div>
        ) : searched && results.length === 0 ? (
          <Card className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <SearchIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No results found</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              Try a different search term or adjust your filters
            </p>
            {selectedTypes.length > 0 && (
              <Button variant="secondary" className="mt-4" onClick={clearFilters}>
                Clear All Filters
              </Button>
            )}
          </Card>
        ) : results.length > 0 ? (
          <div className="space-y-6">
            {/* Results Summary */}
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <TrendingUp className="w-4 h-4" />
              <span>Found <strong className="text-gray-900 dark:text-white">{results.length}</strong> results for &quot;{query}&quot;</span>
            </div>

            {Object.entries(groupedResults).map(([type, items]) => {
              const config = typeConfig[type];
              const Icon = config.icon;

              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', config.lightBg)}>
                      <Icon className={cn('w-4 h-4', config.color)} />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {config.label}s
                    </h2>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      config.lightBg, config.color
                    )}>
                      {items.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map(result => (
                      <Link
                        key={result.id}
                        href={config.link}
                        className="block group"
                      >
                        <Card className={cn(
                          'relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
                          config.border
                        )}>
                          {/* Top accent */}
                          <div className={cn('absolute top-0 left-0 right-0 h-0.5', config.bg)} />

                          <div className="flex items-start gap-4 pt-1">
                            <div className={cn(
                              'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110',
                              config.lightBg
                            )}>
                              <Icon className={cn('w-6 h-6', config.color)} />
                            </div>
                            <div className="flex-grow min-w-0">
                              <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                {result.title}
                              </h3>
                              {result.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                                  {result.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <span className={cn(
                                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                  config.lightBg, config.color
                                )}>
                                  {config.label}
                                </span>
                              </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Initial State */
          <Card className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-pink-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Start Searching
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              Type in the search box above to find your goals, habits, journal entries, achievements, and more.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['emergency fund', 'workout', 'meditation', 'gratitude'].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => setQuery(suggestion)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"
                >
                  Try &quot;{suggestion}&quot;
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
