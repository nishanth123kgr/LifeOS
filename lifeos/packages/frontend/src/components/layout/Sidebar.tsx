'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Target, 
  Dumbbell, 
  CheckSquare, 
  Settings2,
  Wallet,
  User,
  LogOut,
  BookOpen,
  Trophy,
  Settings,
  Menu,
  X,
  Moon,
  Sun,
  FileText,
  TrendingUp,
  Search,
  Download,
  ChevronRight,
  Sparkles,
  Activity,
  FolderOpen,
  BarChart3,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useState, useEffect } from 'react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Goals & Progress',
    items: [
      { name: 'Financial Goals', href: '/goals/financial', icon: Target },
      { name: 'Fitness Goals', href: '/goals/fitness', icon: Dumbbell },
      { name: 'Habits', href: '/habits', icon: CheckSquare },
      { name: 'Achievements', href: '/achievements', icon: Trophy },
    ],
  },
  {
    label: 'Planning',
    items: [
      { name: 'Life Systems', href: '/systems', icon: Settings2 },
      { name: 'Budget', href: '/budget', icon: Wallet },
      { name: 'Projections', href: '/projections', icon: TrendingUp },
    ],
  },
  {
    label: 'Personal',
    items: [
      { name: 'Journal', href: '/journal', icon: BookOpen },
    ],
  },
  {
    label: 'Tools',
    items: [
      { name: 'Templates', href: '/templates', icon: FileText },
      { name: 'Search', href: '/search', icon: Search },
      { name: 'Export', href: '/export', icon: Download },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const closeMobile = () => setIsMobileOpen(false);

  // Get user initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <Image src="/logo.png" alt="LifeOS" width={36} height={36} className="rounded-lg" />
          <span className="text-lg font-bold text-gray-900 dark:text-white">LifeOS</span>
        </Link>
        <button
          onClick={closeMobile}
          className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto scrollbar-thin">
        {navigationGroups.map((group, groupIndex) => (
          <div key={group.label} className={cn(groupIndex > 0 && 'mt-4')}>
            <h3 className="px-3 mb-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {group.label}
            </h3>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={closeMobile}
                    className={cn(
                      'group relative flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                    )}
                  >
                    <item.icon className={cn(
                      'w-4 h-4 transition-all duration-200',
                      !isActive && 'group-hover:text-primary-500 dark:group-hover:text-primary-400'
                    )} />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className={cn(
                        'px-1.5 py-0.5 text-[10px] font-semibold rounded-md',
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : 'bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400'
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-3">
        {/* User Card with Actions */}
        <div className="relative bg-gray-50/80 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200/50 dark:border-gray-700/30">
          {/* User Info Row */}
          <div className="relative flex items-center gap-3 mb-3">
            <div className="w-9 h-9 flex-shrink-0 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-semibold text-xs shadow-md shadow-primary-500/25">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Action Icons Row */}
          <div className="relative flex items-center gap-1.5">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex-1 p-2 bg-white/80 dark:bg-gray-700/40 hover:bg-primary-50 dark:hover:bg-primary-500/10 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-all flex items-center justify-center group"
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4 group-hover:rotate-45 transition-transform" /> : <Moon className="w-4 h-4 group-hover:-rotate-12 transition-transform" />}
            </button>

            {/* Settings */}
            <Link
              href="/settings"
              onClick={closeMobile}
              className="flex-1 p-2 bg-white/80 dark:bg-gray-700/40 hover:bg-primary-50 dark:hover:bg-primary-500/10 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-all flex items-center justify-center group"
              title="Settings"
            >
              <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            </Link>

            {/* Sign Out */}
            <button
              onClick={logout}
              className="flex-1 p-2 bg-white/80 dark:bg-gray-700/40 hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-all flex items-center justify-center group"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 flex items-center px-4 gap-3">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="LifeOS" width={32} height={32} className="rounded-lg" />
          <span className="font-semibold text-gray-900 dark:text-white">LifeOS</span>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={closeMobile}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ease-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar - Floating Glass Panel */}
      <aside className="hidden lg:flex lg:flex-col fixed top-3 left-3 bottom-3 z-40 w-[260px] bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-gray-700/50 shadow-xl shadow-black/5 dark:shadow-black/20">
        <SidebarContent />
      </aside>
    </>
  );
}
