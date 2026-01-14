'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      redirect('/dashboard');
    } else {
      redirect('/login');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  );
}
