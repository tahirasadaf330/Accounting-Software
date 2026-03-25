'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useNotificationStore } from '@/stores/notification.store';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/cn';
import {
  Bell,
  FileText,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Check,
} from 'lucide-react';

const POLL_INTERVAL = 30_000;

const typeConfig: Record<string, { icon: typeof Bell; colorClass: string }> = {
  VOUCHER_SUBMITTED: { icon: FileText, colorClass: 'text-yellow-500' },
  VOUCHER_APPROVED: { icon: CheckCircle2, colorClass: 'text-green-500' },
  VOUCHER_REJECTED: { icon: XCircle, colorClass: 'text-red-500' },
  VOUCHER_REVERSED: { icon: RotateCcw, colorClass: 'text-purple-500' },
};

function formatTimeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function NotificationBell() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const notifications = useNotificationStore((s) => s.notifications);
  const isDropdownOpen = useNotificationStore((s) => s.isDropdownOpen);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Poll unread count
  useEffect(() => {
    if (!isAuthenticated) return;

    useNotificationStore.getState().fetchUnreadCount();
    const interval = setInterval(() => {
      useNotificationStore.getState().fetchUnreadCount();
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isDropdownOpen) {
      useNotificationStore.getState().fetchNotifications();
    }
  }, [isDropdownOpen]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!dropdownRef.current) return;

      // Skip if this instance is hidden (e.g. mobile bell hidden on desktop)
      const rect = dropdownRef.current.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      if (!dropdownRef.current.contains(e.target as Node)) {
        useNotificationStore.getState().setDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleNotificationClick = (
    notification: (typeof notifications)[0],
  ) => {
    // Navigate immediately, don't block on API call
    useNotificationStore.getState().setDropdownOpen(false);

    if (notification.referenceType === 'VOUCHER' && notification.referenceId) {
      router.push(`/dashboard/vouchers/${notification.referenceId}`);
    }

    // Mark as read in background (fire-and-forget)
    if (!notification.isRead) {
      useNotificationStore.getState().markAsRead(notification.id);
    }
  };

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    useNotificationStore.getState().markAllAsRead();
  };

  const toggleDropdown = () => {
    useNotificationStore.getState().setDropdownOpen(!isDropdownOpen);
  };

  const displayCount = unreadCount > 99 ? '99+' : unreadCount;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {displayCount}
          </span>
        )}
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
              >
                <Check className="h-3 w-3" />
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => {
                const config = typeConfig[notification.type] || {
                  icon: Bell,
                  colorClass: 'text-gray-500',
                };
                const Icon = config.icon;

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50',
                      !notification.isRead && 'bg-primary-50/50',
                    )}
                  >
                    <Icon
                      className={cn('mt-0.5 h-5 w-5 shrink-0', config.colorClass)}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'text-sm',
                          notification.isRead
                            ? 'text-gray-600'
                            : 'font-medium text-gray-900',
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 p-2">
            <button
              onClick={() => {
                useNotificationStore.getState().setDropdownOpen(false);
                router.push('/dashboard/notifications');
              }}
              className="w-full rounded-md px-3 py-2 text-center text-sm font-medium text-primary-600 hover:bg-primary-50"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
