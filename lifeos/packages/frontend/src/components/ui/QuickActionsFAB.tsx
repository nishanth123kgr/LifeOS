'use client';

import React, { useState } from 'react';

interface FABAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
}

interface QuickActionsFABProps {
  actions: FABAction[];
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
}

export function QuickActionsFAB({ actions, position = 'bottom-right' }: QuickActionsFABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    'bottom-right': 'right-6 bottom-6',
    'bottom-left': 'left-6 bottom-6',
    'bottom-center': 'left-1/2 -translate-x-1/2 bottom-6',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Action buttons */}
      <div
        className={`absolute bottom-16 right-0 flex flex-col gap-3 transition-all duration-300 ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {actions.map((action, index) => (
          <button
            key={action.id}
            onClick={() => {
              action.onClick();
              setIsOpen(false);
            }}
            className="flex items-center gap-3 group"
            style={{ transitionDelay: `${index * 50}ms` }}
          >
            <span className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-1.5 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {action.label}
            </span>
            <div
              className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-110 ${
                action.color || 'bg-blue-600'
              }`}
            >
              {action.icon}
            </div>
          </button>
        ))}
      </div>

      {/* Main FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-gray-600 dark:bg-gray-400 rotate-45'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </div>
  );
}

// Predefined quick actions for the dashboard
export function DashboardQuickActions() {
  const handleNewGoal = () => {
    window.location.href = '/goals/financial?new=true';
  };

  const handleNewHabit = () => {
    window.location.href = '/habits?new=true';
  };

  const handleLogProgress = () => {
    // Could open a modal for quick logging
    window.location.href = '/dashboard?log=true';
  };

  const handleNewJournal = () => {
    window.location.href = '/journal?new=true';
  };

  const actions: FABAction[] = [
    {
      id: 'goal',
      label: 'New Goal',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: handleNewGoal,
      color: 'bg-green-600',
    },
    {
      id: 'habit',
      label: 'New Habit',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      onClick: handleNewHabit,
      color: 'bg-purple-600',
    },
    {
      id: 'log',
      label: 'Log Progress',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      onClick: handleLogProgress,
      color: 'bg-orange-600',
    },
    {
      id: 'journal',
      label: 'Journal Entry',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      onClick: handleNewJournal,
      color: 'bg-indigo-600',
    },
  ];

  return <QuickActionsFAB actions={actions} />;
}
