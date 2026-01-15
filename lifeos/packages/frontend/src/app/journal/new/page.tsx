'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  Trash2,
  Sparkles,
  RefreshCcw,
  Heart,
  Zap,
  Calendar,
  Tag,
  FileText,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Mood levels with visual styling
const moodLevels = [
  { value: 1, label: 'Rough', solid: 'bg-red-500', text: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/30', activeBorder: 'border-red-500', description: 'Having a tough day' },
  { value: 2, label: 'Low', solid: 'bg-orange-500', text: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/30', activeBorder: 'border-orange-500', description: 'Feeling a bit down' },
  { value: 3, label: 'Neutral', solid: 'bg-yellow-500', text: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-500/10', border: 'border-yellow-200 dark:border-yellow-500/30', activeBorder: 'border-yellow-500', description: 'Just an average day' },
  { value: 4, label: 'Good', solid: 'bg-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/30', activeBorder: 'border-emerald-500', description: 'Feeling pretty good' },
  { value: 5, label: 'Great', solid: 'bg-green-500', text: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10', border: 'border-green-200 dark:border-green-500/30', activeBorder: 'border-green-500', description: 'Amazing day!' },
];

const energyLevels = [
  { value: 1, label: 'Exhausted', color: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/30', activeBorder: 'border-red-500', text: 'text-red-600 dark:text-red-400' },
  { value: 2, label: 'Tired', color: 'bg-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/30', activeBorder: 'border-orange-500', text: 'text-orange-600 dark:text-orange-400' },
  { value: 3, label: 'Moderate', color: 'bg-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-500/10', border: 'border-yellow-200 dark:border-yellow-500/30', activeBorder: 'border-yellow-500', text: 'text-yellow-600 dark:text-yellow-400' },
  { value: 4, label: 'Energetic', color: 'bg-lime-500', bg: 'bg-lime-50 dark:bg-lime-500/10', border: 'border-lime-200 dark:border-lime-500/30', activeBorder: 'border-lime-500', text: 'text-lime-600 dark:text-lime-400' },
  { value: 5, label: 'Supercharged', color: 'bg-green-500', bg: 'bg-green-50 dark:bg-green-500/10', border: 'border-green-200 dark:border-green-500/30', activeBorder: 'border-green-500', text: 'text-green-600 dark:text-green-400' },
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
  "What small thing brought you joy today?",
  "What are you most curious about right now?",
  "Describe your perfect morning routine.",
  "What's a fear you'd like to overcome?",
  "What are you holding onto that you need to let go?",
];

const suggestedTags = [
  'personal', 'work', 'health', 'family', 'friends', 'goals', 
  'reflection', 'gratitude', 'challenge', 'achievement', 'learning', 'creativity'
];

interface JournalEntry {
  id: string;
  date: string;
  title?: string;
  mood: number;
  energy?: number;
  content: string;
  gratitude?: string;
  tags: string[];
}

export default function NewJournalEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  
  const editId = searchParams.get('edit');
  const dateParam = searchParams.get('date');
  
  const [selectedDate, setSelectedDate] = useState(() => {
    if (dateParam) return new Date(dateParam);
    return new Date();
  });
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    mood: 3,
    energy: 3,
    gratitude: '',
    tags: [] as string[],
  });
  
  const [tagInput, setTagInput] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState(() => 
    writingPrompts[Math.floor(Math.random() * writingPrompts.length)]
  );
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Fetch existing entry if editing
  const { data: existingEntry, isLoading: loadingEntry } = useQuery<JournalEntry>({
    queryKey: ['journal-entry', editId],
    queryFn: async () => {
      const response = await api.get(`/journal/${editId}`);
      return response.data.entry;
    },
    enabled: !!editId,
  });

  // Populate form when editing
  useEffect(() => {
    if (existingEntry) {
      setFormData({
        title: existingEntry.title || '',
        content: existingEntry.content,
        mood: existingEntry.mood || 3,
        energy: existingEntry.energy || 3,
        gratitude: existingEntry.gratitude || '',
        tags: existingEntry.tags || [],
      });
      setSelectedDate(new Date(existingEntry.date));
    }
  }, [existingEntry]);

  // Calculate word count
  const wordCount = useMemo(() => {
    const contentWords = formData.content.trim().split(/\s+/).filter(w => w.length > 0).length;
    const gratitudeWords = formData.gratitude.trim().split(/\s+/).filter(w => w.length > 0).length;
    return contentWords + gratitudeWords;
  }, [formData.content, formData.gratitude]);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { date: string }) => {
      setSaveStatus('saving');
      if (editId) {
        return api.put(`/journal/${editId}`, data);
      }
      return api.post('/journal', data);
    },
    onSuccess: () => {
      setSaveStatus('saved');
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      setTimeout(() => {
        router.push('/journal');
      }, 500);
    },
    onError: () => {
      setSaveStatus('error');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return api.delete(`/journal/${editId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      router.push('/journal');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      ...formData,
      date: selectedDate.toISOString(),
    });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this journal entry? This cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  const addTag = (tag: string) => {
    const cleanTag = tag.trim().toLowerCase();
    if (cleanTag && !formData.tags.includes(cleanTag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, cleanTag] }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
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

  const getMoodLevel = (mood: number) => moodLevels.find(m => m.value === mood) || moodLevels[2];

  if (editId && loadingEntry) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/journal')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editId ? 'Edit Journal Entry' : 'New Journal Entry'}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4" />
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                Error saving
              </span>
            )}
            {editId && (
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={saveMutation.isPending || !formData.content.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : editId ? 'Update' : 'Save Entry'}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Picker */}
          <Card className="p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Entry Date
            </label>
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              max={format(new Date(), 'yyyy-MM-dd')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </Card>

          {/* Mood & Energy Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mood Selector */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                How are you feeling?
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {moodLevels.map((mood) => {
                  const isSelected = formData.mood === mood.value;
                  return (
                    <button
                      key={mood.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, mood: mood.value })}
                      className={cn(
                        'flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200',
                        isSelected
                          ? `${mood.bg} ${mood.activeBorder} shadow-md scale-105`
                          : `bg-white dark:bg-gray-800 ${mood.border} hover:${mood.bg} hover:scale-102`
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-transform',
                        isSelected ? mood.solid : 'bg-gray-200 dark:bg-gray-700',
                        isSelected && 'scale-110'
                      )}>
                        <span className="text-white font-bold text-sm">{mood.value}</span>
                      </div>
                      <span className={cn(
                        'text-xs font-medium text-center',
                        isSelected ? mood.text : 'text-gray-500 dark:text-gray-400'
                      )}>
                        {mood.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {getMoodLevel(formData.mood).description}
                </p>
              </div>
            </Card>

            {/* Energy Level */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Energy Level
              </h3>
              <div className="space-y-3">
                {energyLevels.map((level) => {
                  const isSelected = formData.energy === level.value;
                  return (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, energy: level.value })}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200',
                        isSelected
                          ? `${level.bg} ${level.activeBorder} shadow-md`
                          : `bg-white dark:bg-gray-800 ${level.border} hover:${level.bg}`
                      )}
                    >
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((bar) => (
                          <div
                            key={bar}
                            className={cn(
                              'w-2 rounded-full transition-all',
                              bar <= level.value ? level.color : 'bg-gray-200 dark:bg-gray-700'
                            )}
                            style={{ height: `${8 + bar * 4}px` }}
                          />
                        ))}
                      </div>
                      <span className={cn(
                        'font-medium flex-1 text-left',
                        isSelected ? level.text : 'text-gray-700 dark:text-gray-300'
                      )}>
                        {level.label}
                      </span>
                      {isSelected && (
                        <div className={cn('w-2 h-2 rounded-full', level.color)} />
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Title */}
          <Card>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Give your entry a memorable title..."
            />
          </Card>

          {/* Main Content */}
          <Card>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                What&apos;s on your mind?
              </label>
              <span className="text-sm text-gray-400">
                {wordCount} words
              </span>
            </div>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[250px] resize-y text-lg leading-relaxed"
              placeholder="Start writing... Let your thoughts flow freely."
              required
            />
          </Card>

          {/* Writing Prompt */}
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-500/30">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-indigo-900 dark:text-indigo-300">
                    Need inspiration?
                  </h3>
                  <button
                    type="button"
                    onClick={shufflePrompt}
                    className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
                    title="Get new prompt"
                  >
                    <RefreshCcw className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </button>
                </div>
                <p className="text-indigo-800 dark:text-indigo-200 italic text-lg mb-3">
                  &quot;{currentPrompt}&quot;
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={usePrompt}
                  className="border-indigo-300 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-300"
                >
                  Use this prompt
                </Button>
              </div>
            </div>
          </Card>

          {/* Gratitude Section */}
          <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border-pink-200 dark:border-pink-500/30">
            <label className="block text-sm font-medium text-pink-800 dark:text-pink-300 mb-2 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              What are you grateful for today?
            </label>
            <textarea
              value={formData.gratitude}
              onChange={(e) => setFormData({ ...formData, gratitude: e.target.value })}
              className="w-full px-4 py-3 border border-pink-200 dark:border-pink-500/30 rounded-xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent min-h-[100px] resize-y"
              placeholder="I'm grateful for..."
            />
          </Card>

          {/* Tags Section */}
          <Card>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </label>
            
            {/* Current Tags */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="p-0.5 hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Tag Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Add a tag..."
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addTag(tagInput)}
                disabled={!tagInput.trim()}
              >
                Add
              </Button>
            </div>

            {/* Suggested Tags */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedTags
                  .filter(tag => !formData.tags.includes(tag))
                  .map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
              </div>
            </div>
          </Card>

          {/* Bottom Save Button (Mobile) */}
          <div className="lg:hidden sticky bottom-4 pt-4">
            <Button
              type="submit"
              className="w-full shadow-lg"
              disabled={saveMutation.isPending || !formData.content.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : editId ? 'Update Entry' : 'Save Entry'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
