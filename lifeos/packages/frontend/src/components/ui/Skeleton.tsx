'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export function Skeleton({ className = '', animate = true }: SkeletonProps) {
  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 rounded ${
        animate ? 'animate-pulse' : ''
      } ${className}`}
    />
  );
}

// Card skeleton
export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-700">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

// List item skeleton
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-gray-700">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-20 rounded" />
    </div>
  );
}

// Dashboard skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <Skeleton className="h-6 w-40" />
        </div>
        <table className="w-full">
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRowSkeleton key={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Goals list skeleton
export function GoalsListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-2 w-full rounded-full mb-2" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Habits skeleton
export function HabitsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4"
        >
          <Skeleton className="h-6 w-6 rounded" />
          <div className="flex-1">
            <Skeleton className="h-5 w-40 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-16 rounded" />
          <div className="flex gap-1">
            {Array.from({ length: 7 }).map((_, j) => (
              <Skeleton key={j} className="h-6 w-6 rounded" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Form skeleton
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
  );
}

// Profile skeleton
export function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-6 mb-8">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
        <FormSkeleton fields={3} />
      </div>
    </div>
  );
}
