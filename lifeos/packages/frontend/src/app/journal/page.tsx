'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Flame,
  Sparkles,
  PenLine,
  Heart,
  TrendingUp,
  RefreshCcw,
  Search,
  LayoutGrid,
  List,
  Clock,
  FileText,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import api from '@/lib/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface JournalEntry {
  id: string;
  date: string;
  title?: string;
  mood: number;
  energy?: number;
  content: string;
  gratitude?: string;
  tags: string[];
  wordCount?: number;
  createdAt: string;
}

interface JournalStats {
  streak: number;
  totalEntries: number;
  avgMood: number;
  avgEnergy: number;
  totalWords: number;
}

// Mood levels with gradient colors
const moodLevels = [
  { value: 1, label: 'Rough', color: 'from-red-400 to-red-500', solid: 'bg-red-500', text: 'text-red-500', bg: 'bg-red-100 dark:bg-red-500/20', ring: 'ring-red-500' },
  { value: 2, label: 'Low', color: 'from-orange-400 to-orange-500', solid: 'bg-orange-500', text: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-500/20', ring: 'ring-orange-500' },
  { value: 3, label: 'Neutral', color: 'from-yellow-400 to-yellow-500', solid: 'bg-yellow-500', text: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-500/20', ring: 'ring-yellow-500' },
  { value: 4, label: 'Good', color: 'from-emerald-400 to-emerald-500', solid: 'bg-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/20', ring: 'ring-emerald-500' },
  { value: 5, label: 'Great', color: 'from-green-400 to-green-500', solid: 'bg-green-500', text: 'text-green-500', bg: 'bg-green-100 dark:bg-green-500/20', ring: 'ring-green-500' },
];

const writingPrompts = [
  "What made you smile today?",
  "What's one thing you learned recently?",
  "Describe a moment you felt truly present today.",
  "What challenge did you overcome this week?",
  "What would your ideal day look like?",
  "What are you looking forward to?",
  "Who made a positive impact on your life recently?",
  "What's something you'd like to improve about yourself?",
  "Describe a recent accomplishment you're proud of.",
  "What's weighing on your mind right now?",
];

export default function JournalPage() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState('');

  useEffect(() => {
    setCurrentPrompt(writingPrompts[Math.floor(Math.random() * writingPrompts.length)]);
  }, []);

  // Fetch entries for current month
  const { data: entriesData, isLoading: loadingEntries } = useQuery({
    queryKey: ['journal', currentMonth.toISOString()],
    queryFn: async () => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const response = await api.get(`/journal?dateFrom=${start.toISOString()}&dateTo=${end.toISOString()}`);
      return response.data;
    },
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['journal-stats'],
    queryFn: async () => {
      const [streakRes, entriesRes] = await Promise.all([
        api.get('/journal/streak'),
        api.get('/journal?limit=100')
      ]);
      
      const allEntries = entriesRes.data.entries || [];
      const streak = streakRes.data.streak?.current || 0;
      const totalEntries = entriesRes.data.total || allEntries.length;
      const avgMood = allEntries.length > 0 
        ? allEntries.reduce((sum: number, e: JournalEntry) => sum + (e.mood || 3), 0) / allEntries.length 
        : 0;
      const avgEnergy = allEntries.length > 0
        ? allEntries.filter((e: JournalEntry) => e.energy).reduce((sum: number, e: JournalEntry) => sum + (e.energy || 3), 0) / 
          (allEntries.filter((e: JournalEntry) => e.energy).length || 1)
        : 0;
      const totalWords = allEntries.reduce((sum: number, e: JournalEntry) => sum + (e.wordCount || 0), 0);

      return { streak, totalEntries, avgMood, avgEnergy, totalWords } as JournalStats;
    },
  });

  const entries = entriesData?.entries || [];
  const stats = statsData || { streak: 0, totalEntries: 0, avgMood: 0, avgEnergy: 0, totalWords: 0 };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getEntryForDay = (date: Date) => {
    return entries.find((e: JournalEntry) => isSameDay(parseISO(e.date), date));
  };

  const getMoodLevel = (mood: number) => moodLevels.find(m => m.value === mood) || moodLevels[2];

  const openNewEntry = (date?: Date) => {
    const dateStr = date ? format(date, 'yyyy-MM-dd') : '';
    router.push(`/journal/new${dateStr ? `?date=${dateStr}` : ''}`);
  };

  const openEditEntry = (entry: JournalEntry) => {
    router.push(`/journal/new?edit=${entry.id}`);
  };

  const shufflePrompt = () => {
    setCurrentPrompt(writingPrompts[Math.floor(Math.random() * writingPrompts.length)]);
  };

  const filteredEntries = entries.filter((entry: JournalEntry) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      entry.content.toLowerCase().includes(query) ||
      entry.title?.toLowerCase().includes(query) ||
      entry.tags.some(tag => tag.toLowerCase().includes(query))
    );
  });

  if (loadingEntries) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 p-8">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">Journal</h1>
              </div>
              <p className="text-white/80 max-w-md">
                Reflect on your day, track your mood, and capture moments that matter.
              </p>
            </div>
            <Button 
              onClick={() => openNewEntry()}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white shadow-lg"
              size="lg"
            >
              <PenLine className="w-5 h-5 mr-2" />
              Write Today
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-orange-100 dark:from-orange-900/30 to-transparent rounded-bl-full opacity-50" />
            <div className="relative flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl group-hover:scale-110 transition-transform">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.streak}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Day Streak</p>
              </div>
            </div>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-100 dark:from-blue-900/30 to-transparent rounded-bl-full opacity-50" />
            <div className="relative flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalEntries}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Entries</p>
              </div>
            </div>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-pink-100 dark:from-pink-900/30 to-transparent rounded-bl-full opacity-50" />
            <div className="relative flex items-center gap-4">
              <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-xl group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6 text-pink-500" />
              </div>
              <div>
                {stats.avgMood > 0 ? (
                  <div className="flex items-center gap-2">
                    <div className={cn('w-4 h-4 rounded-full', getMoodLevel(Math.round(stats.avgMood)).solid)} />
                    <span className={cn('text-xl font-bold', getMoodLevel(Math.round(stats.avgMood)).text)}>
                      {getMoodLevel(Math.round(stats.avgMood)).label}
                    </span>
                  </div>
                ) : (
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">—</p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg Mood</p>
              </div>
            </div>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-100 dark:from-purple-900/30 to-transparent rounded-bl-full opacity-50" />
            <div className="relative flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalWords.toLocaleString()}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Words Written</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar / List View */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={cn(
                      'p-2 rounded-md transition-colors',
                      viewMode === 'calendar'
                        ? 'bg-white dark:bg-gray-700 shadow-sm'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                    )}
                  >
                    <LayoutGrid className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'p-2 rounded-md transition-colors',
                      viewMode === 'list'
                        ? 'bg-white dark:bg-gray-700 shadow-sm'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                    )}
                  >
                    <List className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400 font-medium"
                >
                  Today
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {viewMode === 'calendar' ? (
              <>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}
                  {days.map(day => {
                    const entry = getEntryForDay(day);
                    const mood = entry ? getMoodLevel(entry.mood) : null;
                    const isFuture = day > new Date();
                    
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => !isFuture && (entry ? openEditEntry(entry) : openNewEntry(day))}
                        disabled={isFuture}
                        className={cn(
                          'aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all duration-200 relative group',
                          isFuture
                            ? 'opacity-30 cursor-not-allowed'
                            : isToday(day)
                            ? 'bg-primary-100 dark:bg-primary-500/20 ring-2 ring-primary-500 font-bold'
                            : entry
                            ? `${mood?.bg} hover:scale-105 hover:shadow-md`
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        )}
                      >
                        <span className={cn(
                          'text-gray-700 dark:text-gray-300',
                          isToday(day) && 'text-primary-600 dark:text-primary-400',
                          entry && mood?.text
                        )}>
                          {format(day, 'd')}
                        </span>
                        {mood && (
                          <div className={cn('w-2 h-2 rounded-full mt-0.5', mood.solid)} />
                        )}
                        {!isFuture && !entry && (
                          <Plus className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 absolute bottom-1 transition-opacity" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Mood Scale</p>
                  <div className="flex items-center gap-1">
                    {moodLevels.map((mood, i) => (
                      <div key={mood.value} className="flex items-center" title={mood.label}>
                        <div className={cn(
                          'w-8 h-3',
                          mood.solid,
                          i === 0 && 'rounded-l-full',
                          i === moodLevels.length - 1 && 'rounded-r-full'
                        )} />
                      </div>
                    ))}
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-3">Rough → Great</span>
                  </div>
                </div>
              </>
            ) : (
              /* List View */
              <div className="space-y-3">
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search entries..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {filteredEntries.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No entries found</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Start writing to see your entries here</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {filteredEntries.map((entry: JournalEntry) => {
                      const mood = getMoodLevel(entry.mood);
                      return (
                        <button
                          key={entry.id}
                          onClick={() => openEditEntry(entry)}
                          className="w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all hover:shadow-md border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                {entry.title || format(parseISO(entry.date), 'MMMM d, yyyy')}
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {format(parseISO(entry.date), 'EEEE, MMM d')}
                                {entry.wordCount && ` · ${entry.wordCount} words`}
                              </p>
                            </div>
                            <div className={cn('px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5', mood.bg, mood.text)}>
                              <div className={cn('w-2 h-2 rounded-full', mood.solid)} />
                              {mood.label}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                            {entry.content}
                          </p>
                          {entry.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {entry.tags.slice(0, 4).map(tag => (
                                <span key={tag} className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                                  #{tag}
                                </span>
                              ))}
                              {entry.tags.length > 4 && (
                                <span className="px-2 py-0.5 text-xs text-gray-400">+{entry.tags.length - 4}</span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Write Card */}
            <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-200 dark:border-violet-500/30">
              <div className="text-center">
                <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <PenLine className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold text-violet-900 dark:text-violet-200 mb-2">
                  Ready to write?
                </h3>
                <p className="text-sm text-violet-700 dark:text-violet-300 mb-4">
                  Capture your thoughts, feelings, and experiences.
                </p>
                <Button onClick={() => openNewEntry()} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  New Entry
                </Button>
              </div>
            </Card>

            {/* Writing Prompt */}
            <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-200 dark:border-indigo-500/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-semibold text-indigo-900 dark:text-indigo-300">Writing Prompt</h3>
                </div>
                <button
                  onClick={shufflePrompt}
                  className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
                  title="Get new prompt"
                >
                  <RefreshCcw className="w-4 h-4 text-indigo-500" />
                </button>
              </div>
              <p className="text-indigo-800 dark:text-indigo-200 italic text-lg leading-relaxed">
                &quot;{currentPrompt}&quot;
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openNewEntry()}
                className="mt-4 border-indigo-300 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-300"
              >
                Start Writing
              </Button>
            </Card>

            {/* Recent Entries */}
            <Card>
              <CardHeader title="Recent Entries" />
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {entries.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">No entries this month</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Start journaling today!</p>
                  </div>
                ) : (
                  entries.slice(0, 5).map((entry: JournalEntry) => {
                    const mood = getMoodLevel(entry.mood);
                    return (
                      <button
                        key={entry.id}
                        className="w-full text-left p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                        onClick={() => openEditEntry(entry)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {entry.title || format(parseISO(entry.date), 'MMM d')}
                          </span>
                          <div className={cn('w-3 h-3 rounded-full', mood.solid)} title={mood.label} />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {entry.content}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
