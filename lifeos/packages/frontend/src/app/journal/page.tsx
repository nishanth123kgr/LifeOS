'use client';

import { useState, useEffect } from 'react';
import { Plus, BookOpen, Calendar, Smile, Meh, Frown, ChevronLeft, ChevronRight, Trash2, Edit2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';

interface JournalEntry {
  id: string;
  date: string;
  mood: number;
  content: string;
  gratitude?: string;
  tags: string[];
  createdAt: string;
}

const moodEmojis = [
  { value: 1, emoji: '😢', label: 'Very Bad', color: 'text-red-500' },
  { value: 2, emoji: '😔', label: 'Bad', color: 'text-orange-500' },
  { value: 3, emoji: '😐', label: 'Okay', color: 'text-yellow-500' },
  { value: 4, emoji: '🙂', label: 'Good', color: 'text-lime-500' },
  { value: 5, emoji: '😄', label: 'Great', color: 'text-green-500' },
];

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [formData, setFormData] = useState({
    content: '',
    mood: 3,
    gratitude: '',
    tags: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchEntries();
  }, [currentMonth]);

  const fetchEntries = async () => {
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const response = await api.get(`/journal?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
      setEntries(response.data.entries || []);
    } catch (error) {
      console.error('Failed to fetch journal entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        date: selectedDate.toISOString(),
        content: formData.content,
        mood: formData.mood,
        gratitude: formData.gratitude || undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      };

      if (editingId) {
        await api.put(`/journal/${editingId}`, data);
      } else {
        await api.post('/journal', data);
      }

      setShowModal(false);
      setFormData({ content: '', mood: 3, gratitude: '', tags: '' });
      setEditingId(null);
      fetchEntries();
    } catch (error) {
      console.error('Failed to save journal entry:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this journal entry?')) return;
    try {
      await api.delete(`/journal/${id}`);
      fetchEntries();
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const openNewEntry = (date: Date = new Date()) => {
    setSelectedDate(date);
    setFormData({ content: '', mood: 3, gratitude: '', tags: '' });
    setEditingId(null);
    setShowModal(true);
  };

  const openEditEntry = (entry: JournalEntry) => {
    setSelectedDate(new Date(entry.date));
    setFormData({
      content: entry.content,
      mood: entry.mood,
      gratitude: entry.gratitude || '',
      tags: entry.tags.join(', '),
    });
    setEditingId(entry.id);
    setShowModal(true);
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getEntryForDay = (date: Date) => {
    return entries.find(e => isSameDay(new Date(e.date), date));
  };

  const getMoodEmoji = (mood: number) => moodEmojis.find(m => m.value === mood) || moodEmojis[2];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Journal</h1>
          <p className="text-gray-600 dark:text-gray-400">Record your thoughts and track your mood</p>
        </div>
        <Button onClick={() => openNewEntry()}>
          <Plus className="w-4 h-4 mr-2" />
          New Entry
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
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
              const mood = entry ? getMoodEmoji(entry.mood) : null;
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => entry ? openEditEntry(entry) : openNewEntry(day)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors ${
                    isToday(day)
                      ? 'bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 font-semibold'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span>{format(day, 'd')}</span>
                  {mood && <span className="text-lg">{mood.emoji}</span>}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Recent Entries */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Entries</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {entries.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No entries this month</p>
            ) : (
              entries.slice(0, 10).map(entry => {
                const mood = getMoodEmoji(entry.mood);
                return (
                  <div
                    key={entry.id}
                    className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    onClick={() => openEditEntry(entry)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {format(new Date(entry.date), 'MMM d, yyyy')}
                      </span>
                      <span className="text-xl">{mood.emoji}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {entry.content}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {editingId ? 'Edit Entry' : 'New Journal Entry'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Mood selector */}
                <div>
                  <label className="label">How are you feeling?</label>
                  <div className="flex justify-between gap-2">
                    {moodEmojis.map(mood => (
                      <button
                        key={mood.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, mood: mood.value })}
                        className={`flex-1 py-3 rounded-lg text-2xl transition-all ${
                          formData.mood === mood.value
                            ? 'bg-primary-100 dark:bg-primary-500/20 scale-110'
                            : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {mood.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="label">What's on your mind?</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="input min-h-[120px]"
                    placeholder="Write about your day..."
                    required
                  />
                </div>

                {/* Gratitude */}
                <div>
                  <label className="label">What are you grateful for? (optional)</label>
                  <textarea
                    value={formData.gratitude}
                    onChange={(e) => setFormData({ ...formData, gratitude: e.target.value })}
                    className="input min-h-[80px]"
                    placeholder="I'm grateful for..."
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="label">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="input"
                    placeholder="work, family, health"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  {editingId && (
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => {
                        handleDelete(editingId);
                        setShowModal(false);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button type="submit" className="flex-1">
                    {editingId ? 'Update' : 'Save'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
