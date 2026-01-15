'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, BookOpen, Calendar, ChevronLeft, ChevronRight, Trash2, Flame, Sparkles, PenLine, Heart, Zap, TrendingUp, RefreshCcw, X } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';

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

// Mood levels with gradient colors (no emojis)
const moodLevels = [
  { value: 1, label: 'Rough', color: 'from-red-400 to-red-500', solid: 'bg-red-500', text: 'text-red-500', bg: 'bg-red-100 dark:bg-red-500/20', ring: 'ring-red-500' },
  { value: 2, label: 'Low', color: 'from-orange-400 to-orange-500', solid: 'bg-orange-500', text: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-500/20', ring: 'ring-orange-500' },
  { value: 3, label: 'Neutral', color: 'from-yellow-400 to-yellow-500', solid: 'bg-yellow-500', text: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-500/20', ring: 'ring-yellow-500' },
  { value: 4, label: 'Good', color: 'from-emerald-400 to-emerald-500', solid: 'bg-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/20', ring: 'ring-emerald-500' },
  { value: 5, label: 'Great', color: 'from-green-400 to-green-500', solid: 'bg-green-500', text: 'text-green-500', bg: 'bg-green-100 dark:bg-green-500/20', ring: 'ring-green-500' },
];

const energyLevels = [
  { value: 1, label: 'Exhausted', color: 'bg-red-500' },
  { value: 2, label: 'Tired', color: 'bg-orange-500' },
  { value: 3, label: 'Moderate', color: 'bg-yellow-500' },
  { value: 4, label: 'Energetic', color: 'bg-lime-500' },
  { value: 5, label: 'Supercharged', color: 'bg-green-500' },
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
  "What does success mean to you?",
  "Write about a memory that makes you happy.",
  "What are your top 3 priorities right now?",
  "How have you grown in the past year?",
  "What would you tell your younger self?",
];

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [stats, setStats] = useState<JournalStats>({ streak: 0, totalEntries: 0, avgMood: 0, avgEnergy: 0, totalWords: 0 });
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    mood: 3,
    energy: 3,
    gratitude: '',
    tags: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Calculate word count
  const wordCount = useMemo(() => {
    const contentWords = formData.content.trim().split(/\s+/).filter(w => w.length > 0).length;
    const gratitudeWords = formData.gratitude.trim().split(/\s+/).filter(w => w.length > 0).length;
    return contentWords + gratitudeWords;
  }, [formData.content, formData.gratitude]);

  useEffect(() => {
    fetchEntries();
    fetchStats();
    // Set a random prompt
    setCurrentPrompt(writingPrompts[Math.floor(Math.random() * writingPrompts.length)]);
  }, [currentMonth]);

  const fetchEntries = async () => {
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const response = await api.get(`/journal?dateFrom=${start.toISOString()}&dateTo=${end.toISOString()}`);
      setEntries(response.data.entries || []);
    } catch (error) {
      console.error('Failed to fetch journal entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
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
          allEntries.filter((e: JournalEntry) => e.energy).length || 0
        : 0;
      const totalWords = allEntries.reduce((sum: number, e: JournalEntry) => sum + (e.wordCount || 0), 0);

      setStats({ streak, totalEntries, avgMood, avgEnergy, totalWords });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        date: selectedDate.toISOString(),
        title: formData.title || undefined,
        content: formData.content,
        mood: formData.mood,
        energy: formData.energy,
        gratitude: formData.gratitude || undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : [],
      };

      if (editingId) {
        await api.put(`/journal/${editingId}`, data);
      } else {
        await api.post('/journal', data);
      }

      setShowModal(false);
      resetForm();
      fetchEntries();
      fetchStats();
    } catch (error) {
      console.error('Failed to save journal entry:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this journal entry?')) return;
    try {
      await api.delete(`/journal/${id}`);
      setShowModal(false);
      resetForm();
      fetchEntries();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', mood: 3, energy: 3, gratitude: '', tags: '' });
    setEditingId(null);
  };

  const openNewEntry = (date: Date = new Date()) => {
    setSelectedDate(date);
    resetForm();
    setShowModal(true);
  };

  const openEditEntry = (entry: JournalEntry) => {
    setSelectedDate(new Date(entry.date));
    setFormData({
      title: entry.title || '',
      content: entry.content,
      mood: entry.mood || 3,
      energy: entry.energy || 3,
      gratitude: entry.gratitude || '',
      tags: entry.tags.join(', '),
    });
    setEditingId(entry.id);
    setShowModal(true);
  };

  const usePrompt = () => {
    setFormData(prev => ({
      ...prev,
      content: prev.content + (prev.content ? '\n\n' : '') + currentPrompt + '\n'
    }));
  };

  const shufflePrompt = () => {
    setCurrentPrompt(writingPrompts[Math.floor(Math.random() * writingPrompts.length)]);
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getEntryForDay = (date: Date) => {
    return entries.find(e => isSameDay(new Date(e.date), date));
  };

  const getMoodLevel = (mood: number) => moodLevels.find(m => m.value === mood) || moodLevels[2];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-primary-500" />
              Journal
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Reflect, grow, and track your journey</p>
          </div>
          <Button onClick={() => openNewEntry()} size="lg">
            <PenLine className="w-4 h-4 mr-2" />
            Write Today
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-500/10 dark:to-orange-500/5 border-orange-200 dark:border-orange-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.streak}</p>
                <p className="text-sm text-orange-700 dark:text-orange-300">Day Streak</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-500/10 dark:to-blue-500/5 border-blue-200 dark:border-blue-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalEntries}</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">Total Entries</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-500/10 dark:to-pink-500/5 border-pink-200 dark:border-pink-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500/20 rounded-lg">
                <Heart className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {stats.avgMood > 0 ? (
                    <>
                      <div className={`w-4 h-4 rounded-full ${getMoodLevel(Math.round(stats.avgMood)).solid}`} />
                      <span className={`text-lg font-bold ${getMoodLevel(Math.round(stats.avgMood)).text}`}>
                        {getMoodLevel(Math.round(stats.avgMood)).label}
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-pink-600 dark:text-pink-400">—</span>
                  )}
                </div>
                <p className="text-sm text-pink-700 dark:text-pink-300">Avg Mood</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-500/10 dark:to-purple-500/5 border-purple-200 dark:border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalWords.toLocaleString()}</p>
                <p className="text-sm text-purple-700 dark:text-purple-300">Words Written</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
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

            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
                  {day}
                </div>
              ))}
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
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all ${
                      isFuture
                        ? 'opacity-30 cursor-not-allowed'
                        : isToday(day)
                        ? 'bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 font-semibold ring-2 ring-primary-500'
                        : entry
                        ? `${mood?.bg} hover:scale-105`
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className={entry ? mood?.text : ''}>{format(day, 'd')}</span>
                    {mood && <div className={`w-2 h-2 rounded-full mt-0.5 ${mood.solid}`} />}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Mood</p>
              <div className="flex items-center gap-1">
                {moodLevels.map((mood, i) => (
                  <div key={mood.value} className="flex items-center">
                    <div className={`w-6 h-2 ${mood.solid} ${i === 0 ? 'rounded-l-full' : ''} ${i === moodLevels.length - 1 ? 'rounded-r-full' : ''}`} title={mood.label} />
                  </div>
                ))}
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">Rough → Great</span>
              </div>
            </div>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Writing Prompt */}
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 border-indigo-200 dark:border-indigo-500/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-semibold text-indigo-900 dark:text-indigo-300">Writing Prompt</h3>
                </div>
                <button
                  onClick={shufflePrompt}
                  className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg transition-colors"
                  title="Get new prompt"
                >
                  <RefreshCcw className="w-4 h-4 text-indigo-500" />
                </button>
              </div>
              <p className="text-indigo-800 dark:text-indigo-200 italic">&quot;{currentPrompt}&quot;</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { openNewEntry(); setTimeout(usePrompt, 100); }}
                className="mt-3 border-indigo-300 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300"
              >
                Start Writing
              </Button>
            </Card>

            {/* Recent Entries */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                Recent Entries
              </h2>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {entries.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">No entries this month</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Start journaling today!</p>
                  </div>
                ) : (
                  entries.slice(0, 8).map(entry => {
                    const mood = getMoodLevel(entry.mood);
                    return (
                      <button
                        key={entry.id}
                        className="w-full text-left p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => openEditEntry(entry)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {entry.title || format(new Date(entry.date), 'MMM d, yyyy')}
                          </span>
                          <div className={`w-3 h-3 rounded-full ${mood.solid}`} title={mood.label} />
                        </div>
                        {entry.title && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {format(new Date(entry.date), 'MMM d, yyyy')}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {entry.content}
                        </p>
                        {entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {entry.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {editingId ? 'Edit Entry' : 'New Journal Entry'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
                <button
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Give your entry a title..."
                  />
                </div>

                {/* Mood & Energy Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Mood selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      How are you feeling?
                    </label>
                    <div className="flex gap-1">
                      {moodLevels.map((mood, i) => (
                        <button
                          key={mood.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, mood: mood.value })}
                          className={`flex-1 h-12 bg-gradient-to-b ${mood.color} transition-all ${
                            i === 0 ? 'rounded-l-lg' : ''
                          } ${
                            i === moodLevels.length - 1 ? 'rounded-r-lg' : ''
                          } ${
                            formData.mood === mood.value
                              ? 'ring-2 ring-offset-2 dark:ring-offset-gray-900 ring-gray-600 dark:ring-white scale-y-110'
                              : 'opacity-40 hover:opacity-70'
                          }`}
                          title={mood.label}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-400">Rough</span>
                      <span className={`text-sm font-medium ${getMoodLevel(formData.mood).text}`}>
                        {getMoodLevel(formData.mood).label}
                      </span>
                      <span className="text-xs text-gray-400">Great</span>
                    </div>
                  </div>

                  {/* Energy Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Energy Level
                    </label>
                    <div className="flex gap-2">
                      {energyLevels.map(level => (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, energy: level.value })}
                          className={`flex-1 h-10 rounded-lg transition-all ${
                            formData.energy >= level.value
                              ? level.color
                              : 'bg-gray-200 dark:bg-gray-700'
                          } ${
                            formData.energy === level.value ? 'ring-2 ring-offset-2 dark:ring-offset-gray-900 ring-gray-400' : ''
                          }`}
                          title={level.label}
                        />
                      ))}
                    </div>
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {energyLevels.find(l => l.value === formData.energy)?.label}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      What&apos;s on your mind?
                    </label>
                    <span className="text-xs text-gray-400">
                      {wordCount} words
                    </span>
                  </div>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[150px] resize-y"
                    placeholder="Write about your day, thoughts, experiences..."
                    required
                  />
                </div>

                {/* Gratitude */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-500" />
                    What are you grateful for?
                  </label>
                  <textarea
                    value={formData.gratitude}
                    onChange={(e) => setFormData({ ...formData, gratitude: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[80px] resize-y"
                    placeholder="I'm grateful for..."
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="work, personal, reflection (comma separated)"
                  />
                </div>

                {/* Writing Prompt (in modal) */}
                <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg border border-indigo-200 dark:border-indigo-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Need inspiration?
                    </span>
                    <button
                      type="button"
                      onClick={shufflePrompt}
                      className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded transition-colors"
                    >
                      <RefreshCcw className="w-4 h-4 text-indigo-500" />
                    </button>
                  </div>
                  <p className="text-sm text-indigo-700 dark:text-indigo-200 italic">&quot;{currentPrompt}&quot;</p>
                  <button
                    type="button"
                    onClick={usePrompt}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-2"
                  >
                    Use this prompt →
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button type="button" variant="outline" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1">
                    Cancel
                  </Button>
                  {editingId && (
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => handleDelete(editingId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button type="submit" className="flex-1">
                    {editingId ? 'Update Entry' : 'Save Entry'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
