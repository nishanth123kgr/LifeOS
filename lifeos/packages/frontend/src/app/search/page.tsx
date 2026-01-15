'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search as SearchIcon, Target, Dumbbell, CheckSquare, Settings2, BookOpen, FileText, X } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { debounce } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'financial_goal' | 'fitness_goal' | 'habit' | 'life_system' | 'journal' | 'achievement';
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}

const typeIcons: Record<string, any> = {
  financial_goal: Target,
  fitness_goal: Dumbbell,
  habit: CheckSquare,
  life_system: Settings2,
  journal: BookOpen,
  achievement: FileText,
};

const typeColors: Record<string, string> = {
  financial_goal: 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400',
  fitness_goal: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
  habit: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400',
  life_system: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400',
  journal: 'bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400',
  achievement: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
};

const typeLabels: Record<string, string> = {
  financial_goal: 'Financial Goal',
  fitness_goal: 'Fitness Goal',
  habit: 'Habit',
  life_system: 'Life System',
  journal: 'Journal Entry',
  achievement: 'Achievement',
};

const typeLinks: Record<string, string> = {
  financial_goal: '/goals/financial',
  fitness_goal: '/goals/fitness',
  habit: '/habits',
  life_system: '/systems',
  journal: '/journal',
  achievement: '/achievements',
};

export default function SearchPage() {
  const router = useRouter();
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

  const allTypes = Object.keys(typeLabels);

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
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <SearchIcon className="w-8 h-8 text-primary-500" />
            Search
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Find anything across your goals, habits, and more
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for goals, habits, journal entries..."
            className="w-full pl-12 pr-12 py-4 text-lg border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Type Filters */}
        <div className="flex flex-wrap gap-2">
          {allTypes.map(type => {
            const Icon = typeIcons[type];
            const isSelected = selectedTypes.includes(type);
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {typeLabels[type]}
              </button>
            );
          })}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : searched && results.length === 0 ? (
          <Card className="text-center py-12">
            <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">No results found</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Try a different search term or filter
            </p>
          </Card>
        ) : results.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedResults).map(([type, items]) => (
              <div key={type}>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  {(() => {
                    const Icon = typeIcons[type];
                    return <Icon className="w-5 h-5" />;
                  })()}
                  {typeLabels[type]}
                  <span className="text-sm font-normal text-gray-500">({items.length})</span>
                </h2>
                <div className="space-y-2">
                  {items.map(result => {
                    const Icon = typeIcons[result.type];
                    const colorClass = typeColors[result.type];
                    return (
                      <Link
                        key={result.id}
                        href={typeLinks[result.type]}
                        className="block"
                      >
                        <Card className="hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                          <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-grow min-w-0">
                              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                {result.title}
                              </h3>
                              {result.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                  {result.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <SearchIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">Start typing to search</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Search across all your goals, habits, journal entries, and more
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
