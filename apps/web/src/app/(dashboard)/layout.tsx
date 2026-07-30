'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useNotificationStore } from '@/stores/notification.store';
import { cn } from '@/lib/cn';
import { NotificationBell } from './components/notification-bell';

const DEFAULT_LOGO = '/hayo-logo.jpg';

function useTenantLogo(hasLogo: boolean | undefined) {
  const [url, setUrl] = useState<string>(DEFAULT_LOGO);
  useEffect(() => {
    if (!hasLogo) {
      setUrl(DEFAULT_LOGO);
      return;
    }
    let blobUrl: string | null = null;
    let cancelled = false;
    api
      .getFileUrl('/tenant/profile/logo')
      .then((u) => {
        if (cancelled) {
          URL.revokeObjectURL(u);
          return;
        }
        blobUrl = u;
        setUrl(u);
      })
      .catch(() => setUrl(DEFAULT_LOGO));
    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [hasLogo]);
  return url;
}
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  ArrowLeftRight,
  Landmark,
  BarChart3,
  DollarSign,
  Calendar,
  Users,
  UserCircle,
  UserCog,
  Layers,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  Receipt,
  ShoppingCart,
  CreditCard,
  Wallet,
  Scale,
  Table,
  TrendingUp,
  ScrollText,
  FileSpreadsheet,
  ClipboardList,
  ClipboardCheck,
  Activity,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { name: string; href: string; icon: React.ComponentType<{ className?: string }> }[];
  roles?: string[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Chart of Accounts', href: '/dashboard/accounts', icon: BookOpen },
  { name: 'Contacts', href: '/dashboard/contacts', icon: UserCircle },
  { name: 'Account Managers', href: '/dashboard/account-managers', icon: UserCog },
  {
    name: 'Vouchers',
    href: '/dashboard/vouchers',
    icon: FileText,
    children: [
      { name: 'Sales Invoice', href: '/dashboard/vouchers/sales-invoice', icon: Receipt },
      { name: 'Purchase Invoice', href: '/dashboard/vouchers/purchase-invoice', icon: ShoppingCart },
      { name: 'Payment Voucher', href: '/dashboard/vouchers/new?type=PAYMENT', icon: CreditCard },
      { name: 'Receipt Voucher', href: '/dashboard/vouchers/new?type=RECEIPT', icon: Wallet },
    ],
  },
  { name: 'Invoice Netting', href: '/dashboard/netting-cycles', icon: ArrowLeftRight },
  { name: 'Journal Entries', href: '/dashboard/journal', icon: ArrowLeftRight },
  { name: 'Bank Reconciliation', href: '/dashboard/bank', icon: Landmark },
  {
    name: 'Reports',
    href: '/dashboard/reports',
    icon: BarChart3,
    children: [
      { name: 'Trial Balance', href: '/dashboard/reports?report=trial-balance', icon: Scale },
      { name: 'Balance Sheet', href: '/dashboard/reports?report=balance-sheet', icon: Table },
      { name: 'Income Statement', href: '/dashboard/reports?report=income-statement', icon: TrendingUp },
      { name: 'Statement of Account', href: '/dashboard/reports?report=statement-of-account', icon: ScrollText },
      { name: 'Invoice Report', href: '/dashboard/reports?report=invoice-report', icon: FileSpreadsheet },
      { name: 'AR Report', href: '/dashboard/reports?report=ar-report', icon: ClipboardList },
      { name: 'AP Report', href: '/dashboard/reports?report=ap-report', icon: ClipboardCheck },
      { name: 'Netting Report', href: '/dashboard/reports/netting', icon: ArrowLeftRight },
    ],
  },
  { name: 'Currencies', href: '/dashboard/currencies', icon: DollarSign },
  { name: 'Fiscal Years', href: '/dashboard/fiscal-years', icon: Calendar },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { name: 'Users', href: '/dashboard/users', icon: Users, roles: ['OWNER', 'FINANCE_MANAGER', 'ASSISTANT_MANAGER_BILLING'] },
  { name: 'Activity Logs', href: '/dashboard/activity-logs', icon: Activity, roles: ['OWNER', 'FINANCE_MANAGER'] },
  { name: 'Business Units', href: '/dashboard/business-units', icon: Layers },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, tenant, logout, _hasHydrated, bootstrap } = useAuthStore();
  const resetNotifications = useNotificationStore((s) => s.reset);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['Vouchers', 'Reports']);
  const logoUrl = useTenantLogo(tenant?.hasLogo);

  const toggleSection = (name: string) => {
    setExpandedSections((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  // Resolve the session against the API (httpOnly cookie). On a 401, lib/api.ts redirects to Microsoft.
  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) {
      // Fallback if bootstrap resolved without a session (e.g. a non-401 failure).
      window.location.href = '/login';
    } else if (tenant?.status === 'PENDING_SETUP') {
      router.replace('/setup');
    }
  }, [_hasHydrated, isAuthenticated, tenant, router]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (!_hasHydrated || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    resetNotifications();
    router.push('/login?signedOut=1');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile header bar */}
      <div className="fixed inset-x-0 top-0 z-20 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex flex-1 items-center">
          <img src={logoUrl} alt={tenant?.name || 'Logo'} className="h-7 w-auto" />
        </div>
        <NotificationBell />
      </div>

      {/* Backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 md:relative md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <img
            src={logoUrl}
            alt={tenant?.name || 'Logo'}
            className="h-8 w-auto"
          />
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navigation.filter((item) => !item.roles || item.roles.includes(user?.role ?? '')).map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const isExpanded = expandedSections.includes(item.name);
              const hasChildren = item.children && item.children.length > 0;

              return (
                <li key={item.name}>
                  {hasChildren ? (
                    <>
                      <div className="flex items-center">
                        <Link
                          href={item.href}
                          className={cn(
                            'flex flex-1 items-center gap-3 rounded-l-lg px-3 py-2 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                          )}
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          {item.name}
                        </Link>
                        <button
                          onClick={() => toggleSection(item.name)}
                          className={cn(
                            'rounded-r-lg px-2 py-2 transition-colors',
                            isActive
                              ? 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                              : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600',
                          )}
                        >
                          <ChevronDown
                            className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')}
                          />
                        </button>
                      </div>
                      {isExpanded && (
                        <ul className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-3">
                          {item.children!.map((child) => {
                            const isChildActive = pathname === child.href;
                            return (
                              <li key={child.name}>
                                <Link
                                  href={child.href}
                                  className={cn(
                                    'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                                    isChildActive
                                      ? 'bg-primary-50 text-primary-700'
                                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                                  )}
                                >
                                  <child.icon className="h-4 w-4 shrink-0" />
                                  {child.name}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {item.name}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-200 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 pt-14 md:pt-0">
        {/* Desktop top bar */}
        <div className="hidden border-b border-gray-200 bg-white md:block">
          <div className="flex h-14 items-center justify-end px-8">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {user?.firstName} {user?.lastName}
              </span>
              <NotificationBell />
            </div>
          </div>
        </div>
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
